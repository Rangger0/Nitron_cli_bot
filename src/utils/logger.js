const chalk = require("chalk");

const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

const APP_NAME = "ALPHA BOT";
const PROJECT_NAME = "NETRUN";

function center(text, width = 60) {
  if (text.length >= width) {
    return text;
  }

  const left = Math.floor((width - text.length) / 2);
  return `${" ".repeat(left)}${text}`;
}

class Logger {
  constructor(level = "info") {
    this.level = LogLevel[level.toUpperCase()] || LogLevel.INFO;
  }

  debug(message, data) {
    if (this.level <= LogLevel.DEBUG) {
      console.log(chalk.gray(`[${APP_NAME}] [DEBUG] ${message}`), data || "");
    }
  }

  info(message, data) {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.cyan(`[${APP_NAME}] > ${message}`), data || "");
    }
  }

  success(message, data) {
    if (this.level <= LogLevel.INFO) {
      console.log(chalk.green(`[${APP_NAME}] [OK] ${message}`), data || "");
    }
  }

  warn(message, data) {
    if (this.level <= LogLevel.WARN) {
      console.log(chalk.yellow(`[${APP_NAME}] [WARN] ${message}`), data || "");
    }
  }

  error(message, data) {
    if (this.level <= LogLevel.ERROR) {
      console.log(chalk.red(`[${APP_NAME}] [ERR] ${message}`), data || "");
    }
  }

  tx(txSignature) {
    console.log(chalk.green(`[${APP_NAME}] [TX] ${txSignature}`));
  }

  retry(attempt, maxAttempts) {
    console.log(chalk.yellow(`[${APP_NAME}] [RETRY] ${attempt}/${maxAttempts}...`));
  }

  header(text) {
    const width = 60;
    const line = "=".repeat(width);
    console.log(chalk.green(`\n${line}`));
    console.log(chalk.bold.green(center(APP_NAME, width)));
    console.log(chalk.green(center(`PROJECT: ${PROJECT_NAME}`, width)));
    console.log(chalk.bold.green(center(text, width)));
    console.log(chalk.green(`${line}\n`));
  }

  divider() {
    console.log(chalk.gray("-".repeat(60)));
  }
}

module.exports = Logger;
