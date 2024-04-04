import React from 'react'

export default function Job(path = "./mpi_core/workspace/sqrt/main.js", num_proc = 4) {
    React.useEffect(() => {
        console.log("Starting job");
        let workers = []
        for (let i = 0; i < num_proc; i++) {
            const worker = new Worker(path);
            workers.push(worker);

            worker.onmessage = async (m) => {
                console.log("Main UI received msg", m.data.foo);
                if (m.data.command === "barrier") {
                    console.log("Main UI received barrier");
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    console.log("Main UI continuing barrier")
                    worker.postMessage({ command: "barrier", status: "end" });
                }
            };
        }

        // create channels:
        for (let i = 0; i < num_processes; i++) {
            for (let j = i + 1; j < num_processes; j++) {
                const channel = new MessageChannel();
                workers[i].postMessage({ command: "init_channel", port: channel.port1, portPid: j }, [channel.port1]);
                workers[j].postMessage({ command: "init_channel", port: channel.port2, portPid: i }, [channel.port2]);
            }
        }


        // console.log("Main UI Sending start message to worker")
        // worker.postMessage({ command: "start", foo: "bar" });
    }, []);
    return (
        <div></div>
    )
}
