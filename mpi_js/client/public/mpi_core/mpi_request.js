/**
 * @classdesc This is the MPI_Request class. It is returned by the non-blocking functions in the MPI Core.
 * It can be used to test if the request is done or to wait for the request to be done.
 */
class MPI_Request {
    /**
     * @constructor for the MPI_Request class.
     * 
     * @param {boolean} done Whether the request is done or not.
     */
    constructor(done = false) {
        this.done = done;
        this.test_callback = async () => this.done;
        this.wait_callback = async () => null;
    }

    /**
     * Set the test callback for the MPI_Request. 
     * This callback is used to test if the request is done.
     * Regardless of whether the request is done or not, 
     * the callback should immediately return a boolean.
     * 
     * @param {function} callback The callback to set.
     * @returns {MPI_Request} The current MPI_Request object.
     */
    set_test_callback(callback) {
        this.test_callback = callback;
        return this;
    }

    /**
     * Set the wait callback for the MPI_Request.
     * This callback is used to wait for the request to be done.
     * The callback should return a promise that resolves when the request is done.
     * 
     * @param {function} callback The callback to set.
     * @returns {MPI_Request} The current MPI_Request object.
     */
    set_wait_callback(callback) {
        this.wait_callback = callback;
        return this;
    }

    /**
     * Test if the request is done. Regardless of whether the request is done or not,
     * the callback should immediately return a boolean.
     * 
     * @returns {Promise<boolean>} A promise that resolves when the test is done, indicating whether the request is done.
     */
    async test() {
        if (this.done) return true;
        const result = await this.test_callback();
        if (result) this.done = true;
        return this.done;
    }

    /**
     * Wait for the request to be done. 
     * The callback should return a promise that resolves when the request is done.
     * 
     * @returns A promise that resolves when the request is done.
     */
    async wait() {
        if (this.done) return;
        this.done = true;
        await this.wait_callback();
    }
}