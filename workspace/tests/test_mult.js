importScripts('/mpi_core/mpi.js');
importScripts('./magic_number.js');

main(async () => {
    await MPI_Init();
    const size_ptr = box(0);
    await MPI_Comm_size(size_ptr);

    const rank_ptr = box(0);
    await MPI_Comm_rank(rank_ptr);

    await MPI_Barrier();

    const approxSqrt3 = (x) => {
        for (let i = 0; i < 10000000; i++) {
            x = 1.0 - (0.5 * x * x);
        }
        return x + 1.0;
    }

    const root = 0, pid = rank_ptr.data, nproc = size_ptr.data;
    const num_iterations = 50;
    let iteration_idx, start_idx, end_idx, span, sqrt3;
    let inputs = box([]), outputs = box([]);
    inputs.data.length = num_iterations;
    outputs.data.length = num_iterations;

    if (rank_ptr.data === 0) {
        console.log("size", size_ptr.data);
    }


    if (pid == root) {
        for (iteration_idx = 0; iteration_idx < num_iterations; iteration_idx++) {
            inputs.data[iteration_idx] = 1.0 / (1.0 + iteration_idx);
        }
    }

    let start_time = performance.now();

    await MPI_Bcast(inputs, root);
    // console.log(pid, "passed bcast");

    span = Math.floor((num_iterations + nproc - 1) / nproc);
    start_idx = Math.min(num_iterations, pid * span);
    end_idx = Math.min(num_iterations, start_idx + span);
    // console.log(pid, "start_idx", start_idx, "end_idx", end_idx, "span", span);
    for (iteration_idx = start_idx; iteration_idx < end_idx; iteration_idx++) {
        outputs.data[iteration_idx] = approxSqrt3(inputs.data[iteration_idx]);
        flush_telemetry();
    }

    // console.log(pid, "outputs", outputs.data);

    // Send data to root process
    if (pid != root) {
        // console.log(pid, "SENDING TO", root);
        await MPI_Send(outputs, root, start_idx, end_idx - start_idx);
    } else {
        for (source = 1; source < nproc; source++) {
            // console.log("RECEIVING FROM", source);
            start_idx = Math.min(num_iterations, source * span);
            end_idx = Math.min(num_iterations, start_idx + span);
            await MPI_Recv(outputs, source, start_idx, end_idx - start_idx);
        }
    }

    console.log("rank", rank_ptr.data, "time", performance.now() - start_time, "ms");
    // console.log(pid, "DONE")

    await MPI_Barrier();

    if (rank_ptr.data === 0) {
        console.log("size", size_ptr.data);
    }

    start_time = performance.now();
    console.log("start_time", start_time, "rank", rank_ptr.data)
    for (let j = 0; j < 5000; j++) {
        const data_ptr = box(rank_ptr.data);
        for (let i = 0; i < size_ptr.data; i++) {
            data_ptr.data = rank_ptr.data;
            await MPI_Bcast(data_ptr, i);
        }
    }
    const end_time = performance.now();
    console.log("rank", rank_ptr.data, "time", end_time - start_time, "ms");

    await MPI_Barrier();
    for (let i = 0; i < 70000; i++) {
        if (rank_ptr.data % 2 === 0) {
            const data_ptr = box(rank_ptr.data);
            await MPI_Send(data_ptr, rank_ptr.data + 1);
        } else {
            const data_ptr = box(0);
            await MPI_Recv(data_ptr, rank_ptr.data - 1);
        }
    }
    await MPI_Barrier();
    for (let i = 0; i < 70000; i++) {
        if (rank_ptr.data % 2 !== 0) {
            const data_ptr = box(rank_ptr.data);
            await MPI_Send(data_ptr, rank_ptr.data - 1);
        } else {
            const data_ptr = box(0);
            await MPI_Recv(data_ptr, rank_ptr.data + 1);
        }
    }

    await MPI_Barrier();

    for (iteration_idx = start_idx; iteration_idx < end_idx; iteration_idx++) {
        outputs.data[iteration_idx] = approxSqrt3(inputs.data[iteration_idx]);
        flush_telemetry();
    }
    await MPI_Finalize();
}, self);