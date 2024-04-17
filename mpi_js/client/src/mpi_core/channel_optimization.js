/**
 * This function creates channels between all pairs of workers.
 * This function does not create the channels object, but rather
 * pairs of ints that represent the workers that are connected.
 * 
 * This function also provides the routing table for each node, 
 * so they know where to send messages when they need to communicate
 * with different nodes.
 * 
 * @function
 * @param {number} num_nodes number of workers locally that needs to connect
 * @returns {{edges: number[][], routing_tables: number[][]}} The result routing computation
 */

const create_full_channels = (num_nodes) => {
    let edges = [];
    let routing_tables = Array.from({ length: num_nodes }, () => []);
    for (let i = 0; i < num_nodes; i++) {
        for (let j = i + 1; j < num_nodes; j++) {
            edges.push([i, j]);
            routing_tables[i].push(j);
            routing_tables[j].push(i);
        }
    }
    return { edges, routing_tables };
}


/**
 * This function creates channels between some pairs of workers.
 * This function does not create the channels object, but rather
 * pairs of ints that represent the workers that are connected.
 * 
 * This function also provides the routing table for each node,
 * so they know where to send messages when they need to communicate
 * with different nodes.
 * 
 * For example, if we have 8 workers, the following channels will be created:
 * 
 * 0 <---> 1
 * 2 <---> 3
 * 4 <---> 5
 * 6 <---> 7
 * 0 <---> 2
 * 4 <---> 6
 * 0 <---> 4
 * 
 * For N workers, the number of channels created is O(log(N)).
 * 
 * The longest path between any two workers is O(log(N))
 * 
 * @function
 * @param {number} num_nodes 
 * @returns {{edges: number[][], routing_tables: number[][]}} The result routing computation
 */
const create_log_n_channels_power_of_two = (num_nodes) => {
    if (Math.ceil(Math.log2(num_nodes)) !== Math.floor(Math.log2(num_nodes))) {
        throw new Error("Number of nodes must be a power of 2");
    }
    let edges = [];
    const num_layers = Math.log2(num_nodes);
    for (let layer_idx = 0; layer_idx < num_layers; layer_idx++) {
        const stride = Math.pow(2, layer_idx + 1);
        const width = Math.pow(2, layer_idx);
        for (let i = 0; i < num_nodes; i += stride) {
            edges.push([i, i + width]);
            console.log(i, "<--->", i + width);
        }
    }
    let routing_tables = Array.from({ length: num_nodes }, () => []);


}


create_log_n_channels_power_of_two(16);