importScripts('/mpi_core/mpi.js');
importScripts('./magic_number.js');

run(async () => {
    console.log("running main_fn");
    await MPI_Barrier();
    await MPI_Barrier();
    sendMsg({ info: "Barrier ended! Hello from sqrt!!!!", magic_number: MAGIC_NUMBER });
}, self);

console.log("sqrt init");