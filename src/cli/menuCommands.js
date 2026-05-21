const readline = require("readline");
const Logger = require("../utils/logger");
const config = require("../config/config");
const { netrunDailyCommand } = require("./botCommands");

function question(rl, label, fallback) {
  const suffix = fallback !== undefined && fallback !== "" ? ` (${fallback})` : "";

  return new Promise((resolve) => {
    rl.question(`[ALPHA BOT] ? ${label}${suffix}: `, (answer) => {
      const value = answer.trim();
      resolve(value || String(fallback || ""));
    });
  });
}

function normalizeYes(value) {
  return ["y", "yes", "ya", "iya"].includes(String(value).trim().toLowerCase());
}

function renderDashboardPanel({ panelLeftTitle, panelRightTitle, leftLines, rightLines }) {
  const chalk = require("chalk");
  const { panel } = require("../utils/logger");

  const width = 56;
  const gap = "    "; // gap antar kolom supaya rapi

  // Pastikan jumlah baris sama (simetris)
  const leftArr = Array.isArray(leftLines) ? leftLines : [];
  const rightArr = Array.isArray(rightLines) ? rightLines : [];
  const total = Math.max(leftArr.length, rightArr.length);

  const padTo = (arr) => {
    const out = arr.slice(0, total);
    while (out.length < total) out.push("");
    return out;
  };

  const leftLinesPadded = padTo(leftArr);
  const rightLinesPadded = padTo(rightArr);

  const colorize = (line) => {
    const s = String(line);

    // Wallet labels
    if (s.includes("Wallet Loaded")) return chalk.cyan(s);
    if (s.includes("Active Wallet")) return chalk.cyan(s);
    if (s.includes("Total Balance")) return chalk.magenta(s);

    // Tx stats
    if (s.includes("Success")) return chalk.green(s);
    if (s.includes("Failed")) return chalk.red(s);

    // Right panel logs/status
    if (s.includes("Connecting RPC")) return chalk.yellow(s);
    if (s.includes("Daily Automation")) return chalk.cyan(s);
    if (s.includes("Mint")) return chalk.green(s);

    return s;
  };

  const left = panel({
    width,
    title: panelLeftTitle,
    left: "┌",
    right: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    midLeft: "├",
    midRight: "┤",
    lines: leftLinesPadded.map(colorize)
  });

  const right = panel({
    width,
    title: panelRightTitle,
    left: "┌",
    right: "┐",
    bottomLeft: "└",
    bottomRight: "┘",
    midLeft: "├",
    midRight: "┤",
    lines: rightLinesPadded.map(colorize)
  });

  const leftLinesSplit = left.split("\n");
  const rightLinesSplit = right.split("\n");

  return leftLinesSplit
    .map((l, i) => `${l}${gap}${rightLinesSplit[i] || ""}`)
    .join("\n");
}

async function openMenuCommand() {
  const logger = new Logger(config.logLevel);

  if (!process.stdin.isTTY) {
    logger.header("NETRUN MANUAL");
    logger.info("Run `node src/index.js help` to see commands.");
    return;
  }

  // Keep the prompt logic exactly as before; only visual rendering changes.
  logger.header("NETRUN BOT DAILY SYSTEM");

  const chalk = require("chalk");
  const { box } = require("../utils/logger");
  const { panel } = require("../utils/logger");

  // Top banner (dashboard style)
  console.log(
    box({
      width: 78,
      title: "NETRUN BOT DAILY",
      fillChar: "═",
      header: "double"
    })
  );

  // USER INFO + SYSTEM LOGS (visual-only)
  const leftColW = 32;
  const rightColW = 44;
  const makeCell = (text, width) => {
    const s = String(text);
    const clipped = s.slice(0, width - 1);
    return clipped + " ".repeat(width - 1 - clipped.length);
  };

  const tLeft = (text) => makeCell(text, leftColW);
  const tRight = (text) => makeCell(text, rightColW);

  const borderTop = `┌${"─".repeat(leftColW)}┬${"─".repeat(rightColW)}┐`;
  const borderMid = `├${"─".repeat(leftColW)}┼${"─".repeat(rightColW)}┤`;
  const borderBot = `└${"─".repeat(leftColW)}┴${"─".repeat(rightColW)}┘`;

  console.log(borderTop);
  console.log(`│${tLeft("USER INFO")}│${tRight("SYSTEM LOGS")}│`);
  console.log(borderMid);

  // Placeholder rows (keeps current behavior: menu screen is visual, runtime values unknown here)
  const userRows = [
    chalk.cyan("Wallet Loaded") + `   : ${"?".padEnd(4, " ")}`,
    chalk.cyan("Active Wallet") + `   : ${"?".padEnd(4, " ")}`,
    chalk.magenta("Total Balance") + ` : ${"?"}`,
    chalk.cyan("Today TX") + `       : ${"?"}`,
    chalk.green("Success TX") + `     : ${"?"}`,
    chalk.red("Failed TX") + `      : ${"?"}`
  ];

  const sysRows = [
    `[${new Date().toLocaleTimeString()}] Initializing Bot System`,
    `[${new Date().toLocaleTimeString()}] RPC Connection Established`,
    `[${new Date().toLocaleTimeString()}] Loading Wallet Session`,
    `[${new Date().toLocaleTimeString()}] Wallet #01 Connected`,
    `[${new Date().toLocaleTimeString()}] Executing Daily Automation`,
    `[${new Date().toLocaleTimeString()}] Runtime Started`
  ];

  const maxRows = Math.max(userRows.length, sysRows.length);
  for (let i = 0; i < maxRows; i++) {
    console.log(
      `│${tLeft(userRows[i] || "")}│${tRight(sysRows[i] || "")}│`
    );
  }
  console.log(borderBot);

  // LIVE TX ONCHAIN (visual)
  console.log();
  console.log(
    panel({
      width: 78,
      title: "LIVE TX ONCHAIN",
      left: "┌",
      right: "┐",
      bottomLeft: "└",
      bottomRight: "┘",
      midLeft: "├",
      midRight: "┤",
      lines: [
        `  [${new Date().toLocaleTimeString()}] Wallet #01   →   Token Mint`,
        `  TX HASH     : ${"..."}`,
        `  STATUS      : ${"CONFIRMED"}`,
        ``,
        `  [${new Date().toLocaleTimeString()}] Wallet #07   →   Mint NFT`,
        `  TX HASH     : ${"..."}`,
        `  STATUS      : ${"PENDING"}`,
        ``,
        `  [${new Date().toLocaleTimeString()}] Wallet #15   →   Netrun Imprint`,
        `  TX HASH     : ${"..."}`,
        `  STATUS      : ${"SUCCESS"}`
      ]
    })
  );

  // SYSTEM CONTROL menu (visual-only)
  console.log();
  console.log(
    panel({
      width: 78,
      title: "SYSTEM CONTROL",
      left: "┌",
      right: "┐",
      bottomLeft: "└",
      bottomRight: "┘",
      midLeft: "├",
      midRight: "┤",
      lines: [
        "   [1] START BOT        [2] STOP BOT         [3] PAUSE TASK        [4] EXPORT LOGS",
        "   [5] ROTATE PROXY     [6] SETTINGS         [7] RESTART BOT",
        "   [0] EXIT"
      ]
    })
  );

  console.log();
  console.log("                                             Current Account : ? / ?");

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  let isClosed = false;

  try {
    const options = {
      folder: await question(rl, "Wallet folder", config.walletsFolderPath),
      network: await question(rl, "Network", config.network),
      txCount: await question(rl, "Token TX count per wallet", config.netrun.tokenCount),
      nftCount: await question(rl, "NFT count per wallet", config.netrun.nftCount),
      mintAmount: await question(rl, "Mint amount per token", config.netrun.mintAmount),
      decimals: await question(rl, "Token decimals", config.netrun.decimals),
      delay: await question(rl, "Delay per TX/action ms", config.netrun.txDelayMs),
      walletDelay: await question(rl, "Delay when switching wallet ms", config.netrun.walletDelayMs),
      tokenName: await question(rl, "Token name label", config.netrun.tokenName),
      nftName: await question(rl, "NFT base name", config.netrun.nftName),
      symbol: await question(rl, "Symbol", config.netrun.symbol)
    };

    // Dashboard-like plan preview (visual only) — keep logic/output based on options.
    console.log(
      "\n" +
        renderDashboardPanel({
          panelLeftTitle: "WALLET OVERVIEW",
          panelRightTitle: "LIVE TX ONCHAIN",
          leftLines: [
            `Wallet Loaded : ${"?"}`,
            `Active Wallet : ${"?"}`,
            `Total Balance : ${"?"}`,
            `Today TX      : ${options.txCount} TX`,
            `Success Rate  : ${"?"}`,
            `Failed TX     : ${"?"}`
          ],
          rightLines: [
            `[${new Date().toLocaleTimeString()}] Connecting RPC...`,
            `[${new Date().toLocaleTimeString()}] Network : ${options.network}`,
            `[${new Date().toLocaleTimeString()}] Sending Daily Automation`,
            `Token TX      : ${options.txCount}`,
            `NFT TX        : ${options.nftCount}`,
            `Mint Amount   : ${options.mintAmount}`
          ]
        })
    );

    console.log(`\n[ALPHA BOT] > Name/Symbol : ${options.tokenName} / ${options.symbol}`);
    console.log(`\n[ALPHA BOT] > Folder   : ${options.folder}`);
    console.log(
      `\n[ALPHA BOT] > Delays   : ${options.delay}ms TX | ${options.walletDelay}ms wallet switch\n`
    );

    const runNow = await question(rl, "Run now? [y/N]", "n");

    if (!normalizeYes(runNow)) {
      logger.info("Canceled. Nothing executed.");
      return;
    }

    rl.close();
    isClosed = true;
    await netrunDailyCommand(options);
  } finally {
    if (!isClosed) {
      rl.close();
    }
  }
}

module.exports = {
  openMenuCommand
};

