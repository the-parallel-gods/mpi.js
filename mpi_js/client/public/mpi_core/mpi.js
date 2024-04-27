importScripts('/mpi_core/diagnostics.js');
importScripts('/mpi_core/node_router.js');
importScripts('/mpi_core/smartdashboard.js');
importScripts('/mpi_core/mpi_request.js');
importScripts('/mpi_core/utils.js');

importScripts('/mpi_core/point2point.js');
importScripts('/mpi_core/bcast_barrier.js');
importScripts('/mpi_core/reduce.js');

/**
 * A box holds data. This is used to pass data between functions by reference.
 * @typedef {{data: any}} Box
 */

/**
 * @typedef {{
 *            my_pid: number,
 *            my_gr_id: number,
 *            my_nr_id: number,
 *            my_nr_offset: number,
 *            local_num_proc: number, 
 *            global_num_proc: number,
 *            local_neighbors: number[],
 *            gr_neighbors: number[],
 *            all_neighbors: number[],
 *            local_channels: Record<number, MessagePort>,
 *            global_channel: MessagePort,
 *            routing_table: number[],
 *            interconnect_type: ('crossbar'|'tree'|'ring'),
 *            enable_smartdashboard: boolean,
 *            enable_diagnostics: boolean,
 *            optimized: boolean
 *          }} Config
 * 
 * @type {Config} config
 */

let config = {};
let node_router, smartdashboard;
let user_main_fn;

/**
 * This function is used to take a function off of the event queue 
 * and add it to the back of the event queue.
 * 
 * Sometimes, the main function is too long, and it blocks any message
 * events from being processed. This function allows the main function
 * to be paused and other events to be processed. After other queued 
 * events are processed, the main function is added back to the end of
 * event queue to continue processing.
 * 
 * @param {function} callback The function to pause and reschedule.
 */
const reschedule = (callback) => {
    console.log("reschedule requested");
    node_router.send([config.my_pid], "reschedule", "");
    node_router.receive(config.my_pid, "reschedule").then(async (_) => {
        console.log("reschedule finished");
        await callback();
    });
}

/**
 * Sometimes the main function is too long and prevents the telemetry
 * from being flushed. This function manually flushes the telemetry.
 */
const flush_telemetry = async () => {
    diagnostics.flush();
    smartdashboard.flush();
}

/**
 * This function is used to finish setting up this worker after
 * the initial configuration is received.
 */
const finish_setup = async () => {
    console.log(config.my_pid, "Final config", config);
    node_router = new NodeRouter(
        config.local_num_proc,
        config.my_pid,
        config.routing_table,
        config.local_channels,
        config.global_channel,
    );
    smartdashboard = new SmartDashboard(config.enable_smartdashboard, async (delta) => {
        await node_router.send([config.my_pid], "MPI_Smartdashboard", delta);
    });

    diagnostics.configure(smartdashboard, config.enable_diagnostics);

    console.warn(`[${config.my_pid}] MPI core ready`);
    await MPI_Barrier();
    await user_main_fn();
}

/**
 * This function is used to receive a message from the main process
 * in the initialization phase. After initialization is complete, this
 * function is no longer used.
 *  
 * @param {MessageEvent} event The message event from the main process.
 */
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

/**
 * The entry point for user code. The user supplies its main function, 
 * as well as the worker object itself.
 * 
 * This function sets up all the necessary components for the worker
 * to run.
 * 
 * @param {function} main_fn The main function of the user.
 * @param {WorkerGlobalScope} worker_self The worker object itself.
 */
const main = (main_fn, worker_self) => {
    config.global_channel = worker_self;
    config.global_channel.onmessage = on_init_message;
    user_main_fn = main_fn;
}

/**
 * MPI function to obtain the rank of the current process.
 * 
 * @param {Box} rank_ptr A box to store the rank of the current process.
 */
const MPI_Comm_rank = async (rank_ptr) => {
    rank_ptr.data = config.my_pid;
}

/**
 * MPI function to obtain the number of processes.
 * 
 * @param {Box} size_ptr A box to store the number of processes.
 */
const MPI_Comm_size = async (size_ptr) => {
    size_ptr.data = config.global_num_proc;
}

/**
 * MPI function to initialize the MPI environment.
 */
const MPI_Init = async () => {
    await MPI_Barrier();
}

/**
 * MPI function to finalize and finish the MPI environment.
 */
const MPI_Finalize = async () => {
    await flush_telemetry();
    await node_router.send([config.my_pid], "MPI_Finalize", "");
}

const MPI_Abort = async () => {
    await flush_telemetry();
    await node_router.send([config.my_pid], "abort", "");
}

/**
 * Function to wrap data in a box.
 * 
 * @param {any} data The data to wrap in a box.
 * @returns {Box} A box containing the data.
 */
const box = (data) => {
    return { data };
}

/**
 * Function to unbox data from a box.
 * 
 * @param {Box} box The box containing the data.
 * @returns {any} The data from the box.
 */
const unbox = (box) => {
    return box.data;
}
