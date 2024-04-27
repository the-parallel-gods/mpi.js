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
    for (let j = 0; j < 1; j++) {
        const send_ptr = box([rank_ptr.data, rank_ptr.data, rank_ptr.data]);
        const recv_ptr = box(null);
        await MPI_Gather(send_ptr, recv_ptr, 0);
        console.log("rank", rank_ptr.data, "gather recv", recv_ptr.data);

        send_ptr.data = [rank_ptr.data, rank_ptr.data, rank_ptr.data];
        await MPI_Allgather(send_ptr, recv_ptr);
        console.log("rank", rank_ptr.data, "allgather recv", recv_ptr.data);
    }

    for (let j = 0; j < 1; j++) {
        const counts = Array.from({ length: size_ptr.data }, (_, i) => i + 1);
        let offsets = [0];
        for (let i = 0; i < counts.length - 1; i++) {
            offsets.push(offsets[offsets.length - 1] + counts[i]);
        }
        console.log("rank", rank_ptr.data, "counts", counts, "offsets", offsets);
        const send_ptr = box(Array.from({ length: counts[rank_ptr.data] }, () => rank_ptr.data));
        const recv_ptr = box(null);
        await MPI_Gatherv(send_ptr, recv_ptr, counts, offsets, 0);
        console.log("rank", rank_ptr.data, "gatherv recv", recv_ptr.data);

        send_ptr.data = Array.from({ length: counts[rank_ptr.data] }, () => rank_ptr.data);
        await MPI_Allgatherv(send_ptr, recv_ptr, counts, offsets);
        console.log("rank", rank_ptr.data, "allgatherv recv", recv_ptr.data);
    }

    for (let j = 0; j < 1; j++) {
        const send_ptr = box(Array.from({ length: size_ptr.data * 3 }, (_, i) => i));
        const recv_ptr = box(null);
        await MPI_Scatter(send_ptr, recv_ptr, 0);
        console.log("rank", rank_ptr.data, "scatter recv", recv_ptr.data);
    }
    for (let j = 0; j < 1; j++) {
        const counts = Array.from({ length: size_ptr.data }, (_, i) => i + 1);
        let offsets = [0];
        for (let i = 0; i < counts.length - 1; i++) {
            offsets.push(offsets[offsets.length - 1] + counts[i]);
        }
        console.log("rank", rank_ptr.data, "counts", counts, "offsets", offsets);
        const send_ptr = box(Array.from({ length: counts[counts.length - 1] + offsets[offsets.length - 1] }, (_, i) => i));
        const recv_ptr = box(null);
        await MPI_Scatterv(send_ptr, recv_ptr, counts, offsets, 0);
        console.log("rank", rank_ptr.data, "scatterv recv", recv_ptr.data);
    }
    const end_time = performance.now();
    console.log("rank", rank_ptr.data, "time", end_time - start_time, "ms");
    await MPI_Finalize();
}, self);