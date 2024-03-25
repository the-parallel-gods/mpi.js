let ports = [];
let pid = -1;
onmessage = function (event) {
    const data = event.data;
    if (data.command === 'init_port') {
        ports[data.portPid] = data.port;
        data.port.onmessage = function (e) {
            console.log('received in worker', pid, ":", e.data);
        }
    } else if (data.command === 'init') {
        ports.length = data.num_processes;
        pid = data.pid;
    } else if (data.command === 'start_job') {
        console.log('Worker', pid, 'starting job');
        for (let i = 0; i < ports.length; i++) {
            if (i === pid) continue;
            ports[i].postMessage(`Sent from worker ${pid} to worker ${i}`);
        }
    }
};