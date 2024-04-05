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
        this.buffer = new ProducerConsumer(my_pid);
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
        console.log("send complete")
    }

    receive_any = async () => {
        return await this.buffer.consume(null);
    }

    receive_from = async (src_pid) => {
        console.log(this.my_pid, "waiting for messsage from", src_pid);
        const result = await this.buffer.consume(src_pid);
        console.log(this.my_pid, "received from", src_pid, "data", result, "recv complete");
        return result;
    }

    bcast = async (data) => {
        await this.send(this.node_partition.flat(Infinity).filter((pid) => pid !== this.my_pid), data);
    }
}

class ProducerConsumer {
    constructor(my_pid) {
        this.buffer = [];
        this.consumer_callbacks = [];
        this.my_pid = my_pid;
    }

    async produce(object) {
        navigator.locks.request("buffer_lock", async (lock) => {
            console.log(this.my_pid, "PRODUCING", object, "for", "consumer_callbacks", this.consumer_callbacks);
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
            navigator.locks.request("buffer_lock", async (lock) => {
                console.log(this.my_pid, "checking buffer for", src_pid, "buffer", this.buffer);
                for (let i = 0; i < this.buffer.length; i++) {
                    if (this.buffer[i].src_pid === src_pid) {
                        resolve(this.buffer.splice(i, 1).data);
                    }
                }

                // if not, wait for a new message
                this.consumer_callbacks.push((packet) => { // protected by producer lock
                    console.log(this.my_pid, "checking packet", packet, "for target =", src_pid);
                    const is_correct_pid = src_pid === null || packet.src_pid === src_pid;
                    is_correct_pid && resolve(packet.data);
                    return is_correct_pid; // if not correct pid, try other consumer
                });
                console.log(this.my_pid, "I need pid", src_pid, "added myself to consumer_callbacks", this.consumer_callbacks);
            });
        });
    }
}