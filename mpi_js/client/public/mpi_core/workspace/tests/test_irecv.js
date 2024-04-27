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

    const data_ptr = box(42);
    const recv_ptr = box(0);
    if (rank_ptr.data === 0) {
        console.log("rank", rank_ptr.data, "receiving")
        const req = await MPI_Irecv(recv_ptr, 1);
        console.log("rank", rank_ptr.data, "doing other stuff")
        while (true) {
            console.log("rank", rank_ptr.data, "testing");
            const result = await MPI_Test(req);
            console.log("rank", rank_ptr.data, "testing result", result);
            if (result) break;
        }
    } else {
        for (let i = 0; i < 10000000; i++) {
            const x = Math.sqrt(i);
        }
        console.log("rank", rank_ptr.data, "sending")
        await MPI_Send(data_ptr, 0);
    }
    console.log("rank", rank_ptr.data, "finished", recv_ptr.data);

}, self);

// main(async () => {
//     const size_ptr = box(0);
//     await MPI_Comm_size(size_ptr);

//     const rank_ptr = box(0);
//     await MPI_Comm_rank(rank_ptr);

//     await MPI_Barrier();

//     if (rank_ptr.data === 0) {
//         console.log("size", size_ptr.data);
//     }

//     const data_ptr = box(42);
//     const recv_ptr = box(0);
//     if (rank_ptr.data === 0) {
//         console.log("rank", rank_ptr.data, "receiving")
//         const req = await MPI_Irecv(recv_ptr, 1);
//         console.log("rank", rank_ptr.data, "doing other stuff")
//         await MPI_Wait(req);
//     } else {
//         for (let i = 0; i < 10000000; i++) {
//             const x = Math.sqrt(i);
//         }
//         console.log("rank", rank_ptr.data, "sending")
//         await MPI_Send(data_ptr, 0);
//     }
//     console.log("rank", rank_ptr.data, "finished", recv_ptr.data);

// }, self);