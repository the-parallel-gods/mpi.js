
/**
 * MPI_Scatter is a collective operation that scatters data from the root process to all other processes.
 * All processes must provide the same count of data.
 * 
 * @function
 * @param {Box} send_ptr The data to scatter.
 * @param {Box} recv_ptr The box to store the scattered data.
 * @param {number} root The root process ID that gathers the data.
 * @returns {Promise<void>} A promise that resolves when the scatter is done.
 */
const MPI_Scatter = diagnostics.profile("MPI_Scatter", async (send_ptr, recv_ptr, root) => {
    if (Math.floor(send_ptr.data.length / config.global_num_proc) !== Math.ceil(send_ptr.data.length / config.global_num_proc)) {
        throw new Error("MPI_Scatter: send_ptr data length must be divisible by the global_num_proc at pid", config.my_pid);
    }
    const count_per_proc = Math.floor(send_ptr.data.length / config.global_num_proc);
    if (config.my_pid === root) {
        recv_ptr.data = send_ptr.data.slice(config.my_pid * count_per_proc, (config.my_pid + 1) * count_per_proc);
        await Promise.all(config.all_neighbors.map(async (pid) => {
            await MPI_Isend(send_ptr, pid, pid * count_per_proc, count_per_proc);
        }));
    } else {
        await MPI_Recv(recv_ptr, root);
    }
});

/**
 * MPI_Scatterv is a collective operation that scatters data from the root process to all other processes.
 * All processes must provide the same count of data.
 * 
 * @function
 * @param {Box} send_ptr The data to scatter.
 * @param {Box} recv_ptr The box to store the scattered data.
 * @param {number} root The root process ID that gathers the data.
 * @returns {Promise<void>} A promise that resolves when the scatter is done.
 */
const MPI_Scatterv = diagnostics.profile("MPI_Scatterv", async (send_ptr, recv_ptr, counts, offsets, root) => {
    if (config.my_pid === root) {
        if (counts.length !== offsets.length) {
            throw new Error("MPI_Scatterv: counts and offsets must have the same length at pid", config.my_pid);
        } else if (counts[counts.length - 1] + offsets[offsets.length - 1] !== send_ptr.data.length) {
            throw new Error("MPI_Scatterv: counts and offsets must sum to the send_ptr data length at pid", config.my_pid);
        }
        recv_ptr.data = send_ptr.data.slice(offsets[config.my_pid], offsets[config.my_pid] + counts[config.my_pid]);
        await Promise.all(config.all_neighbors.map(async (pid) => {
            await MPI_Isend(send_ptr, pid, offsets[pid], counts[pid]);
        }));
    } else {
        await MPI_Recv(recv_ptr, root);
    }
});

