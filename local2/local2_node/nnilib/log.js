'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const util = require("util");
exports.DEBUG = 10;
exports.INFO = 20;
exports.WARNING = 30;
exports.ERROR = 40;
exports.CRITICAL = 50;
exports.TRACE = 1;
exports.FATAL = 50;
const levelNames = new Map([
    [exports.CRITICAL, 'CRITICAL'],
    [exports.ERROR, 'ERROR'],
    [exports.WARNING, 'WARNING'],
    [exports.INFO, 'INFO'],
    [exports.DEBUG, 'DEBUG'],
    [exports.TRACE, 'TRACE'],
]);
let logLevel = 0;
const loggers = new Map();
class Logger {
    constructor(name = 'root') {
        this.name = name;
    }
    trace(...args) {
        this.log(exports.TRACE, args);
    }
    debug(...args) {
        this.log(exports.DEBUG, args);
    }
    info(...args) {
        this.log(exports.INFO, args);
    }
    warning(...args) {
        this.log(exports.WARNING, args);
    }
    error(...args) {
        this.log(exports.ERROR, args);
    }
    critical(...args) {
        this.log(exports.CRITICAL, args);
    }
    fatal(...args) {
        this.log(exports.FATAL, args);
    }
    log(level, args) {
        const logFile = global.logFile;
        if (level < logLevel || logFile === undefined) {
            return;
        }
        const isoTime = new Date(new Date().toLocaleString() + ' UTC').toISOString();
        const time = isoTime.slice(0, 10) + ' ' + isoTime.slice(11, 19);
        const levelName = levelNames.has(level) ? levelNames.get(level) : level.toString();
        const message = args.map(arg => (typeof arg === 'string' ? arg : util.inspect(arg))).join(' ');
        const record = `[${time}] ${levelName} (${this.name}) ${message}\n`;
        logFile.write(record);
    }
}
exports.Logger = Logger;
function getLogger(name = 'root') {
    let logger = loggers.get(name);
    if (logger === undefined) {
        logger = new Logger(name);
        loggers.set(name, logger);
    }
    return logger;
}
exports.getLogger = getLogger;
function setLogLevel(levelName) {
    if (levelName) {
        const level = module.exports[levelName.toUpperCase()];
        if (typeof level === 'number') {
            logLevel = level;
        }
        else {
            console.log('[ERROR] Bad log level:', levelName);
            getLogger('logging').error('Bad log level:', levelName);
        }
    }
}
exports.setLogLevel = setLogLevel;
function startLogging(logPath) {
    global.logFile = fs.createWriteStream(logPath, {
        flags: 'a+',
        encoding: 'utf8',
        autoClose: true
    });
}
exports.startLogging = startLogging;
function stopLogging() {
    if (global.logFile !== undefined) {
        global.logFile.end();
        global.logFile = undefined;
    }
}
exports.stopLogging = stopLogging;
