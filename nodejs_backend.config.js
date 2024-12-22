module.exports = {
    apps: [{
        name: 'nodejs_express_backend_nginx',
        script: './ExpressServerEnd/ServerRun.js',
        cwd: 'K:/BiliPPTRVerDEV',
        args:'--env=prod',
        wait_ready: true,
        exec_mode: "fork",
        autorestart: true,
        watch: false,
        // out_file: "/dev/null",
        // error_file: "/dev/null"
    }
    ]
};