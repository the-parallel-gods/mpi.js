/**
 * Class that handles the diagnostics for the MPI Core. It is used to profile the time taken by different functions in the MPI Core.
 */
class Diagnostics {
    /**
     * Nothing is done here because the configuration is done by the configure function.
     */
    constructor() { }

    /**
     * This function is used to configure the diagnostics. The configuration is done 
     * here after the object is created because many functions use the profile function
     * of this class before the smartdashboard is created.
     * 
     * @param {SmartDashboard} smartdashboard The SmartDashboard object to send the diagnostics to.
     * @param {boolean} enabled Whether the diagnostics are collected or not.
     * @param {number} period The period at which the diagnostics are sent to the SmartDashboard.
     */
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

    /**
     * Private function to start profiling a function.
     * 
     * @param {string} name The name of the function to profile.
     */
    #start_timer = (name) => {
        this.start_times[name] = performance.now();
    }

    /**
     * Private function to stop profiling a function.
     * 
     * @param {string} name The name of the function to stop profiling.
     */
    #end_timer = (name) => {
        this.delta_time_used[name] =
            (this.delta_time_used[name] || 0) + (performance.now() - this.start_times[name]);
    }

    /**
     * This function is a decorator that profiles the time taken by a function.
     * 
     * @param {function} fn The function to profile.
     * @returns {function} A new function that profiles the time taken by the original function.
     */
    profile = (name, fn) => {
        return async (...args) => {
            if (!this.enabled) return await fn(...args);
            this.#start_timer(name);
            const result = await fn(...args);
            this.#end_timer(name);
            if (performance.now() - this.last_flush > this.period) {
                this.last_flush = performance.now();
                await this.flush();
            }
            return result;
        }
    }

    /**
     * This function is used to flush the diagnostics to the SmartDashboard.
     * It sends the total time used by each function and the delta time used by each function.
     */
    flush = async () => {
        const now = performance.now();
        let total_other_time = now - this.total_start_time;
        let delta_other_time = now - this.delta_start_time;
        for (const key in this.delta_time_used) {
            this.total_time_used[key] = (this.total_time_used[key] || 0) + this.delta_time_used[key];
            total_other_time -= this.total_time_used[key];
            delta_other_time -= this.delta_time_used[key];
        }

        this.smartdashboard.putPie("Time (ms)", { ...this.total_time_used, "Computation": total_other_time });
        // this.smartdashboard.putPie("Delta Time", { ...this.delta_time_used, "Other": delta_other_time });
        // console.log("total time", now - this.total_start_time, "delta time", now - this.delta_start_time);
        this.delta_time_used = {};
        this.delta_start_time = now;
    }
}

const diagnostics = new Diagnostics();