const num_processes = 128;

// create num_processes workers
let workers = [];
for (let i = 0; i < num_processes; i++) {
    const worker = new Worker('worker.js');
    worker.onmessage = function (event) {
        console.log('Worker', i, 'received:', event.data);
    }
    worker.postMessage({ command: "init", num_processes, pid: i });
    workers.push(worker);
}

console.log('Workers created');

let num_channels = 0;
for (let i = 0; i < num_processes; i++) {
    for (let j = i + 1; j < num_processes; j++) {
        const channel = new MessageChannel();
        workers[i].postMessage({ command: "init_port", port: channel.port1, portPid: j }, [channel.port1]);
        workers[j].postMessage({ command: "init_port", port: channel.port2, portPid: i }, [channel.port2]);
        num_channels++;
    }
}

console.log('Channels created:', num_channels);

// send test to workers one by one, one every 5 seconds
let count = 0;
let interval = setInterval(() => {
    console.log('Sending job to worker', count % num_processes);
    workers[count % num_processes].postMessage({ command: "start_job" });
    count++;
    if (count === num_processes) clearInterval(interval);
}, 1000);