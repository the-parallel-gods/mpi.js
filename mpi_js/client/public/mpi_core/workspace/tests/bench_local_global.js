importScripts('/mpi_core/mpi.js');

main(async () => {
    await MPI_Init();
    const size_ptr = box(0);
    await MPI_Comm_size(size_ptr);

    const rank_ptr = box(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        console.log("num_procs", size_ptr.data);
    }

    // let start_time;
    // start_time = performance.now();
    // rank_ptr.data === 0 && console.log("bcast start");
    // for (let j = 0; j < 100; j++) {
    //     const data_ptr = box(rank_ptr.data);
    //     await MPI_Bcast(data_ptr, 0);
    // }
    // await MPI_Barrier();
    // rank_ptr.data === 0 && console.log("bcast time", performance.now() - start_time, "ms");

    // start_time = performance.now();
    // rank_ptr.data === 0 && console.log("reduce start");
    // for (let j = 0; j < 100; j++) {
    //     const send_ptr = box(Array.from({ length: 1000 }, () => Math.random()));
    //     const recv_ptr = box(null);
    //     await MPI_Reduce(send_ptr, recv_ptr, (a, b) => a + b, 0);
    // }
    // rank_ptr.data === 0 && console.log("reduce time", performance.now() - start_time, "ms");
    // await MPI_Barrier();

    start_time = performance.now();
    rank_ptr.data === 0 && console.log("barrier start");
    for (let j = 0; j < 1; j++) {
        await MPI_Barrier();
        await MPI_Barrier(true);
    }
    await MPI_Barrier();
    rank_ptr.data === 0 && console.log("barrier time", performance.now() - start_time, "ms");
    rank_ptr.data === 0 && console.log("Test done");
    await MPI_Finalize();
}, self);