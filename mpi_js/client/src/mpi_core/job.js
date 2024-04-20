import { Packet } from "./packet.js";
import { create_crossbar, create_ring, create_tree } from "./interconnects.js";

export class Job {
    constructor(smartdashboard_callback_box,
        path,
        num_proc,
        url,
        global_router,
        interconnect_type = "ring",
        enable_smartdashboard = true,
        enable_diagnostics = true,
        optimized = true,
    ) {
        this.global_router = global_router;
        this.url = url;
        this.smartdashboard_callback = smartdashboard_callback_box.callback;
        enable_smartdashboard |= enable_diagnostics;

        this.establish_gr_connection().then(() => {
            this.set_up_worker(num_proc, this.nr_id_base);
        });
    }

    async set_up_worker(num_total_nodes, my_nr_offset) {
        console.log("Setting up job");
        let workers = []
        const global_nodes = Array.from({ length: num_total_nodes }, (_, i) => i);
        const local_nodes = global_nodes.slice(my_nr_offset, my_nr_offset + num_proc);
        const empty_array = Array.from({ length: num_proc }, () => []);

        let { edges, routing_tables } = interconnect_type === "crossbar" ? create_crossbar(num_proc) :
            (interconnect_type === "ring" ? create_ring(num_proc) : create_tree(num_proc));

        edges = edges.map((edge) => edge.map((node) => node + my_nr_offset));
        routing_tables.map((table, idx) => table[idx] = -1);


        for (let i = 0; i < num_proc; i++) {
            const worker = new Worker(path);
            worker.postMessage({ command: "init_variable", name: "my_pid", value: i });
            worker.postMessage({ command: "init_variable", name: "num_proc", value: num_proc });
            worker.postMessage({ command: "init_variable", name: "local_nodes", value: local_nodes });
            worker.postMessage({ command: "init_variable", name: "global_nodes", value: global_nodes });
            worker.postMessage({ command: "init_variable", name: "local_channels", value: empty_array });
            worker.postMessage({ command: "init_variable", name: "local_routing_table", value: routing_tables[i] });
            worker.postMessage({ command: "init_variable", name: "interconnect_type", value: interconnect_type });
            worker.postMessage({ command: "init_variable", name: "enable_smartdashboard", value: enable_smartdashboard });
            worker.postMessage({ command: "init_variable", name: "enable_diagnostics", value: enable_diagnostics });
            worker.postMessage({ command: "init_variable", name: "optimized", value: optimized });

            worker.onmessage = this.on_message;
            workers.push(worker);
        }

        for (const [node1, node2] of edges) {
            const channel = new MessageChannel();
            workers[node1].postMessage({ command: "init_channel", port: channel.port1, portPid: node2 }, [channel.port1]);
            workers[node2].postMessage({ command: "init_channel", port: channel.port2, portPid: node1 }, [channel.port2]);
        }

        workers.forEach((w) => w.postMessage({ command: "init_finished" }));
        console.log("Main UI Sending start message to worker")
        workers.forEach((worker, idx) => worker.postMessage(new Packet(-1, [idx], "start", null)));
        this.workers = workers;
    }

    on_message_from_nr = async (msg) => {
        msg = msg.data;
        // console.log("Main UI received msg", msg, "from worker", msg.src_pid, JSON.stringify(msg));
        if (msg.dest_pid_arr.includes(msg.src_pid)) {
            if (msg.tag === "reschedule") {
                msg.dest_pid_arr.forEach((idx) => this.workers[idx].postMessage(new Packet(msg.src_pid, [idx], "reschedule", null)));
            } else if (msg.tag === "MPI_Smartdashboard") {
                this.smartdashboard_callback({ pid: msg.src_pid, data: msg.data });
            } else {
                // send message to GR server
                const dests = msg.dest_pid_arr;

                let gr_messages = {}; // group dests by GR id

                dests.forEach((idx) => {
                    const gr_id = this.global_router.routing_table[idx];
                    if (!(gr_id in gr_messages)) {
                        gr_messages[gr_id] = [];
                    }
                    gr_messages[gr_id].push(idx); // don't need translation
                });

                for (const [gr_recv, dests] of Object.entries(gr_messages)) {
                    // (gr_id, associated nr ids)
                    let data = new Packet(msg.src_pid, dests, msg.tag, msg.data);
                    const message = {
                        gr_sender: this.global_router.gr_id,
                        gr_reciever: gr_recv,
                        data,
                    };

                    this.global_router.send_to_gr(message);
                }
            }
        }

    }
}

