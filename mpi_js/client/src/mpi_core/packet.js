export class Packet {
    constructor(src_pid, dest_pid_arr, tag, data) {
        this.src_pid = src_pid;
        this.dest_pid_arr = dest_pid_arr;
        this.tag = tag;
        this.data = data;
    }
}