class manual_op_fail_model {
    dynamic_info;
    err_msg;
    comment_msg;

    /**
     *
     * @param {TYPE_dynamic_info} dynamic_info
     * @param {string} err_msg
     */
    constructor(dynamic_info, err_msg = "") {
        this.dynamic_info = dynamic_info;
        this.err_msg = err_msg;
        this.comment_msg = "";
    }
}

module.exports = {
    manual_op_fail_model
}