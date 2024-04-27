/**
 * MPI_Gather is a collective operation that gathers data from all processes and stores it in the root process.
 * All processes must provide the same count of data.
 * 
 * @function
 * @param {Box} send_ptr The data to gather.
 * @param {Box} recv_ptr The box to store the gathered data.
 * @param {number} root The root process ID that gathers the data.
 * @returns {Promise<void>} A promise that resolves when the gather is done.
 */
const MPI_Gather = diagnostics.profile("MPI_Gather", async (send_ptr, recv_ptr, root) => {
    if (config.my_pid === root) {
        const count_per_proc = send_ptr.data.length;
        let recv_data = Array.from({ length: config.global_num_proc * count_per_proc }, () => null);
        recv_data.splice(config.my_pid * count_per_proc, count_per_proc, ...send_ptr.data);
        recv_ptr.data = recv_data;
        await Promise.all(config.all_neighbors.map(async (pid) => {
            const buffer_ptr = box(null);
            await MPI_Recv(buffer_ptr, pid);
            if (count_per_proc !== buffer_ptr.data.length) {
                throw new Error("MPI_Gather: count_per_proc must be equal to the length of the send_ptr data in pid", pid);
            }
            recv_data.splice(pid * count_per_proc, count_per_proc, ...buffer_ptr.data);
        }));
    } else {
        await MPI_Isend(send_ptr, root);
    }
});


/**
 * MPI_Allgather is a collective operation that gathers data from all processes and stores it in all processes.
 * All processes must provide the same count of data.
 * 
 * @function
 * @param {Box} send_ptr The data to gather.
 * @param {Box} recv_ptr The box to store the gathered data.
 * @returns {Promise<void>} A promise that resolves when the gather is done.
 */
const MPI_Allgather = diagnostics.profile("MPI_Allgather", async (send_ptr, recv_ptr) => {
    const count_per_proc = send_ptr.data.length;
    if (config.my_pid === 0) {
        let recv_data = Array.from({ length: config.global_num_proc * count_per_proc }, () => null);
        recv_data.splice(config.my_pid * count_per_proc, count_per_proc, ...send_ptr.data);
        recv_ptr.data = recv_data;
        await Promise.all(config.all_neighbors.map(async (pid) => {
            const buffer_ptr = box(null);
            await MPI_Recv(buffer_ptr, pid);
            if (count_per_proc !== buffer_ptr.data.length) {
                throw new Error("MPI_Gather: count_per_proc must be equal to the length of the send_ptr data in pid", pid);
            }
            recv_data.splice(pid * count_per_proc, count_per_proc, ...buffer_ptr.data);
        }));
    } else {
        await MPI_Isend(send_ptr, 0);
    }
    await MPI_Bcast(recv_ptr, 0);
});


/**
 * MPI_Gatherv is a collective operation that gathers data from all processes and stores it in the root process.
 * Each process can provide a different count of data. This information must be provided.
 * 
 * @function
 * @param {Box} send_ptr The data to gather.
 * @param {Box} recv_ptr The box to store the gathered data.
 * @param {number[]} counts The count of data to gather from each process.
 * @param {number[]} offsets The offset to store the data in the recv_ptr.
 * @param {number} root The root process ID that gathers the data.
 * @returns {Promise<void>} A promise that resolves when the gather is done.
 */
const MPI_Gatherv = diagnostics.profile("MPI_Gatherv", async (send_ptr, recv_ptr, counts, offsets, root) => {
    if (counts.length !== offsets.length) {
        throw new Error("MPI_Gatherv: counts and offsets must have the same length at pid", config.my_pid);
    } else if (counts[config.my_pid] !== send_ptr.data.length) {
        throw new Error("MPI_Gatherv: counts must have the same length as the send_ptr data at pid", config.my_pid);
    }
    if (config.my_pid === root) {
        let recv_data = Array.from({ length: offsets[offsets.length - 1] + counts[counts.length - 1] }, () => null);
        recv_data.splice(offsets[root], counts[root], ...send_ptr.data);
        recv_ptr.data = recv_data;
        await Promise.all(config.all_neighbors.map(async (pid) => {
            const buffer_ptr = box(null);
            await MPI_Recv(buffer_ptr, pid);
            recv_data.splice(offsets[pid], counts[pid], ...buffer_ptr.data);
        }));
    } else {
        await MPI_Isend(send_ptr, root);
    }
});


/**
 * MPI_Allgatherv is a collective operation that gathers data from all processes and stores it in all processes.
 * Each process can provide a different count of data. This information must be provided.
 * 
 * @function
 * @param {Box} send_ptr The data to gather.
 * @param {Box} recv_ptr The box to store the gathered data.
 * @param {number[]} counts The count of data to gather from each process.
 * @param {number[]} offsets The offset to store the data in the recv_ptr.
 * @returns {Promise<void>} A promise that resolves when the gather is done.
 */
const MPI_Allgatherv = diagnostics.profile("MPI_Allgatherv", async (send_ptr, recv_ptr, counts, offsets) => {
    if (counts.length !== offsets.length) {
        throw new Error("MPI_Gatherv: counts and offsets must have the same length at pid", config.my_pid);
    } else if (counts[config.my_pid] !== send_ptr.data.length) {
        throw new Error("MPI_Gatherv: counts must have the same length as the send_ptr data at pid", config.my_pid);
    }
    const root = 0;
    if (config.my_pid === root) {
        let recv_data = Array.from({ length: offsets[offsets.length - 1] + counts[counts.length - 1] }, () => null);
        recv_data.splice(offsets[root], counts[root], ...send_ptr.data);
        recv_ptr.data = recv_data;
        await Promise.all(config.all_neighbors.map(async (pid) => {
            const buffer_ptr = box(null);
            await MPI_Recv(buffer_ptr, pid);
            recv_data.splice(offsets[pid], counts[pid], ...buffer_ptr.data);
        }));
    } else {
        await MPI_Isend(send_ptr, 0);
    }
    await MPI_Bcast(recv_ptr, 0);
});

