/**
 * MPI_Barrier is a synchronization function that blocks the processes until all processes have reached
 * the barrier. This function is blocking, and it will only return after all the processes have reached
 * the barrier.
 * 
 * If optimization flag is set, SSMR (Single Source Multiple Recipients) will be utilized where applicable.
 * 
 * @function
 * @returns {Promise<void>} A promise that resolves when all the processes have reached the barrier.
 */
const MPI_Barrier = diagnostics.profile("MPI_Barrier", async () => {
    if (config.optimized) {
        if (config.my_nr_id === 0) {
            await Promise.all(config.local_neighbors.map(async (pid) => {
                await node_router.receive(pid, "MPI_Barrier_1");
            }));

            if (config.global_num_proc !== config.local_num_proc) {
                if (config.my_pid === 0) {
                    await Promise.all(config.gr_neighbors.map(async (pid) => {
                        await node_router.receive(pid, "MPI_Barrier_global_1");
                    }));
                    await node_router.send(config.gr_neighbors, "MPI_Barrier_global_2", "");
                } else {
                    await node_router.send([0], "MPI_Barrier_global_1", "");
                    await node_router.receive(0, "MPI_Barrier_global_2");
                }
            }
            await node_router.send(config.local_neighbors, "MPI_Barrier_2", "");
        } else {
            await node_router.send([config.my_nr_offset], "MPI_Barrier_1", "");
            await node_router.receive(config.my_nr_offset, "MPI_Barrier_2");
        }
    } else {
        if (config.my_pid === 0) {
            await Promise.all(config.all_neighbors.map(async (pid) => {
                await node_router.receive(pid, "MPI_Barrier_1");
            }));
            await Promise.all(config.all_neighbors.map(async (pid) => {
                await node_router.send([pid], "MPI_Barrier_2", "");
            }));
        } else {
            await node_router.send([0], "MPI_Barrier_1", "");
            await node_router.receive(0, "MPI_Barrier_2");
        }
    }
});
