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
 * TODO: Future idea: If not a crossbar interconnect, try to reduce along the way.
 * 
 * @function
 * @param {Box} send_ptr The boxed data array to reduce.
 * @param {Box} recv_ptr The box to store the result array.
 * @param {function(any, any): any} operation The operation to perform on the data.
 * @returns {Promise<void>} A promise that resolves when reduce is done.
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
            await MPI_Isend(local_result, root);
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


/**
 * This function only performs a all_reduce operation in the local group of processes.
 * It detects the type of interconnect and uses the appropriate strategy to perform the
 * all_reduce operation most efficiently. The speedup is more significant when the array
 * size is large.
 * 
 * Specifically, it uses the ring allreduce strategy for crossbar and ring interconnects,
 * and the tree allreduce strategy for the tree interconnect.
 * 
 * @function
 * @param {Box} send_ptr The boxed data array to reduce.
 * @param {Box} recv_ptr The box to store the result array.
 * @param {function(any, any): any} operation The operation to perform on the data.
 * @returns {Promise<void>} A promise that resolves when reduce is done.
 */
const MPI_Allreduce_local_optimized = async (send_ptr, recv_ptr, operation) => {
    if (config.interconnect_type === "crossbar" || config.interconnect_type === "ring") {
        // use ring allreduce strategy
        const wrap = make_wrap(config.local_num_proc);
        recv_ptr.data = send_ptr.data.slice();
        const buffer_ptr = box(send_ptr.data.slice());
        const { sizes, offsets } = partition(send_ptr.data.length, config.local_num_proc);
        const next_id = wrap(config.my_nr_id + 1), prev_id = wrap(config.my_nr_id - 1);
        for (let i = 0; i < config.local_num_proc; i++) {
            const send_offset_idx = wrap(config.my_nr_id - i);
            const recv_offset_idx = wrap(config.my_nr_id - i - 1);
            await MPI_Isend(buffer_ptr, next_id, offsets[send_offset_idx], sizes[send_offset_idx]);
            await MPI_Recv(buffer_ptr, prev_id, offsets[recv_offset_idx], sizes[recv_offset_idx]);
            for (let j = offsets[recv_offset_idx]; j < offsets[recv_offset_idx] + sizes[recv_offset_idx]; j++) {
                buffer_ptr.data[j] = operation(buffer_ptr.data[j], send_ptr.data[j]);
            }
        }
        await MPI_Barrier();
        recv_ptr.data = buffer_ptr.data;
        await node_router.send(config.local_neighbors, "MPI_Allreduce_phase_2",
            buffer_ptr.data.slice(offsets[next_id], offsets[next_id] + sizes[next_id]));
        await Promise.all(config.local_neighbors.map(async (pid) => {
            const packet = await node_router.receive(pid, "MPI_Allreduce_phase_2");
            recv_ptr.data.splice(offsets[wrap(pid + 1)], sizes[wrap(pid + 1)], ...packet.data);
        }));
    } else { // tree

    }
}

/**
 * MPI_Allreduce is a collective operation that combines the data from all processes in the communicator
 * and returns the result to all processes. The result is stored in the recv_ptr box.
 * 
 * If the optimized flag is set, and the operation is limited to the local group of processes, then
 * the allreduce operation is performed using the optimized strategy depending on the interconnect type.
 * If the operation spans multiple groups of processes, then the a local reduce is performed first, and
 * a secondary reduce is performed between the groups to save bandwidth. This can have many times speedup
 * when the array size or number of processors is large.
 * 
 * @function
 * @param {Box} send_ptr The boxed data array to reduce.
 * @param {Box} recv_ptr The box to store the result array.
 * @param {function(any, any): any} operation The operation to perform on the data.
 * @returns {Promise<void>} A promise that resolves when reduce is done.
 */
const MPI_Allreduce = diagnostics.profile("MPI_Allreduce", async (send_ptr, recv_ptr, operation) => {
    if (config.optimized) {
        if (config.global_num_proc === config.local_num_proc) {
            return await MPI_Allreduce_local_optimized(send_ptr, recv_ptr, operation);
        } else {
            await MPI_Reduce(send_ptr, recv_ptr, operation, 0);
            await MPI_Bcast(recv_ptr, 0);
        }
    } else {
        const bcast_boxes = Array.from({ length: config.global_num_proc }, () => box(null));
        bcast_boxes[config.my_pid] = send_ptr;
        await Promise.all(bcast_boxes.map(async (box, i) => {
            await MPI_Bcast(box, i);
        }));
        const arr_arr = bcast_boxes.map((box) => box.data);
        recv_ptr.data = Array.from({ length: send_ptr.data.length }, (_, elem_idx) => arr_arr[0][elem_idx]);
        for (let elem_idx = 0; elem_idx < send_ptr.data.length; elem_idx++) {
            for (let proc_idx = 1; proc_idx < config.global_num_proc; proc_idx++) {
                recv_ptr.data[elem_idx] = operation(recv_ptr.data[elem_idx], arr_arr[proc_idx][elem_idx]);
            }
        }
    }
});