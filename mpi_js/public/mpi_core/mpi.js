importScripts('/mpi_core/node_router.js');
importScripts('/mpi_core/smartdashboard.js');
importScripts('/mpi_core/diagnostics.js');

let config = {
    // num_workers
    // my_pid
    // node_partition
    // local_channels
    // global_channel
    // neighbor_list
    // enable_smartdashboard
    // enable_diagnostics
};
let node_router, smartdashboard, diagnostics;
let user_main_fn;

const flush_telemetry = async () => {
    diagnostics.flush();
    smartdashboard.flush();
}

const finish_setup = async () => {
    node_router = new NodeRouter(config.num_proc, config.my_pid, config.node_partition, config.local_channels, config.global_channel, config.channel_ports);
    config.neighbor_list = config.node_partition.flat().filter((pid) => pid !== config.my_pid);
    config.my_pid === 0 && console.log(config.my_pid, "Final config", config);
    smartdashboard = new SmartDashboard(config.enable_smartdashboard, async (delta) => {
        await node_router.send([-1], "MPI_Smartdashboard", delta);
    });

    diagnostics = new Diagnostics(smartdashboard, config.enable_diagnostics);
    MPI_Send = diagnostics.profile(MPI_Send);
    MPI_Recv = diagnostics.profile(MPI_Recv);
    MPI_Bcast = diagnostics.profile(MPI_Bcast);
    MPI_Barrier = diagnostics.profile(MPI_Barrier);

    console.warn(`[${config.my_pid}] MPI core ready`);
    await MPI_Barrier();
    node_router.receive_from(-1, "start").then(async (_) => {
        config.my_pid === 0 && console.log("STARTING USER PROGRAM");
        await user_main_fn();
    });
}

const on_init_message = async (event) => {
    const data = event.data;
    // console.log('INIT_DATA', data);
    if (data.command === 'init_channel') {
        config.local_channels[data.portPid] = data.port;
    } else if (data.command === 'init_variable') {
        config[data.name] = data.value;
    } else if (data.command === 'init_finished') {
        await finish_setup();
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

const MPI_Finalize = async () => {
    await flush_telemetry();
}

let MPI_Send = async (data_ptr, dest_pid, start = null, count = null) => {
    let data = data_ptr.data;
    if (count !== null) {
        start = start || 0;
        data = data.slice(start, start + count);
    }
    await node_router.send([dest_pid], "MPI_Send", data);
}


let MPI_Recv = async (data_ptr, src_pid = null, start = null, count = null) => {
    const data = (await node_router.receive_from(src_pid, "MPI_Send")).data;
    if (count !== null) {
        start = start || 0;
        data_ptr.data.splice(start, count, ...data);
    } else {
        data_ptr.data = data;
    }
}

let MPI_Bcast = async (data_ptr, root) => {
    if (config.my_pid === root)
        node_router.send(config.neighbor_list, "MPI_Bcast", data_ptr.data);
    else
        data_ptr.data = (await node_router.receive_from(root, "MPI_Bcast")).data;
}

let MPI_Barrier = async () => {
    if (config.my_pid === 0) {
        await Promise.all(config.neighbor_list.map(async (pid) => {
            await node_router.receive_from(pid, "MPI_Barrier_1");
        }));
        await node_router.send(config.neighbor_list, "MPI_Barrier_2", "");
    } else {
        await node_router.send([0], "MPI_Barrier_1", "");
        await node_router.receive_from(0, "MPI_Barrier_2");
    }
}



const box = (data) => {
    return { data };
}

const unbox = (box) => {
    return box.data;
}
