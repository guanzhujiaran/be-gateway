const run_env_args = require("minimist")(process.argv.slice(2));
console.log(`运行参数: ${JSON.stringify(run_env_args)}`)
console.log(`运行环境参数: ${JSON.stringify(process.env)}`)
module.exports = run_env_args