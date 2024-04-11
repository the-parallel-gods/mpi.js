class SmartDashboard {
    /**
     * @class SmartDashboard
     * @classdesc Class that handles the SmartDashboard for the MPI Core.
     * SmartDashboard is used to send real-time telemetry data to the main UI process.
     */

    /**
     * @typedef {'pie' | 'progress' | 'graph' | 'string'} SmartDashboardType
     */


    /**
     * @constructor for the SmartDashboard class. It initializes the SmartDashboard object.
     * 
     * @param {boolean} enabled Whether the SmartDashboard is enabled or not.
     * @param {function} send_msg_fn The function to send the message to the main UI process.
     * @param {number} period The period at which the SmartDashboard is ideally flushed.
     */
    constructor(enabled, send_msg_fn, period = 250) {
        this.enabled = enabled;
        this.send_msg_fn = send_msg_fn;
        this.delta = {};
        this.period = period;
        this.last_flush = performance.now();
    }

    /**
     * Private function to create a variable in the SmartDashboard.
     * 
     * @param {string} name The name of the variable to create.
     * @param {SmartDashboardType} type The type of the variable to create.
     */
    #create_variable(name, type) {
        this.delta[name] = { type, data: [] };
    }

    /**
     * Private function to update a variable in the SmartDashboard. 
     * If the variable does not exist, it is created.
     * 
     * Downsample means to only keep the most recent data point.
     * This is useful for real-time, but should be turned off for logs.
     * 
     * @param {string} name The name of the variable to update.
     * @param {any} value The value of the variable to update.
     * @param {SmartDashboardType} type The type of the variable to update.
     * @param {boolean} downsample Whether to downsample the data or not.
     */
    #update_variable(name, value, type, downsample) {
        if (!this.enabled) return;
        !this.delta[name] && this.#create_variable(name, type);
        if (downsample) this.delta[name].data = [];
        this.delta[name].data.push(value);
        // console.log("SmartDashboard updated", name, value);
        if (performance.now() - this.last_flush > this.period) {
            this.flush();
        }
    }

    /**
     * This function is used to put a pie chart in the SmartDashboard.
     * 
     * Downsample means to only keep the most recent data point.
     * This is useful for real-time, but should be turned off for logs.
     * 
     * @param {string} name The name of the pie chart.
     * @param {Record<string, number>} dict The data for the pie chart.
     * @param {boolean} downsample Whether to downsample the data or not.
     */
    putPie(name, dict, downsample = true) {
        this.#update_variable(name, dict, 'pie', downsample);
    }

    /**
     * This function is used to put a progress bar in the SmartDashboard.
     * 
     * Downsample means to only keep the most recent data point.
     * This is useful for real-time, but should be turned off for logs.
     * 
     * @param {string} name The name of the progress bar.
     * @param {number} value The value of the progress bar.
     * @param {boolean} downsample Whether to downsample the data or not.
     */
    putProgress(name, value, downsample = true) {
        this.#update_variable(name, value, 'progress', downsample);
    }

    /**
     * This function is used to put a graph in the SmartDashboard.
     * 
     * Downsample means to only keep the most recent data point.
     * This is useful for real-time, but should be turned off for logs.
     * 
     * @param {string} name The name of the graph.
     * @param {number} value The value of the graph.
     * @param {boolean} downsample Whether to downsample the data or not.
     */
    putGraph(name, value, downsample = true) {
        this.#update_variable(name, value, 'graph', downsample);
    }

    /**
     * This function is used to put a string in the SmartDashboard.
     * 
     * Downsample means to only keep the most recent data point.
     * This is useful for real-time, but should be turned off for logs.
     * 
     * @param {string} name The name of the string.
     * @param {string} value The value of the string.
     * @param {boolean} downsample Whether to downsample the data or not.
     */
    putString(name, value, downsample = true) {
        this.#update_variable(name, value, 'string', downsample);
    }

    /**
     * This function is used to flush the SmartDashboard.
     * 
     * Every time a variable is updated, SmartDashboard will try to flush the data,
     * but it will only flush if the period has passed.
     * 
     * So if variables are not updated frequently, some data may not be flushed.
     * Use this function to force a flush.
     * 
     * This function does not respect the min period.
     */
    flush() {
        if (!this.enabled) return;
        this.last_flush = performance.now();
        if (Object.keys(this.delta).length === 0) return;
        this.send_msg_fn(this.delta);
        console.log("SmartDashboard sent", this.delta);
        this.delta = {};
    }

    /**
     * This function is used to soft flush the SmartDashboard.
     * 
     * Every time a variable is updated, SmartDashboard will try to flush the data,
     * but it will only flush if the period has passed.
     * 
     * So if variables are not updated frequently, some data may not be flushed.
     * Use this function to force a flush.
     * 
     * This function respects the min period. You can call this function as frequently as you want.
     */
    soft_flush() {
        if (performance.now() - this.last_flush > this.period) {
            this.flush();
        }
    }
}
