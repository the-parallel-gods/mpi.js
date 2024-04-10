class Diagnostics {
    constructor() { }
    configure(smartdashboard, enabled, period = 250) {
        this.enabled = enabled;
        this.period = period;
        this.last_flush = performance.now();
        this.smartdashboard = smartdashboard;
        this.start_times = {};
        this.total_time_used = {};
        this.delta_time_used = {};
        this.total_start_time = performance.now();
        this.delta_start_time = performance.now();
    }

    #start_timer = (name) => {
        this.start_times[name] = performance.now();
    }

    #end_timer = (name) => {
        this.delta_time_used[name] =
            (this.delta_time_used[name] || 0) + (performance.now() - this.start_times[name]);
    }

    profile = (fn) => {
        return async (...args) => {
            if (!this.enabled) return await fn(...args);
            this.#start_timer(fn.name);
            const result = await fn(...args);
            this.#end_timer(fn.name);
            if (performance.now() - this.last_flush > this.period) {
                this.last_flush = performance.now();
                await this.flush();
            }
            return result;
        }
    }

    flush = async () => {
        const now = performance.now();
        let total_other_time = now - this.total_start_time;
        let delta_other_time = now - this.delta_start_time;
        for (const key in this.delta_time_used) {
            this.total_time_used[key] = (this.total_time_used[key] || 0) + this.delta_time_used[key];
            total_other_time -= this.total_time_used[key];
            delta_other_time -= this.delta_time_used[key];
        }

        this.smartdashboard.putPie("Total Time", { ...this.total_time_used, "Other": total_other_time });
        this.smartdashboard.putPie("Delta Time", { ...this.delta_time_used, "Other": delta_other_time });
        // console.log("total time", now - this.total_start_time, "delta time", now - this.delta_start_time);
        this.delta_time_used = {};
        this.delta_start_time = now;
    }
}

const diagnostics = new Diagnostics();