const { formatTimestamp } = require("./helpers");

const originalLog = console.log;
console.log = function (...args) {
    originalLog(`[${formatTimestamp()}]`, ...args);
};

const originalError = console.error;
console.error = function (...args) {
    originalError(`[${formatTimestamp()}]`, ...args);
};

module.exports = {};
