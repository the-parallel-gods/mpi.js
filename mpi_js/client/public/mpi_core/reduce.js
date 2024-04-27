
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


/**
 * MPI_Reduce is a collective operation that combines the data from all processes in the communicator
 * and returns the result to a single process. The root process will receive the result.
 * 
 * The operation is function performed on the data pointed to by the data_ptr. The operation is defined by the
 * operation parameter.
 * 
 * If optimization flag is set, SSMR (Single Source Multiple Recipients) will be utilized where applicable.
 * 
 * @function
 * @param {Box} send_ptr The boxed data array to reduce.
 * @param {Box} recv_ptr The box to store the result array.
 * @param {function(any, any): any} operation The operation to perform on the data.
 * @returns {Promise<void>} A promise that resolves when all the processes have reached the barrier.
 */
const MPI_Reduce = diagnostics.profile("MPI_Reduce", async (send_ptr, recv_ptr, operation, root) => {
    if (config.optimized) {

    } else {
        if (config.my_pid === root) {
            const recv_boxes = Array.from({ length: config.global_num_proc }, () => box(null));
            recv_boxes[config.my_pid] = send_ptr;
            await Promise.all(recv_boxes.map(async (box, i) => {
                i !== config.my_pid && await MPI_Recv(box, i);
            }));
            const arr_arr = recv_boxes.map((box) => box.data);
            recv_ptr.data = Array.from({ length: send_ptr.data.length }, (_, elem_idx) => arr_arr[0][elem_idx]);
            for (let elem_idx = 0; elem_idx < send_ptr.data.length; elem_idx++) {
                for (let proc_idx = 1; proc_idx < config.global_num_proc; proc_idx++) {
                    recv_ptr.data[elem_idx] = operation(recv_ptr.data[elem_idx], arr_arr[proc_idx][elem_idx]);
                }
            }
        } else {
            await MPI_Send(send_ptr, root);
        }
    }
});


const MPI_Allreduce = diagnostics.profile("MPI_Allreduce", async (send_ptr, recv_ptr, operation) => {
    if (config.optimized) {

    } else {
        const bcast_boxes = Array.from({ length: config.global_num_proc }, () => box(null));
        bcast_boxes[config.my_pid] = send_ptr;
        await Promise.all(bcast_boxes.map(async (box, i) => {
            await MPI_Bcast(box, i);
        }));
        const arr_arr = bcast_boxes.map((box) => box.data);
        console.log(arr_arr)
        recv_ptr.data = Array.from({ length: send_ptr.data.length }, (_, elem_idx) => arr_arr[0][elem_idx]);
        for (let elem_idx = 0; elem_idx < send_ptr.data.length; elem_idx++) {
            for (let proc_idx = 1; proc_idx < config.global_num_proc; proc_idx++) {
                recv_ptr.data[elem_idx] = operation(recv_ptr.data[elem_idx], arr_arr[proc_idx][elem_idx]);
            }
        }
    }
});