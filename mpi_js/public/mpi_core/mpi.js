importScripts('/mpi_core/barrier.js');

let my_pid = -1;
let channels = [];
let program = null;
let blocking_resume_callback = async () => { };

const send = (src_pid, dest_pid, msg) => {
    console.log('sending in worker', pid, ":", msg);
    channels[pid].postMessage({ src: src_pid, dest: dest_pid, msg });
}

const on_receive = (src_pid, dest_pid, msg) => {
    console.log("from", src_pid, "to", dest_pid, ":", msg);
}

const run = (main_fn, their_self) => {
    program = their_self;
    their_self.onmessage = async (event) => {
        const data = event.data;
        console.log('MPI lib Received data', data);
        if (data.command === "start") {
            console.log("MPI lib Calling user main_fn");
            await main_fn();
            console.log("MPI lib Done calling user main_fn");
        } else if (data.command === "barrier") {
            console.log("MPI lib Calling user barrier");
            await blocking_resume_callback();
            console.log("MPI lib Done calling user barrier");
        } else if (data.command === 'init_channel') {
            channels[data.portPid] = data.port;
            data.port.onmessage = function (e) {
                if (e.data.dest === my_pid) {
                    on_receive(data.portPid, e.data.msg);
                } else {
                    send(data.portPid, e.data.dest, e.data.msg);
                }
            }
        }
    }
}

const sendMsg = (msg) => {
    console.log('MPI lib sending user message', msg);
    program.postMessage(msg);
}