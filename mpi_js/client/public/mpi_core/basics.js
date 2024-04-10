const MPI_Test = diagnostics.profile(async (request) => {
    return await new Promise((resolve) => {
        reschedule(async () => { resolve(await request.test()); });
    });
});

const MPI_Wait = diagnostics.profile(async (request) => {
    await request.wait();
});

const MPI_Send = diagnostics.profile(async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], "MPI_Send", { need_response: true, data });
    await node_router.receive(dest_pid, "MPI_Send_response");
});

const MPI_ISend = diagnostics.profile(async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], "MPI_Send", { need_response: false, data });
});

const MPI_Recv = diagnostics.profile(async (data_ptr, src_pid = null, start = null, count = null) => {
    const packet = await node_router.receive(src_pid, "MPI_Send");
    const data = packet.data.data;
    if (count !== null) data_ptr.data.splice(start || 0, count, ...data);
    else data_ptr.data = data;
    packet.data.need_response && node_router.send([src_pid], "MPI_Send_response", "");
});

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

const MPI_Bcast = diagnostics.profile(async (data_ptr, root) => {
    if (config.my_pid === root)
        node_router.send(config.neighbor_list, "MPI_Bcast", data_ptr.data);
    else
        data_ptr.data = (await node_router.receive(root, "MPI_Bcast")).data;
});

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