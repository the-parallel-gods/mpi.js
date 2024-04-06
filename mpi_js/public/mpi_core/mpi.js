importScripts('/mpi_core/node_router.js');

let config = {
    // num_workers
    // my_pid
    // node_partition
    // local_channels
    // global_channel
    // neighbor_list
};
let node_router;
let user_main_fn;


const on_init_message = async (event) => {
    const data = event.data;
    // console.log('INIT_DATA', data);
    if (data.command === 'init_channel') {
        config.local_channels[data.portPid] = data.port;
    } else if (data.command === 'init_variable') {
        config[data.name] = data.value;
    } else if (data.command === 'init_finished') {
        node_router = new NodeRouter(config.num_proc, config.my_pid, config.node_partition, config.local_channels, config.global_channel, config.channel_ports);
        config.neighbor_list = config.node_partition.flat().filter((pid) => pid !== config.my_pid);
        console.log(config.my_pid, "Final config", config);
        node_router.receive_from(-1).then(async (packet) => {
            if (packet.data === 'start') {
                console.log(config.my_pid, "starting main_fn");
                await user_main_fn();
            }
        });
    }
}

const run = (main_fn, worker_self) => {
    config.global_channel = worker_self;
    config.global_channel.onmessage = on_init_message;
    user_main_fn = main_fn;
}

const MPI_Comm_rank = async (rank_ptr) => {
    rank_ptr.data = config.my_pid;
}

const MPI_Comm_size = async (size_ptr) => {
    size_ptr.data = config.num_proc;
}

const MPI_Send = async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], data);
}

const MPI_Recv = async (data_ptr, src_pid, start = null, count = null) => {
    const data = (await node_router.receive_from(src_pid)).data;
    if (count !== null) {
        start = start || 0;
        data_ptr.data.splice(start, count, ...data);
    } else {
        data_ptr.data = data;
    }
}

const MPI_Bcast = async (data_ptr, root) => {
    if (config.my_pid === root)
        node_router.send(config.neighbor_list, data_ptr.data);
    else
        data_ptr.data = (await node_router.receive_from(root)).data;
}

const MPI_Barrier = async () => {
    if (config.my_pid === 0) {
        await Promise.all(config.neighbor_list.map(async (pid) => {
            await node_router.receive_from(pid);
        }));
        await node_router.send(config.neighbor_list, "barrier");
    } else {
        await node_router.send([0], "barrier");
        await node_router.receive_from(0);
    }
}

const box = (data) => {
    return { data };
}