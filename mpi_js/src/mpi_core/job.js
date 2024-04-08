// let config = {
// num_workers
// my_pid
// node_partition
// local_channels
// global_channel
// enable_smartdashboard
// enable_diagnostics
// };

class Packet {
    constructor(src_pid, dest_pid_arr, tag, data) {
        this.src_pid = src_pid;
        this.dest_pid_arr = dest_pid_arr;
        this.tag = tag;
        this.data = data;
    }
}

export class Job {
    constructor(path = "./mpi_core/workspace/sqrt/main.js",
        num_proc = 8,
        enable_smartdashboard = true,
        enable_diagnostics = true,
    ) {
        enable_diagnostics &= enable_smartdashboard;
        console.log("Setting up job");
        let workers = []
        const node_list = Array.from({ length: num_proc }, (_, i) => [i]).flat();
        const empty_array = Array.from({ length: num_proc }, () => []);
        for (let i = 0; i < num_proc; i++) {
            const worker = new Worker(path);
            worker.postMessage({ command: "init_variable", name: "my_pid", value: i });
            worker.postMessage({ command: "init_variable", name: "num_proc", value: num_proc });
            worker.postMessage({ command: "init_variable", name: "node_partition", value: node_list });
            worker.postMessage({ command: "init_variable", name: "local_channels", value: empty_array });
            worker.postMessage({ command: "init_variable", name: "enable_smartdashboard", value: enable_smartdashboard });
            worker.postMessage({ command: "init_variable", name: "enable_diagnostics", value: enable_diagnostics });

            worker.onmessage = this.on_message;
            workers.push(worker);
        }

        // create channels:
        for (let i = 0; i < num_proc; i++) {
            for (let j = i + 1; j < num_proc; j++) {
                const channel = new MessageChannel();
                workers[i].postMessage({ command: "init_channel", port: channel.port1, portPid: j }, [channel.port1]);
                workers[j].postMessage({ command: "init_channel", port: channel.port2, portPid: i }, [channel.port2]);
            }
        }
        workers.forEach((w) => w.postMessage({ command: "init_finished" }));

        console.log("Main UI Sending start message to worker")
        // workers.forEach((worker, idx) => worker.postMessage({ src_pid: -1, dest_pid_arr: [idx], data: "start" }));
        workers.forEach((worker, idx) => worker.postMessage(new Packet(-1, [idx], "start", null)));

        // smartdashboard flush signal every "smartdashboard_period" seconds
        // if (enable_smartdashboard) {
        //     setInterval(() => {
        //         workers.forEach((worker, idx) => worker.postMessage(new Packet(-1, [idx], "flush_telemetry", null)));
        //     }, smartdashboard_period);
        // }

    }

    on_message = async (msg) => {
        msg = msg.data;
        console.log("Main UI received msg", msg, "from worker", msg.src_pid);
    }
}

