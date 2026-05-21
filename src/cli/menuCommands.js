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

async function openMenuCommand() {
  const logger = new Logger(config.logLevel);

  if (!process.stdin.isTTY) {
    logger.header("NETRUN MANUAL");
    logger.info("Run `node src/index.js help` to see commands.");
    return;
  }

  logger.header("NETRUN MANUAL CONTROL");
  console.log(`[ALPHA BOT] > CLI name : Alpha Bot`);
  console.log(`[ALPHA BOT] > Project  : Netrun`);
  console.log(`[ALPHA BOT] > Mode     : manual tx setup\n`);

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

    console.log(`
============================================================
                  ALPHA BOT :: NETRUN PLAN
============================================================
[ALPHA BOT] > Wallet folder : ${options.folder}
[ALPHA BOT] > Network       : ${options.network}
[ALPHA BOT] > Token TX      : ${options.txCount} per wallet
[ALPHA BOT] > NFT TX        : ${options.nftCount} per wallet
[ALPHA BOT] > Mint amount   : ${options.mintAmount}
[ALPHA BOT] > TX delay      : ${options.delay}ms
[ALPHA BOT] > Wallet delay  : ${options.walletDelay}ms
[ALPHA BOT] > Name/Symbol   : ${options.tokenName} / ${options.symbol}
`);

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
