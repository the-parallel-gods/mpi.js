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
const MPI_Barrier = diagnostics.profile("MPI_Barrier", async (debug = false) => {
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
        // let start_time;
        // start_time = Date.now();
        debug && console.log("rank", config.my_pid, "starting at", Date.now() % 100000 / 1000);
        if (config.my_pid === 0) {
            await Promise.all(config.all_neighbors.map(async (pid) => {
                if (await node_router.receive_if_available(pid, "MPI_Barrier_1")) {
                    debug && console.log("rank", config.my_pid, "received IMMEDIATELY from", pid, "at", Date.now() % 100000 / 1000);
                } else {
                    await node_router.receive(pid, "MPI_Barrier_1");
                    debug && console.log("rank", config.my_pid, "received NOT immediately from", pid, "at", Date.now() % 100000 / 1000);
                }
            }));
            debug && console.log("rank", config.my_pid, "barrier_1", Date.now() % 100000 / 1000, "s");
            await Promise.all(config.all_neighbors.map(async (pid) => {
                await node_router.send([pid], "MPI_Barrier_2", "");
            }));
            debug && console.log("rank", config.my_pid, "barrier_2", Date.now() % 100000 / 1000, "s");
        } else {
            await node_router.send([0], "MPI_Barrier_1", "");
            debug && console.log("rank", config.my_pid, "barrier_1", Date.now() % 100000 / 1000, "s");
            await node_router.receive(0, "MPI_Barrier_2");
            debug && console.log("rank", config.my_pid, "barrier_2", Date.now() % 100000 / 1000, "s");
        }
    }
});
