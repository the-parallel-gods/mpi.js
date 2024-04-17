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

const create_crossbar = (num_nodes) => {
    let edges = [];
    let routing_tables = Array.from(
        { length: num_nodes }, () => Array.from({ length: num_nodes }, () => -1)
    );
    for (let i = 0; i < num_nodes; i++) {
        for (let j = i + 1; j < num_nodes; j++) {
            edges.push([i, j]);
            routing_tables[i][j] = j;
            routing_tables[j][i] = i;
        }
        routing_tables[i][i] = i;
    }
    return { edges, routing_tables };
}

/**
 * This function creates channels between some pairs of workers.
 * This function does not create the channels object, but rather
 * pairs of ints that represent the workers that are connected.
 * 
 * The pattern being created is a ring structure.
 * 
 * This function also provides the routing table for each node,
 * so they know where to send messages when they need to communicate
 * with different nodes.
 * 
 * For example, if we have 4 workers, the following channels will be created:
 * 
 * 0 <---> 1
 * 1 <---> 2
 * 2 <---> 3
 * 3 <---> 0
 * 
 * For N workers, the number of channels created is O(N)
 * 
 * The longest path between any two workers is O(N)
 * 
 * @param {number} num_nodes 
 * @returns 
 */
const create_ring = (num_nodes) => {
    let edges = [];
    for (let i = 0; i < num_nodes; i++)
        edges.push([i, (i + 1) % num_nodes]);

    let routing_tables = Array.from({ length: num_nodes }, () => []);
    for (let i = 0; i < num_nodes; i++) {
        for (let j = 0; j < num_nodes; j++) {
            if (i === j) {
                routing_tables[i].push(j);
                continue;
            }
            const left_dist = (j - i + num_nodes) % num_nodes;
            const right_dist = (i - j + num_nodes) % num_nodes;
            let direction = 0;
            if (left_dist < right_dist) direction = 1;
            else if (left_dist > right_dist) direction = -1;
            else direction = i % 2 === 0 ? 1 : -1;
            routing_tables[i].push((i + direction + num_nodes) % num_nodes);
        }
    }
    console.log(edges, routing_tables);
    return { edges, routing_tables };
}

/**
 * This function creates channels between some pairs of workers.
 * This function does not create the channels object, but rather
 * pairs of ints that represent the workers that are connected.
 * 
 * The pattern being created is a tree structure.
 * 
 * This function also provides the routing table for each node,
 * so they know where to send messages when they need to communicate
 * with different nodes.
 * 
 * Important note: This function only works when the number of workers
 * is a power of 2.
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
 * For N workers, the number of channels created is O(N)
 * 
 * The longest path between any two workers is O(log(N))
 * 
 * @function
 * @param {number} num_nodes number of workers locally that needs to connect
 * @returns {{edges: number[][], routing_tables: number[][]}} The result routing computation
 */
const create_tree_pow_of_2 = (num_nodes) => {
    if (Math.ceil(Math.log2(num_nodes)) !== Math.floor(Math.log2(num_nodes)))
        throw new Error("Number of nodes must be a power of 2");

    let edges = [];
    const num_layers = Math.log2(num_nodes);
    for (let layer_idx = 0; layer_idx < num_layers; layer_idx++) {
        const stride = Math.pow(2, layer_idx + 1);
        const width = Math.pow(2, layer_idx);
        for (let i = 0; i < num_nodes; i += stride)
            edges.push([i, i + width]);
    }
    let routing_tables = Array.from(
        { length: num_nodes }, () => Array.from({ length: num_nodes }, () => -1)
    );

    for (let nodeIdx = 0; nodeIdx < num_nodes; nodeIdx++)
        routing_tables[nodeIdx][nodeIdx] = nodeIdx;

    for (; ;) {
        let not_done = false;
        for (const edge of edges) {
            const [node1, node2] = edge;
            const add_route = (from, to) => {
                for (let i = 0; i < num_nodes; i++) {
                    if (routing_tables[to][i] !== -1 && routing_tables[from][i] === -1) {
                        routing_tables[from][i] = to;
                        not_done = true;
                    }
                }
            }
            add_route(node1, node2) || add_route(node2, node1);
        }
        if (!not_done) break;
    }
    return { edges, routing_tables };
}

/**
 * This function creates channels between some pairs of workers.
 * This function does not create the channels object, but rather
 * pairs of ints that represent the workers that are connected.
 * 
 * The pattern being created is a tree structure.
 * 
 * This function also provides the routing table for each node,
 * so they know where to send messages when they need to communicate
 * with different nodes.
 * 
 * This function works for any number of workers, even if it is not a power of 2.
 * 
 * For example, if we have 7 workers, the following channels will be created:
 * 
 * 0 <---> 1
 * 2 <---> 3
 * 4 <---> 5
 * 0 <---> 2
 * 4 <---> 6
 * 0 <---> 4
 * 
 * For N workers, the number of channels created is O(N)
 * 
 * The longest path between any two workers is O(log(N))
 * 
 * @function
 * @param {number} num_nodes number of workers locally that needs to connect
 * @returns {{edges: number[][], routing_tables: number[][]}} The result routing computation
 */
const create_tree = (num_nodes) => {
    const next_power_of_two = Math.pow(2, Math.ceil(Math.log2(num_nodes)));
    const { edges, routing_tables } = create_tree_pow_of_2(next_power_of_two);
    return {
        edges: edges.filter(edge => edge[0] < num_nodes && edge[1] < num_nodes),
        routing_tables: routing_tables.slice(0, num_nodes).map(row => row.slice(0, num_nodes)),
    };
}

export {
    create_crossbar,
    create_ring,
    create_tree,
};