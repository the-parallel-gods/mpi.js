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

    const start_time = performance.now();
    console.log("start_time", start_time, "rank", rank_ptr.data)
    for (let j = 0; j < 100; j++) {
        const send_ptr = box([1, 2, 3, 4]);
        const recv_ptr = box(null);
        await MPI_Reduce(send_ptr, recv_ptr, (a, b) => a + b, 0);
        console.log("rank", rank_ptr.data, "reduce recv", recv_ptr.data);

        send_ptr.data = Array.from({ length: 1000 }, () => Math.random());
        await MPI_Allreduce(send_ptr, recv_ptr, (a, b) => a + b);
        console.log("rank", rank_ptr.data, "allreduce recv", recv_ptr.data);
    }
    const end_time = performance.now();
    console.log("rank", rank_ptr.data, "time", end_time - start_time, "ms");
    await MPI_Finalize();
}, self);