import { Packet } from "./packet.js";
export class GlobalRouter {
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
        this.buffer = new ProducerConsumer();
        this.global_channel.onmessage = (event) => { this.buffer.produce(event.data); }
        this.local_channels.forEach((channel) => {
            channel.onmessage = (event) => { this.buffer.produce(event.data); }
        });
    }

    num_hops = async (dest_pid) => {
        return this.hops_table[dest_pid];
    }

    send = async (dest_pid_arr, tag = "NA", data = "") => {
        await Promise.all(dest_pid_arr.map((dest_pid) => {
            const packet = new Packet(this.my_pid, dest_pid_arr, tag, data);
            if (dest_pid === -1) this.global_channel.postMessage(packet);
            else this.local_channels[dest_pid].postMessage(packet);
        }));
    }

    receive = async (src_pid = null, tag = null) => {
        return await this.buffer.consume(src_pid, tag);
    }

    bcast = async (data) => {
        await this.send(this.node_partition.flat(Infinity).filter((pid) => pid !== this.my_pid), data);
    }
}

class Map2D {
    constructor() {
        this.ab_map = {};
        this.ba_map = {};
    }

    add(a, b, value) {
        this.ab_map[a] || (this.ab_map[a] = {});
        this.ba_map[b] || (this.ba_map[b] = {});
        this.ab_map[a][b] || (this.ab_map[a][b] = []);
        this.ba_map[b][a] || (this.ba_map[b][a] = []);
        this.ab_map[a][b].push(value);
        this.ba_map[b][a].push(value);
    }

    get(a = null, b = null) { // null means wildcard, return one such value
        if (a !== null && b !== null) {
            if (this.ab_map[a] && this.ab_map[a][b])
                return this.ab_map[a][b][0];
        } else if (a !== null) {
            if (this.ab_map[a])
                for (const b in this.ab_map[a])
                    return this.ab_map[a][b][0];
        } else if (b !== null) {
            if (this.ba_map[b])
                for (const a in this.ba_map[b])
                    return this.ba_map[b][a][0];
        } else {
            for (const a in this.ab_map)
                for (const b in this.ab_map[a])
                    return this.ab_map[a][b][0];
        }
        return null;
    }

    pop(a = null, b = null) {
        const result = this.get(a, b);
        if (!result) return null;

        this.ab_map[a][b].shift();
        this.ba_map[b][a].shift();
        this.ab_map[a][b].length === 0 && delete this.ab_map[a][b];
        this.ba_map[b][a].length === 0 && delete this.ba_map[b][a];
        Object.keys(this.ab_map[a]).length === 0 && delete this.ab_map[a];
        Object.keys(this.ba_map[b]).length === 0 && delete this.ba_map[b];
        return result;
    }
}

class ProducerConsumer {
    constructor() {
        this.buffer = new Map2D();
        this.callbacks = new Map2D();
    }

    async produce(object) {
        const pid = object.src_pid, tag = object.tag;
        const callback =
            this.callbacks.pop(pid, tag) ||
            this.callbacks.pop("*", tag) ||
            this.callbacks.pop(pid, "*");

        if (callback) callback(object);
        else this.buffer.add(pid, tag, object)
    }


    async consume(src_pid = null, tag = null) {
        return await new Promise((resolve) => {
            const src_pid_sign = src_pid !== null ? src_pid : "*", tag_sign = tag !== null ? tag : "*";
            const result = this.buffer.pop(src_pid, tag);
            if (result) return resolve(result);
            this.callbacks.add(src_pid_sign, tag_sign, resolve);
        });
    }
}
