
/**
 * This function partitions the work equally to the number of processors.
 * 
 * For example, if there is 6 work and 4 processors, the function will return
 * [2, 2, 1, 1] and [0, 2, 4, 5].
 * 
 * Note that it will not return [2, 2, 2, 0] and [0, 2, 4, 6] because the work 
 * is not evenly distributed. The result will have difference of at most 1.
 * 
 * @param {number} count The total number of work.
 * @param {number} num_proc The number of processors.
 * @returns {{sizes: number[], offsets: number[]}} The sizes and start indexes of the work.
 */
const partition = (count, num_proc) => {
    const slice_size = Math.ceil(count / num_proc);
    const max_count = num_proc - (slice_size * num_proc - count);
    const sizes = Array.from({ length: num_proc }, (_, i) => i < max_count ? slice_size : slice_size - 1);
    let offsets = [0];
    for (let i = 1; i < num_proc; i++)
        offsets.push(offsets[i - 1] + sizes[i - 1]);
    return { sizes, offsets };
}


/**
 * This function makes a wrap function that wraps the index around the array.
 * 
 * @param {number} n The size of the array.
 * @returns {function(number): number} The wrap function that wraps the index around the array.
 */
const make_wrap = (n) => {
    return (x) => ((x % n) + n) % n;
}