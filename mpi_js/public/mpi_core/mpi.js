const MAGIC_NUMBER = 37;

let program = null;

const init = (main_fn, their_self) => {
    program = their_self;
    their_self.onmessage = (event) => {
        const data = event.data;
        console.log('MPI lib Received data', data);
        if (data.command === "start") {
            console.log("MPI lib Calling user main_fn");
            main_fn();
            console.log("MPI lib Done calling user main_fn");
        }
    }
}

const sendMsg = (msg) => {
    console.log('MPI lib sending user message', msg);
    program.postMessage(msg);
}