
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
 * The optimized version does a local reduce and then send the local results to the root process for a final
 * reduce in order to minimize communication bandwidth.
 * 
 * @function
 * @param {Box} send_ptr The boxed data array to reduce.
 * @param {Box} recv_ptr The box to store the result array.
 * @param {function(any, any): any} operation The operation to perform on the data.
 * @returns {Promise<void>} A promise that resolves when all the processes have reached the barrier.
 */
const MPI_Reduce = diagnostics.profile("MPI_Reduce", async (send_ptr, recv_ptr, operation, root) => {
    if (config.optimized) {
        if (config.my_nr_id === 0) {
            const local_result = send_ptr;
            await Promise.all(config.local_neighbors.map(async (pid) => {
                const buffer = box(null);
                await MPI_Recv(buffer, pid);
                for (let elem_idx = 0; elem_idx < buffer.data.length; elem_idx++) {
                    local_result.data[elem_idx] = operation(local_result.data[elem_idx], buffer.data[elem_idx]);
                }
            }));
            if (config.global_num_proc !== config.local_num_proc) {
                await MPI_Isend(local_result, root);
            }
            // console.log("local_result", local_result);
        } else {
            await MPI_Send(send_ptr, config.my_nr_offset);
        }
        if (config.my_pid === root) {
            recv_ptr.data = Array.from({ length: send_ptr.data.length }, () => null);
            await Promise.all([...config.gr_neighbors, config.my_nr_offset].map(async (pid) => {
                const buffer = box(null);
                await MPI_Recv(buffer, pid);
                for (let i = 0; i < buffer.data.length; i++) {
                    recv_ptr.data[i] = recv_ptr.data[i] ? operation(recv_ptr.data[i], buffer.data[i]) : buffer.data[i];
                }
            }));
        }
    } else {
        if (config.my_pid === root) {
            recv_ptr.data = send_ptr.data.slice();
            await Promise.all(config.all_neighbors.map(async (pid) => {
                const buffer = box(null);
                await MPI_Recv(buffer, pid);
                for (let elem_idx = 0; elem_idx < buffer.data.length; elem_idx++) {
                    recv_ptr.data[elem_idx] = operation(recv_ptr.data[elem_idx], buffer.data[elem_idx]);
                }
            }));
        } else {
            await MPI_Send(send_ptr, root);
        }
        await MPI_Barrier();
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