import { Packet } from "./packet.js";
import { create_crossbar, create_ring, create_tree } from "./interconnects.js";

export class Job {
    constructor(smartdashboard_callback_box,
        path,
        num_proc,
        interconnect_type = "ring",
        enable_smartdashboard = true,
        enable_diagnostics = true,
    ) {
        this.smartdashboard_callback = smartdashboard_callback_box.callback;
        enable_smartdashboard |= enable_diagnostics;
        console.log("Setting up job");
        let workers = []
        const node_list = Array.from({ length: num_proc }, (_, i) => [i]).flat();
        const empty_array = Array.from({ length: num_proc }, () => []);

        const { edges, routing_tables } = interconnect_type === "crossbar" ? create_crossbar(num_proc) :
            (interconnect_type === "ring" ? create_ring(num_proc) : create_tree(num_proc));
        routing_tables.map((table, idx) => table[idx] = -1);

        for (let i = 0; i < num_proc; i++) {
            const worker = new Worker(path);
            worker.postMessage({ command: "init_variable", name: "my_pid", value: i });
            worker.postMessage({ command: "init_variable", name: "num_proc", value: num_proc });
            worker.postMessage({ command: "init_variable", name: "node_partition", value: node_list });
            worker.postMessage({ command: "init_variable", name: "local_channels", value: empty_array });
            worker.postMessage({ command: "init_variable", name: "local_routing_table", value: routing_tables[i] });
            worker.postMessage({ command: "init_variable", name: "interconnect_type", value: interconnect_type });
            worker.postMessage({ command: "init_variable", name: "enable_smartdashboard", value: enable_smartdashboard });
            worker.postMessage({ command: "init_variable", name: "enable_diagnostics", value: enable_diagnostics });

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

    on_message = async (msg) => {
        msg = msg.data;
        // console.log("Main UI received msg", msg, "from worker", msg.src_pid, JSON.stringify(msg));
        if (msg.tag === "reschedule")
            msg.dest_pid_arr.forEach((idx) => this.workers[idx].postMessage(new Packet(msg.src_pid, [idx], "reschedule", null)));
        if (msg.tag === "MPI_Smartdashboard")
            this.smartdashboard_callback({ pid: msg.src_pid, data: msg.data });

    }
}

