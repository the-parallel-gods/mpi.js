class SmartDashboard {
    constructor(enabled, send_msg_fn, period = 250) {
        this.enabled = enabled;
        this.send_msg_fn = send_msg_fn;
        this.delta = {};
        this.period = period;
        this.last_flush = performance.now();
    }

    #create_variable(name, type) {
        this.delta[name] = { type, data: [] };
    }

    #update_variable(name, value, type, downsample) {
        if (!this.enabled) return;
        !this.delta[name] && this.#create_variable(name, type);
        if (downsample) this.delta[name].data = [];
        this.delta[name].data.push(value);
        // console.log("SmartDashboard updated", name, value);
        if (performance.now() - this.last_flush > this.period) {
            this.last_flush = performance.now();
            this.flush();
        }
    }

    putPie(name, dict, downsample = true) {
        this.#update_variable(name, dict, 'pie', downsample);
    }

    putProgress(name, value, downsample = true) {
        this.#update_variable(name, value, 'progress', downsample);
    }

    putGraph(name, value, downsample = true) {
        this.#update_variable(name, value, 'graph', downsample);
    }

    putString(name, value, downsample = true) {
        this.#update_variable(name, value, 'string', downsample);
    }

    flush() {
        if (!this.enabled) return;
        if (Object.keys(this.delta).length === 0) return;
        this.send_msg_fn(this.delta);
        console.log("SmartDashboard sent", this.delta);
        this.delta = {};
    }
}
