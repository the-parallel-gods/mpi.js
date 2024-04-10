class MPI_Request {
    constructor() {
        this.done = false;
        this.test_callback = async () => this.done;
        this.wait_callback = async () => null;
    }

    set_test_callback(callback) {
        this.test_callback = callback;
        return this;
    }

    set_wait_callback(callback) {
        this.wait_callback = callback;
        return this;
    }

    async test() {
        if (this.done) return true;
        const result = await this.test_callback();
        if (result) this.done = true;
        return result;
    }

    async wait() {
        if (this.done) return;
        this.done = true;
        await this.wait_callback();
    }
}