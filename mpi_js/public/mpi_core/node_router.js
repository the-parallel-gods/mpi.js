class Packet {
    constructor(src_pid, dest_pid_arr, data) {
        this.src_pid = src_pid;
        this.dest_pid_arr = dest_pid_arr;
        this.data = data;
    }
}


class NodeRouter {
    /**
     * 
     * @param {number} num_proc number of workers
     * @param {number} my_pid the pid of this worker
     * @param {number[][]} node_partition partition of workers on each node
     * @param {MessagePort[]} local_channels channels to peers on the my local node
     * @param {WorkerGlobalScope} global_channel channel to main manager on this node
     * @param {number[][]} local_edges adjacency list of local channels
     */
    constructor(num_proc, my_pid, node_partition, local_channels, global_channel, local_edges) {
        this.num_proc = num_proc;
        this.my_pid = my_pid;
        this.node_partition = node_partition;
        this.local_channels = local_channels;
        this.global_channel = global_channel;
        this.local_edges = local_edges;
        this.hops_table = []
        // populate hops table in constructor? 

        // bfs on local_edges to populate hops_table
        // Write all shortest paths from every node to every other node
        this.buffer = new ProducerConsumer(num_proc);
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
    constructor(num_proc) {
        this.num_proc = num_proc;
        this.consumer_callbacks = [];
        this.buffer = [];
        for (let i = 0; i < num_proc + 1; i++) // for -1 (global)
            this.buffer.push([]);
        for (let i = 0; i < num_proc + 2; i++) // for -1 (global) and num_proc (any_pid)
            this.consumer_callbacks.push([]);
    }

    async produce(object) {
        // console.log("PRODUCE", object);
        const src_pid = object.src_pid + 1;
        if (this.consumer_callbacks[src_pid].length > 0)
            return this.consumer_callbacks[src_pid].shift()(object);
        else if (this.consumer_callbacks[this.num_proc + 1].length > 0)
            return this.consumer_callbacks[this.num_proc + 1].shift()(object);
        this.buffer[src_pid].push(object);
    }


    async consume(src_pid = null) {
        return await new Promise((resolve) => {
            if (src_pid === null) {
                for (let i = 0; i < this.buffer.length; i++)
                    if (this.buffer[i].length > 0)
                        return resolve(this.buffer[i].shift());
                this.consumer_callbacks[this.num_proc + 1].push(resolve);
            } else {
                src_pid = src_pid + 1;
                if (this.buffer[src_pid].length > 0)
                    return resolve(this.buffer[src_pid].shift());
                this.consumer_callbacks[src_pid].push(resolve);
            }
        });
    }
}
