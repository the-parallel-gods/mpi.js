importScripts('/mpi_core/barrier.js');
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
        node_router = new NodeRouter(config.my_pid, config.node_partition, config.local_channels, config.global_channel, config.channel_ports);
        config.neighbor_list = config.node_partition.flat().filter((pid) => pid !== config.my_pid);
        console.log(config);
        node_router.receive_from(-1).then(async (data) => {
            console.log('INIT', data);
            if (data === 'start')
                await user_main_fn();
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


const MPI_Bcast = async (data_ptr, root) => {
    if (config.my_pid === root) {
        node_router.send(config.neighbor_list, data_ptr.data);
    } else {
        data_ptr.data = await node_router.receive_from(root);
        console.log('MPI_Bcast SUCCESS!', data_ptr.data);
    }
}

const alloc = (data) => {
    return { data };
}