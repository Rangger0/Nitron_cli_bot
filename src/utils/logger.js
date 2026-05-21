const chalk = require("chalk");

function repeat(ch, n) {
  return ch.repeat(Math.max(0, n));
}

function box({
  width,
  title,
  subtitle,
  fillChar = " ",
  header = "double"
}) {
  // Simple renderer to mimic screenshot style using unicode borders.
  // width includes border characters.
  const inner = width - 2;
  const topLeft = header === "double" ? "╔" : "┌";
  const topRight = header === "double" ? "╗" : "┐";
  const midLeft = header === "double" ? "╠" : "├";
  const midRight = header === "double" ? "╣" : "┤";
  const bottomLeft = header === "double" ? "╚" : "└";
  const bottomRight = header === "double" ? "╝" : "┘";
  const horiz = header === "double" ? "═" : "─";
  const vert = "║";
  const leftVert = "║";
  const rightVert = "║";

  const mkLine = (left, fill = horiz, right) => `${left}${repeat(fill, inner)}${right}`;

  const makeRow = (text = "", padRight = true) => {
    const t = String(text);
    const clipped = t.slice(0, inner);
    const pad = inner - clipped.length;
    return `${leftVert}${clipped}${padRight ? repeat(fillChar, pad) : ""}${rightVert}`;
  };

  const lines = [];
  lines.push(mkLine(topLeft));
  if (title) lines.push(makeRow(chalk.bold(title), true));
  if (subtitle) lines.push(makeRow(subtitle, true));
  lines.push(mkLine(midLeft));
  lines.push(`${vert}${repeat(fillChar, inner)}${vert}`);
  // footer border will be handled by caller (panel) for flexibility
  lines.push(mkLine(bottomLeft));
  return lines.join("\n");
}

function panel({
  left = "┌",
  right = "┐",
  bottomLeft = "└",
  bottomRight = "┘",
  topFill = "─",
  vert = "│",
  mid = "├",
  midRight = "┤",
  midLeft = "├",
  width,
  title,
  lines = []
}) {
  const inner = width - 2;
  const top = `${left}${repeat(topFill, inner)}${right}`;
  const titleRow = title
    ? `${vert}${String(title).slice(0, inner)}${repeat(" ", inner - String(title).slice(0, inner).length)}${vert}`
    : `${vert}${repeat(" ", inner)}${vert}`;
  const midBorder = `${midLeft}${repeat("─", inner)}${midRight}`;
  const body = lines.map((l) => {
    const text = String(l);
    const clipped = text.slice(0, inner);
    return `${vert}${clipped}${repeat(" ", inner - clipped.length)}${vert}`;
  });
  const bottom = `${bottomLeft}${repeat("─", inner)}${bottomRight}`;
  return [top, titleRow, midBorder, ...body, bottom].join("\n");
}


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
module.exports.box = box;
module.exports.panel = panel;

