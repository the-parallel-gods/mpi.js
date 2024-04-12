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
        this.smartdashboard = smartdashboard;
        this.total_time_used = {};
        this.num_sends = 0;
        this.num_recvs = 0;
        this.last_flush = performance.now();
        this.total_start_time = performance.now();
        this.delta_start_time = performance.now();
    }

    /**
     * Diagnostic function to count the number of sends in node_router.
     */
    add_send = () => {
        this.num_sends++;
    }

    /**
     * Diagnostic function to count the number of receives in node_router.
     */
    add_recv = () => {
        this.num_recvs++;
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
            const start_time = performance.now();
            const result = await fn(...args);
            this.total_time_used[name] = (this.total_time_used[name] || 0) + (performance.now() - start_time);
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
        for (const key in this.total_time_used) total_other_time -= this.total_time_used[key];
        const sends_per_sec = this.num_sends / (now - this.delta_start_time) * 1000;
        const recvs_per_sec = this.num_recvs / (now - this.delta_start_time) * 1000;

        this.smartdashboard.putPie("Time (ms)", { ...this.total_time_used, "Computation": total_other_time });
        this.smartdashboard.putGraph("Sends/sec", sends_per_sec, false);
        this.smartdashboard.putGraph("Recvs/sec", recvs_per_sec, false);
        this.delta_start_time = now;
        this.num_sends = 0;
        this.num_recvs = 0;
    }
}

const diagnostics = new Diagnostics();