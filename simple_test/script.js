const num_processes = 20;
const end_num = 20000000;

let results = [];

const get_proc_count = (num_total, num_procs) => {
    const base_count = Math.floor(num_total / num_procs);
    let counts = Array(num_procs).fill(base_count);
    let offsets = Array(num_procs).fill(0);
    let remainder = num_total - base_count * num_procs;
    for (let i = 0; i < remainder; i++)
        counts[i]++;
    for (let i = 1; i < num_procs; i++)
        offsets[i] = offsets[i - 1] + counts[i - 1];
    return { counts, offsets };
}

const { counts, offsets } = get_proc_count(end_num, num_processes);
const start_time = new Date().getTime();
console.log('Starting workers:', num_processes);

for (let i = 0; i < num_processes; i++) {
    const worker = new Worker('worker.js');

    worker.onmessage = function (event) {
        console.log('Worker finished:', i);
        results.push(event.data);
        if (results.length === num_processes) {
            const end_time = new Date().getTime();
            console.log('Time taken:', (end_time - start_time) / 1000, 'seconds');
        }
    }

    worker.postMessage({
        pid: i,
        start_num: offsets[i],
        end_num: offsets[i] + counts[i],
    });
}


