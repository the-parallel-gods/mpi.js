importScripts('/mpi_core/mpi.js');
importScripts('./magic_number.js');

run(async () => {
    const size_ptr = alloc(0);
    await MPI_Comm_size(size_ptr);

    const rank_ptr = alloc(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        console.log("size", size_ptr.data);
    }

    const start_time = performance.now();
    console.log("start_time", start_time, "rank", rank_ptr.data)
    for (let i = 0; i < 5000; i++) {
        const data_ptr = alloc(rank_ptr.data);
        for (let i = 0; i < size_ptr.data; i++) {
            data_ptr.data = rank_ptr.data;
            await MPI_Bcast(data_ptr, i);
        }
    }
    const end_time = performance.now();
    console.log("rank", rank_ptr.data, "time", end_time - start_time, "ms");
}, self);