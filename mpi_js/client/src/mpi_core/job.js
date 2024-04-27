import { Packet } from "./packet.js";
import { create_crossbar, create_ring, create_tree } from "./interconnects.js";

export class Job {
    constructor(
        smartdashboard_callback_box,
        num_proc,
        global_router,
        interconnect_type = "ring",
        enable_smartdashboard = true,
        enable_diagnostics = true,
        set_finish_status,
    ) {
        this.global_router = global_router;
        this.program_path = "./mpi_core/workspace/" + this.global_router.program_path;
        this.gr_routing_table = this.global_router.routing_table;
        this.my_gr_id = this.global_router.gr_id;
        this.nr_offset = this.global_router.nr_offset;
        this.nr_offsets = this.global_router.nr_offsets;
        this.num_total_nodes = this.global_router.num_total_nodes;
        this.optimized = this.global_router.optimized;
        this.set_finish_status = set_finish_status;

        this.smartdashboard_callback = smartdashboard_callback_box.callback;
        enable_smartdashboard |= enable_diagnostics;

        // const assert_is_int = (num) => { if (!Number.isInteger(num)) throw new Error("Expected an integer"); }
        console.log("Setting up job", this.program_path);
        console.log("global_router", this.global_router)
        console.log("gr_routing_table", this.gr_routing_table);
        console.log("my_gr_id", this.my_gr_id);
        console.log("nr_offset", this.nr_offset);
        console.log("num_total_nodes", this.num_total_nodes);
        let workers = {};
        const global_nodes = Array.from({ length: this.num_total_nodes }, (_, i) => i);
        const local_nodes = global_nodes.slice(this.nr_offset, this.nr_offset + num_proc);
        let routing_tables = {};
        let { edges, routing_tables: routing_tables_arr } = interconnect_type === "crossbar" ? create_crossbar(num_proc) :
            (interconnect_type === "ring" ? create_ring(num_proc) : create_tree(num_proc));
        edges = edges.map((edge) => edge.map((node) => node + this.nr_offset));
        const get_padding = (length, value) => Array.from({ length }, () => value);
        routing_tables_arr.forEach((table, idx) => {
            const pre_padding = get_padding(this.nr_offset, this.nr_offset + idx);
            const offset_table = table.map((node) => node + this.nr_offset);
            const post_padding = get_padding(this.num_total_nodes - num_proc - this.nr_offset, this.nr_offset + idx);
            routing_tables[this.nr_offset + idx] = pre_padding.concat(offset_table).concat(post_padding);
        });
        console.log("edges", edges)
        console.log("routing_tables", routing_tables);

        Object.keys(routing_tables).forEach((i) => {
            i = parseInt(i);
            workers[i] = new Worker(this.program_path);
            workers[i].postMessage({ command: "init_variable", name: "my_pid", value: i });
            workers[i].postMessage({ command: "init_variable", name: "my_gr_id", value: this.my_gr_id });
            workers[i].postMessage({ command: "init_variable", name: "my_nr_id", value: i - this.nr_offset });
            workers[i].postMessage({ command: "init_variable", name: "my_nr_offset", value: this.nr_offset });
            workers[i].postMessage({ command: "init_variable", name: "local_num_proc", value: num_proc });
            workers[i].postMessage({ command: "init_variable", name: "global_num_proc", value: this.num_total_nodes });
            workers[i].postMessage({ command: "init_variable", name: "local_neighbors", value: local_nodes.filter((node) => node !== i) });
            workers[i].postMessage({ command: "init_variable", name: "gr_neighbors", value: this.nr_offsets.filter((node) => node !== this.nr_offsets[this.my_gr_id]) });
            workers[i].postMessage({ command: "init_variable", name: "all_neighbors", value: global_nodes.filter((node) => node !== i) });
            workers[i].postMessage({ command: "init_variable", name: "local_channels", value: {} });
            workers[i].postMessage({ command: "init_variable", name: "routing_table", value: routing_tables[i] });
            workers[i].postMessage({ command: "init_variable", name: "interconnect_type", value: interconnect_type });
            workers[i].postMessage({ command: "init_variable", name: "enable_smartdashboard", value: enable_smartdashboard });
            workers[i].postMessage({ command: "init_variable", name: "enable_diagnostics", value: enable_diagnostics });
            workers[i].postMessage({ command: "init_variable", name: "optimized", value: this.optimized });
            workers[i].onmessage = this.on_nr_message;
        });

        for (const [node1, node2] of edges) {
            const channel = new MessageChannel();
            workers[node1].postMessage({ command: "init_channel", port: channel.port1, portPid: node2 }, [channel.port1]);
            workers[node2].postMessage({ command: "init_channel", port: channel.port2, portPid: node1 }, [channel.port2]);
        }

        Object.keys(workers).forEach((idx) => workers[idx].postMessage({ command: "init_finished" }));
        console.log("Main UI Sending start message to worker")
        this.workers = workers;
        this.global_router.workers = workers;
    }


    on_nr_message = async (msg) => {
        msg = msg.data;
        // console.log("Main UI received msg", msg, "from worker", msg.src_pid, JSON.stringify(msg));
        if (msg.tag === "reschedule") {
            msg.dest_pid_arr.forEach((idx) => this.workers[idx].postMessage(new Packet(msg.src_pid, [idx], "reschedule", null)));
        } else if (msg.tag === "MPI_Smartdashboard") {
            this.smartdashboard_callback({ pid: msg.src_pid, data: msg.data });
        } else if (msg.tag === "abort") {
            Object.keys(this.workers).forEach((idx) => this.workers[idx].terminate());
            console.log("MPI_ABORT");
            window.location.reload();
        } else if (msg.tag === "MPI_Finalize") {
            this.set_finish_status();
        } else if (msg.dest_pid_arr.includes(msg.src_pid)) {
            this.workers[msg.src_pid].postMessage(new Packet(msg.src_pid, [msg.src_pid], msg.tag, msg.data));
        } else {
            this.global_router.send_to_gr(msg);
        }
    }
}

