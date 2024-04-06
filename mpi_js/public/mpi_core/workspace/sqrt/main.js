importScripts('/mpi_core/mpi.js');


run(async () => {
    const size_ptr = box(0);
    const rank_ptr = box(0);
    await MPI_Comm_size(size_ptr);
    await MPI_Comm_rank(rank_ptr);
    await MPI_Barrier();

    const approxSqrt3 = (x) => {
        for (let i = 0; i < 10000000; i++) {
            x = 1.0 - (0.5 * x * x);
        }
        return x + 1.0;
    }

    const root = 0, pid = rank_ptr.data, nproc = size_ptr.data;
    const num_iterations = 240;
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

    const start_time = performance.now();

    await MPI_Bcast(inputs, root);
    // console.log(pid, "inputs", inputs.data);

    span = Math.floor((num_iterations + nproc - 1) / nproc);
    start_idx = Math.min(num_iterations, pid * span);
    end_idx = Math.min(num_iterations, start_idx + span);
    // console.log(pid, "start_idx", start_idx, "end_idx", end_idx, "span", span);
    for (iteration_idx = start_idx; iteration_idx < end_idx; iteration_idx++) {
        outputs.data[iteration_idx] = approxSqrt3(inputs.data[iteration_idx]);
    }

    // console.log(pid, "outputs", outputs.data);

    // Send data to root process
    if (pid != root) {
        await MPI_Send(outputs, root, start_idx, end_idx - start_idx);
    } else {
        for (source = 1; source < nproc; source++) {
            start_idx = Math.min(num_iterations, source * span);
            end_idx = Math.min(num_iterations, start_idx + span);
            await MPI_Recv(outputs, source, start_idx, end_idx - start_idx);
        }
    }

    console.log("rank", rank_ptr.data, "time", performance.now() - start_time, "ms");
    // console.log(pid, "DONE")

    if (pid == root) {
        for (iteration_idx = 0; iteration_idx < num_iterations; iteration_idx++) {
            // console.log("Iteration", iteration_idx, ":", outputs.data[iteration_idx]);
            // assert close: abs(sqrt(3) - outputs.data[iteration_idx]) < 1e-6
            sqrt3 = Math.sqrt(3);
            if (Math.abs(sqrt3 - outputs.data[iteration_idx]) >= 1e-6) {
                console.log("Iteration", iteration_idx, ":", outputs.data[iteration_idx]);
                console.log("Error: ", Math.abs(sqrt3 - outputs.data[iteration_idx]));
            }
        }
    }

}, self);