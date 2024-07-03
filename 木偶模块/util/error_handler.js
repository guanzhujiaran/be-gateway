const fs = require('fs');
const path = require('path');
const { stack } = require('process');

function logError(errorMessage) {
  const callerStack = stack.split('\n').slice(1).find(line => line.includes(' at '));
  const timestamp = new Date().toISOString();
  const formattedErrorMessage = `[ERROR] ${errorMessage}`;
  const logEntry = `${timestamp} - ${callerStack} - ${formattedErrorMessage}\n`;
  fs.appendFileSync(path.join(__dirname, '../log/log.txt'), logEntry);
}

module.exports = logError;