
import chalk from 'chalk';
import { config } from '#config/config.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const LOG_DIR = path.resolve(__dirname, '../../logs');

class Logger {
  constructor() {
    this.infoColor = chalk.hex(config.colors.info);
    this.successColor = chalk.hex(config.colors.success);
    this.warningColor = chalk.hex(config.colors.warning);
    this.errorColor = chalk.hex(config.colors.error);

    this.initLogFiles();
  }

  initLogFiles() {
    try {
      if (!fs.existsSync(LOG_DIR)) {
        fs.mkdirSync(LOG_DIR, { recursive: true });
        console.log(`Created log directory at ${LOG_DIR}`);
      }

      this.logFilePath = path.join(LOG_DIR, 'bot.log');
      this.errorLogFilePath = path.join(LOG_DIR, 'error.log');
      
      this.rotateLogFileIfNeeded(this.logFilePath);
      this.rotateLogFileIfNeeded(this.errorLogFilePath);

      this.writeToLogFile(this.logFilePath,
        `========== Log started at ${new Date().toISOString()} ==========`);

    } catch (error) {
      console.error('Failed to initialize log files:', error);
    }
  }

  rotateLogFileIfNeeded(filePath) {
    try {
      if (fs.existsSync(filePath)) {
        const stats = fs.statSync(filePath);
        const fileSizeInMB = stats.size / (1024 * 1024);

        if (fileSizeInMB > 5) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
          const backupPath = `${filePath}.${timestamp}`;
          fs.renameSync(filePath, backupPath);
          console.log(`Rotated log file: ${filePath} -> ${backupPath}`);
        }
      }
    } catch (error) {
      console.error(`Failed to rotate log file ${filePath}:`, error);
    }
  }

  writeToLogFile(filePath, content) {
    try {
      fs.appendFileSync(filePath, content + '\n');
    } catch (error) {
      console.error(`Failed to write to log file ${filePath}:`, error);
    }
  }

  formatLogMessage(level, context, message) {
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level}] [${context}] ${message}`;
  }

  get timestamp() {
    return new Date().toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  }

  info(context, message) {
    console.log(
      chalk.blue(`[${this.timestamp}]`),
      chalk.bold(this.infoColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('INFO', context, message)
    );
  }

  success(context, message) {
    console.log(
      chalk.green(`[${this.timestamp}]`),
      chalk.bold(this.successColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('SUCCESS', context, message)
    );
  }

  warn(context, message) {
    console.log(
      chalk.yellow(`[${this.timestamp}]`),
      chalk.bold(this.warningColor(`[${context}]`)),
      chalk.whiteBright(message)
    );

    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('WARN', context, message)
    );
  }

  error(context, message, error) {
    console.log(
      chalk.red(`[${this.timestamp}]`),
      chalk.bold(this.errorColor(`[${context}]`)),
      chalk.red(message)
    );

    if (error) {
      console.error(error);
    }

    this.writeToLogFile(
      this.logFilePath,
      this.formatLogMessage('ERROR', context, message)
    );

    let errorLog = this.formatLogMessage('ERROR', context, message);
    if (error) {
      errorLog += `\nStack trace: ${error.stack || error}`;
    }
    this.writeToLogFile(this.errorLogFilePath, errorLog);
  }

  debug(context, message) {
    if (process.env.NODE_ENV === 'development' || config.debug) {
      console.log(
        chalk.magenta(`[${this.timestamp}]`),
        chalk.bold.magenta(`[${context}]`),
        chalk.whiteBright(message)
      );

      this.writeToLogFile(
        this.logFilePath,
        this.formatLogMessage('DEBUG', context, message)
      );
    }
  }
}
export const logger = new Logger();