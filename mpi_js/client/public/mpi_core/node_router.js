/**
 * Class for representing a packet that can be sent between NodeRouter instances.
 */
class Packet {
    /**
     * @param {number} src_pid The source pid of the packet.
     * @param {number[]} dest_pid_arr The destination pids of the packet.
     * @param {string} tag The tag of the packet.
     * @param {any} data The data of the packet.
     */
    constructor(src_pid, dest_pid_arr, tag, data) {
        this.src_pid = src_pid;
        this.dest_pid_arr = dest_pid_arr;
        this.tag = tag;
        this.data = data;
    }
}


/**
 * Class for a NodeRouter can be used to send and receive packets between workers on this browser tab.
 */
class NodeRouter {
    /**
     * @param {number} num_proc number of workers
     * @param {number} my_pid the pid of this worker
     * @param {number[][]} node_partition partition of workers on each node
     * @param {Record<number, MessagePort>} local_channels channels to peers on the my local node
     * @param {WorkerGlobalScope} global_channel channel to main manager on this node
     */
    constructor(num_proc, my_pid, node_partition, routing_table, local_channels, global_channel) {
        this.num_proc = num_proc;
        this.my_pid = my_pid;
        this.node_partition = node_partition;
        this.routing_table = routing_table;
        this.local_channels = local_channels;
        this.global_channel = global_channel;
        this.buffer = new ProducerConsumer();
        this.global_channel.onmessage = this.#receive_or_forward;
        Object.values(this.local_channels).forEach((channel) => { channel.onmessage = this.#receive_or_forward; });
    }

    /**
     * This is the main function that receives packets from anywhere. 
     * It first checks if the packet is for this worker. If it is, it will
     * consume the packet. If the packet also needs to be forwarded, it will
     * forward the packet to the next hop.
     * 
     * When forwarding to the next hop, it will regroup the destination pids
     * by the next router to eliminate redundant packets with the same message.
     * 
     * @param {MessageEvent} event
     */
    #receive_or_forward = async (event) => {
        diagnostics.add_recv();
        let my_pid_idx = event.data.dest_pid_arr.indexOf(this.my_pid);
        my_pid_idx !== -1 && event.data.dest_pid_arr.splice(my_pid_idx, 1);

        if (event.data.dest_pid_arr.length > 0) {
            let router_map = {};
            for (const dest_pid of event.data.dest_pid_arr) {
                const router_pid = this.routing_table[dest_pid];
                if (!router_map[router_pid]) router_map[router_pid] = [];
                router_map[router_pid].push(dest_pid);
            }
            await Promise.all(Object.keys(router_map).map((router_pid) => {
                router_pid = parseInt(router_pid);
                // console.log(`FWRD: {${event.data.tag}} [${event.data.src_pid}] --> (${router_pid}) --> [${router_map[router_pid]}]`);
                diagnostics.add_send();
                const packet = new Packet(event.data.src_pid, router_map[router_pid], event.data.tag, event.data.data);
                this.local_channels[router_pid].postMessage(packet);
            }));
        }

        my_pid_idx !== -1 && await this.buffer.produce(event.data);
    }

    /**
     * Send a packet to the destination pids. This is a non-blocking function that 
     * returns immediately after sending the packet. The receiving worker can
     * only receive this packet if it is listening for packets with the same tag or ANY tag.
     * 
     * Send to your own pid if you want to send to the global router.
     * 
     * @param {number[]} dest_pid_arr The destination pids of the packet.
     * @param {string} tag The tag of the packet. Default is "NA".
     * @param {any} data The data of the packet. Default is "".
     * @returns {Promise<void>} A promise that resolves when the packet is sent.
     */
    send = async (dest_pid_arr, tag = "NA", data = "") => {
        let router_map = {};
        for (const dest_pid of dest_pid_arr) {
            const router_pid = this.routing_table[dest_pid];
            if (!router_map[router_pid]) router_map[router_pid] = [];
            router_map[router_pid].push(dest_pid);
        }
        await Promise.all(Object.keys(router_map).map((router_pid) => {
            router_pid = parseInt(router_pid);
            // console.log(`SEND: {${tag}} [${this.my_pid}] --> (${router_pid}) --> [${router_map[router_pid]}]`);
            diagnostics.add_send();
            const packet = new Packet(this.my_pid, router_map[router_pid], tag, data);
            if (router_pid === config.my_pid) this.global_channel.postMessage(packet);
            else this.local_channels[router_pid].postMessage(packet);
        }));
    }

    /**
     * Receive a packet from a specific source pid with a specific tag. This is a blocking function
     * that waits until a packet is received from the specified source pid with the specified tag.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet.
     */
    receive = async (src_pid = null, tag = null) => {
        return await this.buffer.consume(src_pid, tag);
    }

    /**
     * Receive a packet from a specific source pid with a specific tag. This is a non-blocking function
     * that returns immediately if a packet is not available from the specified source pid with the specified tag.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet if available, otherwise null.
     */
    receive_if_available = async (src_pid = null, tag = null) => {
        return await this.buffer.consume_if_available(src_pid, tag);
    }

    /**
     * Peek at the packet from a specific source pid with a specific tag. This is a non-blocking function
     * that returns immediately if a packet is not available from the specified source pid with the specified tag.
     * 
     * This function will not remove the packet from the buffer.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet if available, otherwise null.
     */
    peek = async (src_pid = null, tag = null) => {
        return this.buffer.peek(src_pid, tag);
    }

    /**
     * Broadcast a packet to all other workers. This is a non-blocking function that
     * returns immediately after sending the packet. The receiving workers can
     * only receive this packet if they are listening for packets with the same tag or ANY tag.
     * 
     * @param {any} data The data of the packet.
     * @param {string} tag The tag of the packet. Default is "NA".
     * @returns {Promise<void>} A promise that resolves when the packet is sent.
     */
    bcast = async (data, tag = "NA") => {
        await this.send(this.node_partition.flat(Infinity).filter((pid) => pid !== this.my_pid), tag, data);
    }
}

/**
 * Class for a map that can be accessed by two keys. All operations are O(1).
 */
class Map2D {
    /**
     * 
     * The ab_map sorts values by a, then by b. ab_map: a -> b -> [value_arr]
     * 
     * The ba_map sorts values by b, then by a. ba_map: b -> a -> [value_arr]
     * 
     * When adding a value, it is added to both maps.
     * When searching for a value with a certain a_key, the ab_map is searched.
     * When searching for a value with a certain b_key, the ba_map is searched.
     * When a value is popped, it is popped from both maps.
     * 
     * At the cost of twice as many pointers, this allows every operation to be O(1).
     */
    constructor() {
        this.ab_map = {};
        this.ba_map = {};
    }

    /**
     * @typedef {any} Key_A
     */

    /**
     * @typedef {any} Key_B
     */

    /**
     * Add a value to the map with a and b keys.
     * 
     * Complexity: O(1)
     * 
     * @param {Key_A} a The first key.
     * @param {Key_B} b The second key.
     * @param {any} value The value to add.
     */
    add(a, b, value) {
        this.ab_map[a] || (this.ab_map[a] = {});
        this.ba_map[b] || (this.ba_map[b] = {});
        this.ab_map[a][b] || (this.ab_map[a][b] = []);
        this.ba_map[b][a] || (this.ba_map[b][a] = []);
        this.ab_map[a][b].push(value);
        this.ba_map[b][a].push(value);
    }

    /**
     * Get a value from the map with a and b keys. If any key is null, it is a wildcard.
     * Wildcard keys mean it will return the first value it sees, ignoring the 
     * requirement of that key.
     * 
     * Complexity: O(1)
     * 
     * @param {Key_A} a The first key. Default is null, which means wildcard.
     * @param {Key_B} b The second key. Default is null, which means wildcard.
     * @returns {any} The value found. If no value is found, it returns null.
     */
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

    /**
     * Pop a value from the map with a and b keys. If any key is null, it is a wildcard.
     * Wildcard keys mean it will return the first value it sees, ignoring the 
     * requirement of that key.
     * 
     * If a value is foundk, the value is removed from the data structure.
     * 
     * Complexity: O(1)
     * 
     * @param {Key_A} a The first key. Default is null, which means wildcard.
     * @param {Key_B} b The second key. Default is null, which means wildcard.
     * @returns {any} The value found. If no value is found, it returns null.
     */
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

/**
 * Class for a producer-consumer buffer that can be used to send and receive objects between workers.
 */
class ProducerConsumer {
    /**
     * Uses two Map2D objects to store the buffer and the callbacks.
     * This way, each call to produce and consume is O(1).
     * 
     * TLDR: 
     * For each msg that arrives, it O(1) searches for matching callbacks in callbacks Map2D that can match it. 
     * If no one can take it, the msg will be added to the msgs Map2D.
     * 
     * For each consumer callback that is received, it O(1) searches for a msg that can match it. 
     * If no such msg is found, the callback will be added to the callbacks Map2D.
     */
    constructor() {
        this.buffer = new Map2D();
        this.callbacks = new Map2D();
    }

    /**
     * Add a packet to the buffer. If a callback is waiting for a packet with the a matching pid and tag,
     * the callback will be called with the packet. Otherwise, the packet will be added to the buffer.
     * 
     * @param {Packet} object The object to add to the buffer.
     * @returns {Promise<void>} A promise that resolves when the packet is added to the buffer.
     */
    async produce(object) {
        const pid = object.src_pid, tag = object.tag;
        const callback =
            this.callbacks.pop(pid, tag) ||
            this.callbacks.pop("*", tag) ||
            this.callbacks.pop(pid, "*");

        if (callback) callback(object);
        else this.buffer.add(pid, tag, object)
    }

    /**
     * Get a packet from the buffer. If a packet is available with the a matching pid and tag,
     * the packet will be returned. Otherwise, the consumer will wait until a packet is available.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet.
     */
    async consume(src_pid = null, tag = null) {
        return await new Promise((resolve) => {
            const src_pid_sign = src_pid !== null ? src_pid : "*", tag_sign = tag !== null ? tag : "*";
            const result = this.buffer.pop(src_pid, tag);
            if (result) return resolve(result);
            this.callbacks.add(src_pid_sign, tag_sign, resolve);
        });
    }

    /**
     * Get a packet from the buffer if available. If a packet is available with the a matching pid and tag,
     * the packet will be returned. Otherwise, null will be returned immediately. This is a non-blocking function.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet if available, otherwise null.
     */
    async consume_if_available(src_pid = null, tag = null) {
        return this.buffer.pop(src_pid, tag);
    }

    /**
     * Peek at the packet from the buffer. This is a non-blocking function that returns immediately.
     * This function will not remove the packet from the buffer.
     * 
     * @param {number} src_pid The source pid of the packet. Default is null, which means any source pid.
     * @param {string} tag The tag of the packet. Default is null, which means any tag.
     * @returns {Promise<Packet>} A promise that resolves to the received packet if available, otherwise null.
     */
    async peek(src_pid = null, tag = null) {
        return this.buffer.get(src_pid, tag);
    }
}
