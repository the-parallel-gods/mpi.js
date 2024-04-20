/**
 * @todo here
 */

const ring_reduce = () => { }
const tree_reduce = () => { }
const crossbar_reduce = () => { }

const reduce = config.interconnect_type === "crossbar" ? crossbar_reduce :
    (config.interconnect_type === "ring" ? ring_reduce : tree_reduce);