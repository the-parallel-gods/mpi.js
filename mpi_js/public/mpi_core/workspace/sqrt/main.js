importScripts('/mpi_core/mpi.js');
importScripts('./magic_number.js');

run(async () => {
    console.log("running main_fn");

    const rank_ptr = alloc(0);
    await MPI_Comm_rank(rank_ptr);

    const data_ptr = alloc(rank_ptr.data);
    await MPI_Bcast(data_ptr, 0);
    console.log("rank", rank_ptr.data, "received", data_ptr.data);
}, self);

console.log("sqrt init");