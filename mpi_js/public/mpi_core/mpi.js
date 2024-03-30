importScripts('/mpi_core/barrier.js');

let program = null;
let blocking_resume_callback = async () => { };

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
        }
    }
}

const sendMsg = (msg) => {
    console.log('MPI lib sending user message', msg);
    program.postMessage(msg);
}