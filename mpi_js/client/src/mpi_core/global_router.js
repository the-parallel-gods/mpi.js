import { Packet } from "./packet.js";
export class GlobalRouter {
    constructor(url) {
        this.url = url;

        this.ws = new WebSocket(`ws://${this.url}:9001`);

        ws.onopen = () => {
            console.log("GR server connection established");
        }

        ws.onmessage = async (event) => {
            const message = JSON.parse(event.data);
            if ("assigned_id" in message) {
                this.gr_id = message.assigned_id;
            } else if ("nr_id_base" in message) {
                this.nr_id_base = message.nr_id_base;
            } else if ("routing_table" in message) {
                this.routing_table = message.routing_table;
                resolve();
            } else {
                // forward to node router
                const packet = message.data;
                const dests = packet.dest_pid_arr;
                dests.forEach((idx) => {
                    const w = this.workers[idx - this.nr_id_base];
                    const new_message = new Packet(packet.src_pid, [idx], packet.tag, packet.data);
                    w.postMessage(new_message);
                });
            }
        }
    }

    set_workers(workers) {
        this.workers = workers;
    }

    send_to_gr = (message) => {
        this.ws.send(JSON.stringify(message));
    }
}