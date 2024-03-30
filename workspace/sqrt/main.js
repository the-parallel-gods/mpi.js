importScripts('/mpi_core/mpi.js');

const main = () => {
    console.log("running main_fn");
    sendMsg({ info: "Hello from sqrt!!!!" });
}

init(main, self);

console.log("sqrt init");