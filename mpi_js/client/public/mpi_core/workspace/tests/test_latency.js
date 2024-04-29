importScripts('/mpi_core/mpi.js');

main(async () => {
    await MPI_Init();
    const size_ptr = box(0);
    await MPI_Comm_size(size_ptr);

    const rank_ptr = box(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        console.log("recv start", Date.now() % 100000, "ms");
        for (let j = 0; j < 10; j++) {
            await node_router.receive(4, "MPI_Barrier_1");
            console.log("recv time", j, Date.now() % 100000, "ms");

        }
    }
    if (rank_ptr.data === 4) {
        console.log("send start", Date.now() % 100000, "ms");
        for (let j = 0; j < 10; j++) {
            await node_router.send([0], "MPI_Barrier_1", "");
            console.log("send time", j, Date.now() % 100000, "ms");
        }
    }
    await MPI_Barrier();
    rank_ptr.data === 0 && console.log("Test done");
    await MPI_Finalize();
}, self);