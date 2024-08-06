class ExcTaskParams {
    /**
     * @param {(...args:any[])=>Promise<*>} func
     * @param {*[]} params
     * @param {string|undefined} err
     * @param {Page} pg
     * @param {boolean | undefined} reload_when_err
     */
    constructor({func, params, err, pg, reload_when_err}) {
        this.func = func;
        this.params = params;
        this.err = err;
        this.pg = pg;
        this.reload_when_err = reload_when_err;
    }
}

module.exports = {
    ExcTaskParams
}