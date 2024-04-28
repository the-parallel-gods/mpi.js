const MPI_Gather = diagnostics.profile("MPI_Gather", async (data_ptr, root, count) => {
    if (config.my_pid === root) {
        // Gather data from all processes
        await Promise.all(config.neighbor_list.map(async (pid) => {
            const gathered = (await node_router.receive(pid, "MPI_Gather"));
            const sender = gathered.src_pid;
            const gathered_data = gathered.data;

            // Copy the gathered data into the correct location in the data_ptr
            for (let i = 0; i < count; i++) {
                data_ptr.data[sender * count + i] = gathered_data[i];
            }
        }));
    } else {
        await node_router.send([root], "MPI_Gather", data_ptr);
    }

});

const MPI_Gatherv = diagnostics.profile("MPI_Gatherv", async (data_ptr, root, recvcounts) => {
    if (config.my_pid === root) {
        // Gather data from all processes
        await Promise.all(config.neighbor_list.map(async (pid) => {
            const gathered = (await node_router.receive(pid, "MPI_Gatherv"));
            const sender = gathered.src_pid;
            const gathered_data = gathered.data;

            // Copy the gathered data into the correct location in the data_ptr
            for (let i = 0; i < recvcounts[sender]; i++) {
                data_ptr.data[sender * recvcounts[sender] + i] = gathered_data[i];
            }
        }));
    } else {
        await node_router.send([root], "MPI_Gatherv", data_ptr);
    }
});


const MPI_Scatter = diagnostics.profile("MPI_Scatter", async (data_ptr, root, count) => {
    if (config.my_pid === root)   
        await Promise.all(config.neighbor_list.map(async (pid) => { 
            await node_router.send([pid], "MPI_Scatter", data_ptr.data.slice(pid * count, (pid + 1) * count));
        }));
    else
        data_ptr.data = (await node_router.receive(root, "MPI_Scatter")).data;
});

const MPI_Scatterv = diagnostics.profile("MPI_Scatterv", async (data_ptr, root, sendcounts) => {
    if (config.my_pid === root) {
        await Promise.all(config.neighbor_list.map(async (pid) => {
            const sendcount = sendcounts[pid];
            await node_router.send([pid], "MPI_Scatterv", data_ptr.data.slice(pid * sendcount, (pid + 1) * sendcount));
        }));
    } else {
        data_ptr.data = (await node_router.receive(root, "MPI_Scatterv")).data;
    }
});