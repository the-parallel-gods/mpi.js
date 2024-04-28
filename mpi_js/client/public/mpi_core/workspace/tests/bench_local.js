importScripts('/mpi_core/mpi.js');

main(async () => {
    await MPI_Init();
    const size_ptr = box(0);
    await MPI_Comm_size(size_ptr);

    const rank_ptr = box(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        console.log("size", size_ptr.data);
    }

    let start_time;
    start_time = performance.now();
    rank_ptr.data === 0 && console.log("bcast start");
    for (let j = 0; j < 100000; j++) {
        const data_ptr = box(Array.from({ length: 100000 }, () => Math.random()));
        await MPI_Bcast(data_ptr, 0);
    }
    await MPI_Barrier();
    rank_ptr.data === 0 && console.log("bcast time", performance.now() - start_time, "ms");

    start_time = performance.now();
    rank_ptr.data === 0 && console.log("allreduce start");
    for (let j = 0; j < 100000; j++) {
        const send_ptr = box(Array.from({ length: 100000 }, () => Math.random()));
        const recv_ptr = box(null);
        await MPI_Allreduce(send_ptr, recv_ptr, (a, b) => a + b);
    }
    rank_ptr.data === 0 && console.log("allreduce time", performance.now() - start_time, "ms");
    await MPI_Barrier();

    start_time = performance.now();
    rank_ptr.data === 0 && console.log("barrier start");
    for (let j = 0; j < 1000000; j++) {
        await MPI_Barrier();
    }
    await MPI_Barrier();
    rank_ptr.data === 0 && console.log("barrier time", performance.now() - start_time, "ms");
    rank_ptr.data === 0 && console.log("Test done");
    await MPI_Finalize();
}, self);