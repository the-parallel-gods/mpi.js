class Packet {
    constructor(src_pid, dest_pid_arr, data) {
        this.src_pid = src_pid;
        this.dest_pid_arr = dest_pid_arr;
        this.data = data;
    }
}


class NodeRouter {
    /**
     * my_pid is a number
     * node_partition is a list of list of numbers [[machine 1's node_pids], [machine 2's node_pids], ...]
     * local_channels is a list MessagePort objects (things you can send messages to other machines with)
     * local_edges is a list of [port 1, port 2] pairs (a adjacency list of this machine's channels)
     * on_system_message is a callback function that takes a Packet object
     * 
     * @param {number} my_pid the pid of this worker
     * @param {number[][]} node_partition partition of workers on each node
     * @param {MessagePort[]} local_channels channels to peers on the my local node
     * @param {WorkerGlobalScope} global_channel channel to main manager on this node
     * @param {number[][]} local_edges adjacency list of local channels
     */
    constructor(my_pid, node_partition, local_channels, global_channel, local_edges) {
        this.my_pid = my_pid;
        this.node_partition = node_partition;
        this.local_channels = local_channels;
        this.global_channel = global_channel;
        this.local_edges = local_edges;
        this.hops_table = []
        // populate hops table in constructor? 

        // bfs on local_edges to populate hops_table
        // Write all shortest paths from every node to every other node
        this.buffer = new ProducerConsumer();
        this.global_channel.onmessage = (event) => { this.buffer.produce(event.data); }
        this.local_channels.forEach((channel) => {
            channel.onmessage = (event) => { this.buffer.produce(event.data); }
        });
    }

    num_hops = async (dest_pid) => {
        return this.hops_table[dest_pid];
    }

    send = async (dest_pid_arr, data) => {
        await Promise.all(dest_pid_arr.map((dest_pid) => {
            const packet = new Packet(this.my_pid, dest_pid_arr, data);
            if (dest_pid === -1)
                this.global_channel.postMessage(packet);
            else
                this.local_channels[dest_pid].postMessage(packet);
        }));
    }

    receive_any = async () => {
        return await this.buffer.consume(null);
    }

    receive_from = async (src_pid) => {
        return await this.buffer.consume(src_pid);
    }

    bcast = async (data) => {
        await this.send(this.node_partition.flat(Infinity).filter((pid) => pid !== this.my_pid), data);
    }
}

class ProducerConsumer {
    constructor() {
        this.buffer = [];
        this.consumer_callbacks = [];
    }

    async produce(object) {
        navigator.locks.request("buffer_lock", (lock) => {
            let someone_took_it = false;
            for (let i = 0; i < this.consumer_callbacks.length; i++) {
                if (this.consumer_callbacks[i](object)) {
                    someone_took_it = true;
                    this.consumer_callbacks.splice(i, 1);
                    break;
                }
            }
            if (!someone_took_it) this.buffer.push(object);
        });
    }


    async consume(src_pid = null) {
        // first go through buffer and see if src_pid is in any of them
        // TODO: use hash table for faster lookup
        return await new Promise((resolve) => {
            navigator.locks.request("buffer_lock", (lock) => {
                for (let i = 0; i < this.buffer.length; i++) {
                    if (this.buffer[i].src_pid === src_pid) {
                        const result = this.buffer.splice(i, 1)[0];
                        return resolve(result.data);
                    }
                }

                // if not, wait for a new message
                this.consumer_callbacks.push((packet) => { // protected by producer lock
                    const is_correct_pid = src_pid === null || packet.src_pid === src_pid;
                    is_correct_pid && resolve(packet.data);
                    return is_correct_pid; // if not correct pid, try other consumer
                });
            });
        });
    }
}