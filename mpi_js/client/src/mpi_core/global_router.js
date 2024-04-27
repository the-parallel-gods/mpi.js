import { Packet } from "./packet.js";
export class GlobalRouter {
    constructor() { }

    init(url, set_gr_id_callback) {
        return new Promise((resolve) => {
            const ws_url = `ws://${url}:8001`;
            console.log("connecting to", ws_url);

            this.ws = new WebSocket(ws_url);

            this.ws.onopen = () => {
                console.log("God node connection established");
            }

            this.ws.onclose = () => {
                alert("Disconnected from God Server. Please reload window.")
                window.location.reload();
                set_gr_id_callback(-2);
            }

            this.ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                // console.log("gr message received", message)
                if (message.gr_id !== undefined) {
                    this.gr_id = message.gr_id;
                    set_gr_id_callback(this.gr_id);
                    console.log("this.gr_id received", this.gr_id);
                } else if (message.routing_table !== undefined) {
                    this.routing_table = message.routing_table;
                    this.optimized = message.optimized;
                    this.program_path = message.program_path;
                    this.num_total_nodes = Object.keys(this.routing_table).length;
                    this.nr_offsets = [0];
                    for (let i = 1; i < Object.keys(this.routing_table).length; i++)
                        if (this.routing_table[i] !== this.routing_table[i - 1])
                            this.nr_offsets.push(i);
                    this.nr_offset = this.nr_offsets[this.gr_id];
                    console.log("optimized", this.optimized, "nr_offsets", this.nr_offsets, "nr_offset", this.nr_offset, "num_total_nodes", this.num_total_nodes, "program_path", this.program_path, "routing_table", this.routing_table);
                    resolve(this);
                } else {
                    const packet = message.data;
                    // console.log("latency", Date.now() - message.timestamp, packet);
                    packet.dest_pid_arr.forEach((dest_pid) => {
                        const nr_message = new Packet(packet.src_pid, [dest_pid], packet.tag, packet.data);
                        this.workers[dest_pid].postMessage(nr_message);
                    });
                }
            }
        });
    }

    start(num_proc, program_path, optimized) {
        this.ws.send(JSON.stringify({ gr_src: this.gr_id, num_proc, program_path, optimized }));
    }

    set_workers(workers) {
        this.workers = workers;
    }

    send_to_gr = (msg) => {
        let gr_dest_set = new Set();
        msg.dest_pid_arr.forEach((pid) => { gr_dest_set.add(this.routing_table[pid]); });
        const gr_dest_arr = Array.from(gr_dest_set);
        this.ws.send(JSON.stringify({ gr_src: this.gr_id, gr_dest_arr, data: msg }));
        // this.ws.send(JSON.stringify({ gr_src: this.gr_id, gr_dest_arr, data: msg, timestamp: Date.now() }));
    }
}