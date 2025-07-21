const pino = require('pino');
const path = require('path');

const validLogLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'];

const logger = pino({
  level: validLogLevels.includes(process.env.LOG_LEVEL) ? process.env.LOG_LEVEL : 'info',
  transport: process.env.NODE_ENV !== 'production' ? {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  } : {
    targets: [
      {
        target: 'pino/file',
        options: {
          destination: path.join(__dirname, '../logs/app.log'),
          mkdir: true,
        },
      },
      {
        target: 'pino-pretty',
        options: {
          colorize: false,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
          ignore: 'pid,hostname',
        },
      },
    ],
  },
  base: {
    pid: false,
    hostname: false,
  },
  formatters: {
    log: (object) => {
      return {
        ...object,
        timestamp: new Date().toISOString(),
        context: object.context || {},
      };
    },
  },
});

module.exports = {
  info: (data, message) => logger.info({ context: data }, message),
  warn: (data, message) => logger.warn({ context: data }, message),
  error: (data, message) => logger.error({ context: data }, message),
};