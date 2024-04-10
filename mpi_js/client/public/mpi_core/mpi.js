importScripts('/mpi_core/node_router.js');
importScripts('/mpi_core/smartdashboard.js');
importScripts('/mpi_core/diagnostics.js');
importScripts('/mpi_core/mpi_request.js');

importScripts('/mpi_core/basics.js');

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
let node_router, smartdashboard;
let user_main_fn;

const reschedule = (callback) => {
    console.log("reschedule requested");
    node_router.send([config.my_pid], "reschedule", "");
    node_router.receive(config.my_pid, "reschedule").then(async (_) => {
        console.log("reschedule finished");
        await callback();
    });
}

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

    diagnostics.configure(smartdashboard, config.enable_diagnostics);

    console.warn(`[${config.my_pid}] MPI core ready`);
    await MPI_Barrier();
    node_router.receive(-1, "start").then(async (_) => {
        config.my_pid === 0 && console.warn("STARTING USER PROGRAM");
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

const main = (main_fn, worker_self) => {
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

const MPI_Init = async () => {
    await MPI_Barrier();
}

const MPI_Finalize = async () => {
    await flush_telemetry();
}

const box = (data) => {
    return { data };
}

const unbox = (box) => {
    return box.data;
}
