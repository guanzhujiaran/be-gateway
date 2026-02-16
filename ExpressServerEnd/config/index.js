const fs = require('fs');
const yaml = require('js-yaml');
const path = require('path');
let fileContents = fs.readFileSync(path.join(__dirname, "config.yml"), 'utf8');
const config = yaml.load(fileContents, 'utf8');
console.log(`全局设置：${JSON.stringify(config,null,2)}`)
module.exports = config