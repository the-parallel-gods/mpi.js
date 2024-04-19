/**
 * MPI_Bcast broadcasts data from the root process to all other processes. This function is blocking,
 * and it will only return after all the processes have received the data.
 * 
 * If optimization flag is set, SSMR (Single Source Multiple Recipients) will be utilized where applicable.
 * 
 * @function
 * @param {Box} data_ptr The data to broadcast.
 * @param {number} root The root process ID.
 * @returns {Promise<void>} A promise that resolves when the data has been broadcasted.
 */
const MPI_Bcast = diagnostics.profile("MPI_Bcast", async (data_ptr, root) => {
    if (config.optimized) {
        if (config.my_pid === root)
            await node_router.send(config.neighbor_list, "MPI_Bcast", data_ptr.data);
        else
            data_ptr.data = (await node_router.receive(root, "MPI_Bcast")).data;
    } else {
        if (config.my_pid === root) {
            await Promise.all(config.neighbor_list.map(async (pid) => {
                await node_router.send([pid], "MPI_Bcast", data_ptr.data);
            }));
        } else {
            data_ptr.data = (await node_router.receive(root, "MPI_Bcast")).data;
        }
    }
});


/**
 * MPI_Ibcast broadcasts data from the root process to all other processes. This function is non-blocking,
 * and it will return immediately after the data has been broadcasted. The user can use the MPI_Request
 * object to test if the broadcast is done, or to wait for the broadcast to be done.
 * 
 * If optimization flag is set, SSMR (Single Source Multiple Recipients) will be utilized where applicable.
 * 
 * @function
 * @param {Box} data_ptr The data to broadcast.
 * @param {number} root The root process ID that broadcasts the data.
 */
const MPI_Ibcast = diagnostics.profile("MPI_Ibcast", async (data_ptr, root) => {
    if (config.optimized) {
        if (config.my_pid === root) {
            await node_router.send(config.neighbor_list, "MPI_Bcast", data_ptr.data);
            return new MPI_Request(true);
        }

        const process_data = (packet) => {
            data_ptr.data = packet.data;
        }

        return new MPI_Request()
            .set_wait_callback(async () => {
                const packet_data = await node_router.receive(root, "MPI_Bcast");
                process_data(packet_data);
            })
            .set_test_callback(async () => {
                const packet_data = await node_router.receive_if_available(root, "MPI_Bcast");
                if (packet_data) {
                    process_data(packet_data);
                    return true;
                }
                return false;
            });
    } else {
        if (config.my_pid === root) {
            await Promise.all(config.neighbor_list.map(async (pid) => {
                await node_router.send([pid], "MPI_Bcast", data_ptr.data);
            }));
            return new MPI_Request(true);
        } else {
            return new MPI_Request()
                .set_wait_callback(async () => {
                    const packet_data = await node_router.receive(root, "MPI_Bcast");
                    process_data(packet_data);
                })
                .set_test_callback(async () => {
                    const packet_data = await node_router.receive_if_available(root, "MPI_Bcast");
                    if (packet_data) {
                        process_data(packet_data);
                        return true;
                    }
                    return false;
                });
        }
    }
});


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
        if (config.my_pid === 0) {
            await Promise.all(config.neighbor_list.map(async (pid) => {
                await node_router.receive(pid, "MPI_Barrier_1");
            }));
            await node_router.send(config.neighbor_list, "MPI_Barrier_2", "");
        } else {
            await node_router.send([0], "MPI_Barrier_1", "");
            await node_router.receive(0, "MPI_Barrier_2");
        }
    } else {
        if (config.my_pid === 0) {
            await Promise.all(config.neighbor_list.map(async (pid) => {
                await node_router.receive(pid, "MPI_Barrier_1");
            }));
            await Promise.all(config.neighbor_list.map(async (pid) => {
                await node_router.send([pid], "MPI_Barrier_2", "");
            }));
        } else {
            await node_router.send([0], "MPI_Barrier_1", "");
            await node_router.receive(0, "MPI_Barrier_2");
        }
    }
});