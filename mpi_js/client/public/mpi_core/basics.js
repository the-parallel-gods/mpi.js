/**
 * MPI_Test tests if the request is done. Regardless of whether the request is done or not,
 * the callback should immediately return a boolean.
 * 
 * @function
 * @param {MPI_Request} request The request to test.
 * @returns {Promise<boolean>} A promise that resolves when the test is done, indicating whether the request is done.
 */
const MPI_Test = diagnostics.profile(async (request) => {
    return await new Promise((resolve) => {
        reschedule(async () => { resolve(await request.test()); });
    });
});

/**
 * MPI_Wait waits for the request to be done. The callback should return a promise that resolves
 * when the request is done.
 * 
 * @function
 * @param {MPI_Request} request The request to wait for.
 * @returns {Promise<void>} A promise that resolves when the request is done.
 */
const MPI_Wait = diagnostics.profile(async (request) => {
    await request.wait();
});

/**
 * 
 * MPI_Send sends data to another process. This function is blocking, and it will only return
 * after the receiver confirms that it has received the data.
 * 
 * start and count are optional parameters that allow the user to specify a slice of the array
 * to send. Only use these parameters if the data is an array.
 * 
 * @function
 * @param {Box} data_ptr The data to send.
 * @param {number} dest_pid The destination process ID.
 * @param {number} start The start index of the data to send. Default is 0 if only count is specified.
 * @param {number} count The number of elements to send. Only use if data is an array.
 * @returns {Promise<void>} A promise that resolves when the data has been sent.
 */
const MPI_Send = diagnostics.profile(async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], "MPI_Send", { need_response: true, data });
    await node_router.receive(dest_pid, "MPI_Send_response");
});

/**
 * MPI_ISend sends data to another process. This function is non-blocking, and it will return
 * immediately after sending the data. The user can use the MPI_Request object to test if the
 * buffer is ready to be reused.
 * 
 * start and count are optional parameters that allow the user to specify a slice of the array
 * to send. Only use these parameters if the data is an array.
 * 
 * @function
 * @param {Box} data_ptr The data to send.
 * @param {number} dest_pid The destination process ID.
 * @param {number} start The start index of the data to send. Default is 0 if only count is specified.
 * @param {number} count The number of elements to send. Only use if data is an array.
 * @returns {Promise<MPI_Request>} A promise that indicates that the data has been sent.
 */
const MPI_ISend = diagnostics.profile(async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], "MPI_Send", { need_response: false, data });
    return new MPI_Request(true);
});

/**
 * MPI_Recv receives data from another process. This function is blocking, and it will only return
 * after the data has been received.
 * 
 * start and count are optional parameters that allow the user to specify a slice of the array
 * to receive. Only use these parameters if the data is an array.
 * 
 * @function
 * @param {Box} data_ptr The box to store the received data.
 * @param {number} src_pid The source process ID. Default is null to receive from any process.
 * @param {number} start The start index of the data to receive. Default is 0 if only count is specified.
 * @param {number} count The number of elements to receive. Only use if data is an array.
 * @returns {Promise<void>} A promise that resolves when the data has been received.
 */
const MPI_Recv = diagnostics.profile(async (data_ptr, src_pid = null, start = null, count = null) => {
    const packet = await node_router.receive(src_pid, "MPI_Send");
    const data = packet.data.data;
    if (count !== null) data_ptr.data.splice(start || 0, count, ...data);
    else data_ptr.data = data;
    packet.data.need_response && node_router.send([src_pid], "MPI_Send_response", "");
});

/**
 * MPI_IRecv receives data from another process. This function is non-blocking, and it will return
 * immediately after receiving the data. The user can use the MPI_Request object to test if the
 * receive is done, or to wait for the receive to be done.
 * 
 * start and count are optional parameters that allow the user to specify a slice of the array
 * to receive. Only use these parameters if the data is an array.
 * 
 * @function
 * @param {Box} data_ptr The box to store the received data.
 * @param {number} src_pid The source process ID. Default is null to receive from any process.
 * @param {number} start The start index of the data to receive. Default is 0 if only count is specified.
 * @param {number} count The number of elements to receive. Only use if data is an array.
 * @returns {Promise<MPI_Request>} A promise that indicates that the data has been received.
 */
const MPI_IRecv = diagnostics.profile(async (data_ptr, src_pid = null, start = null, count = null) => {
    const process_data = (packet) => {
        console.log("packet", packet);
        const data = packet.data.data;
        if (count !== null) data_ptr.data.splice(start || 0, count, ...data);
        else data_ptr.data = data;
        packet.data.need_response && node_router.send([src_pid], "MPI_Send_response", "");
    }

    return new MPI_Request()
        .set_wait_callback(async () => {
            const packet_data = await node_router.receive(src_pid, "MPI_Send");
            process_data(packet_data);
        })
        .set_test_callback(async () => {
            const packet_data = await node_router.receive_if_available(src_pid, "MPI_Send");
            if (packet_data) {
                process_data(packet_data);
                return true;
            }
            return false;
        });
});

/**
 * MPI_Bcast broadcasts data from the root process to all other processes. This function is blocking,
 * and it will only return after all the processes have received the data.
 * 
 * @function
 * @param {Box} data_ptr The data to broadcast.
 * @param {number} root The root process ID.
 * @returns {Promise<void>} A promise that resolves when the data has been broadcasted.
 */
const MPI_Bcast = diagnostics.profile(async (data_ptr, root) => {
    if (config.my_pid === root)
        node_router.send(config.neighbor_list, "MPI_Bcast", data_ptr.data);
    else
        data_ptr.data = (await node_router.receive(root, "MPI_Bcast")).data;
});

/**
 * MPI_Barrier is a synchronization function that blocks the processes until all processes have reached
 * the barrier. This function is blocking, and it will only return after all the processes have reached
 * the barrier.
 * 
 * @function
 * @returns {Promise<void>} A promise that resolves when all the processes have reached the barrier.
 */
const MPI_Barrier = diagnostics.profile(async () => {
    if (config.my_pid === 0) {
        await Promise.all(config.neighbor_list.map(async (pid) => {
            await node_router.receive(pid, "MPI_Barrier_1");
        }));
        await node_router.send(config.neighbor_list, "MPI_Barrier_2", "");
    } else {
        await node_router.send([0], "MPI_Barrier_1", "");
        await node_router.receive(0, "MPI_Barrier_2");
    }
});