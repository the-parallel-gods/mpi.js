importScripts('/mpi_core/mpi.js');

main(async () => {
    await MPI_Init();
    const rank_ptr = box(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        for (let i = 0; i < 10000000; i++) { const x = Math.sqrt(i); }
        MPI_Send(rank_ptr, 2);
    } else if (rank_ptr.data === 1) {
        for (; ;) { const x = Math.sqrt(i); }
    } else if (rank_ptr.data === 2) {
        console.log("rank", rank_ptr.data, "receiving")
        const data_ptr = box(0);
        await MPI_Recv(data_ptr, 0);
        console.log("rank", rank_ptr.data, "Got message from 0", data_ptr.data);
    }

    console.log("rank", rank_ptr.data, "done");
}, self);