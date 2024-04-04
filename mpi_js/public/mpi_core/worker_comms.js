class Packet {
    constructor(src_pid, dest_pid, data) {
        this.src_pid = src_pid;
        this.dest_pid = dest_pid;
        this.data = data;
        Object.freeze(this);
    }
}


/**
 *             data.port.onmessage = function (e) {
                if (e.data.dest === my_pid) {
                    on_receive(data.portPid, e.data.msg);
                } else {
                    send(data.portPid, e.data.dest, e.data.msg);
                }
            }
 */
class WorkerComms {
    /**
     * my_pid is a number
     * node_list is a list of list of numbers [[machine 1's node_pids], [machine 2's node_pids], ...]
     * my_channels is a list MessagePort objects (things you can send messages to other machines with)
     * channel_ports is a list of [port 1, port 2] pairs (a adjacency list of this machine's channels)
     * bcast_channel is a MessagePort object
     * 
     * @param {number} my_pid 
     * @param {number[][]} node_list
     * @param {MessagePort[]} my_channels
     * @param {number[][]} channel_ports
     * @param {MessagePort} bcast_channel
     */
    constructor(my_pid, node_list, my_channels, channel_ports, bcast_channel = null) {
        this.my_pid = my_pid;
        this.node_list = node_list;
        this.my_channels = my_channels;
        this.channel_ports = channel_ports;
        this.bcast_channel = bcast_channel;
        this.hops_table = []
        // populate hops table in constructor? 

        // bfs on channel_ports to populate hops_table
        // Write all shortest paths from every node to every other node
    }

    num_hops = async (dest_pid) => {
        return this.hops_table[dest_pid];
    }

    send = async (dest_pid) => {

    }

    receive_any = async () => {

    }

    receive_from = async (src_pid) => {

    }

    bcast = async () => {

    }

    send_list = async (dest_pids) => {
        await dest_pids.foreach((x) => send(x));
    }
}
