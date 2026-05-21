const AutonomousBotManager = require("../bot/botManager");
const Logger = require("../utils/logger");
const config = require("../config/config");
const { syncImprintToSite } = require("../netrun/netrunHistoryClient");
const fs = require("fs");
const path = require("path");

function printDailyBanner() {
  console.log(`
                                            ALPHA BOT
                                    NETRUN BOT DAILY
`);
}


/**
 * Initialize Bot Command
 */
async function initBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("INITIALIZATION");

    const botOptions = {
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    };

    const bot = new AutonomousBotManager(botOptions);
    await bot.initialize();

    logger.success("Alpha Bot ready to use!");

    return bot;
  } catch (error) {
    logger.error(`Initialization failed: ${error.message}`);
    throw error;
  }
}

/**
 * Autonomous Bot Command - Run continuously
 */
async function autonomousBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("CONTINUOUS MODE");

    const operations = (options.operations || "token").split(",").map(o => o.trim());
const intervalMinutes = parseInt(options.interval || 60, 10);
    const intervalMs = intervalMinutes * 60 * 1000;
    // Optional: override delay between TXs. default 5000ms per your request.
    if (options.delayMs !== undefined) {
      config.txDelayMs = parseInt(options.delayMs, 10);
    }


    logger.info(`Operations: ${operations.join(", ")}`);
    logger.info(`Interval: ${intervalMinutes} minutes`);
    logger.divider();

    const bot = new AutonomousBotManager({
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    });

    await bot.initialize();
    logger.divider();

    // Start autonomous bot
    await bot.startAutonomous(operations, intervalMs);

    // Keep process running
    process.on("SIGINT", () => {
      logger.header("STOPPING ALPHA BOT");
      bot.stop();
      bot.displayStatus();
      process.exit(0);
    });

    // Display status every 5 minutes
    setInterval(() => {
      bot.displayStatus();
    }, 5 * 60 * 1000);

  } catch (error) {
    logger.error(`Alpha Bot failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Scheduled Bot Command - Run on schedule
 */
async function scheduledBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("SCHEDULED MODE");

    const operations = (options.operations || "token").split(",").map(o => o.trim());
    const schedule = options.schedule || "0 * * * *"; // Every hour by default

    logger.info(`Operations: ${operations.join(", ")}`);
    logger.info(`Schedule: ${schedule}`);
    logger.divider();

    const bot = new AutonomousBotManager({
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    });

    await bot.initialize();
    logger.divider();

    // Schedule bot
    bot.scheduleOperation(operations, schedule);

    // Keep process running
    process.on("SIGINT", () => {
      logger.header("STOPPING ALPHA BOT");
      bot.stop();
      bot.displayStatus();
      process.exit(0);
    });

    // Display status every 5 minutes
    setInterval(() => {
      bot.displayStatus();
    }, 5 * 60 * 1000);

  } catch (error) {
    logger.error(`Alpha Bot failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Single Batch Bot Command - Run once
 */
async function batchBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("BATCH MODE");

    const operations = (options.operations || "token").split(",").map(o => o.trim());

    logger.info(`Operations: ${operations.join(", ")}`);
    logger.divider();

    const bot = new AutonomousBotManager({
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    });

    await bot.initialize();
    logger.divider();

    // Execute batch
    const results = await bot.executeBatchOperation(operations);

    logger.divider();
    bot.displayStatus();

    return results;
  } catch (error) {
    logger.error(`Alpha Bot failed: ${error.message}`);
    throw error;
  }
}

/**
 * Netrun Daily Command - Run once
 */
async function netrunDailyCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("NETRUN DAILY BATCH");
    printDailyBanner();


    const bot = new AutonomousBotManager({
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    });

    await bot.initialize();
    logger.divider();

    const results = await bot.executeNetrunDaily(options);

    logger.divider();
    bot.displayStatus();

    return results;
  } catch (error) {
    logger.error(`Netrun daily failed: ${error.message}`);
    throw error;
  }
}

/**
 * Netrun Cron Command - Run on a daily schedule
 */
async function netrunCronCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("NETRUN DAILY SCHEDULED");

    const schedule = options.schedule || "0 9 * * *";

    logger.info(`Schedule: ${schedule}`);
    logger.info(`Wallet folder: ${options.folder || config.walletsFolderPath}`);
    logger.divider();

    const bot = new AutonomousBotManager({
      folder: options.folder || config.walletsFolderPath,
      network: options.network || config.network,
      logFile: options.logFile || "./bot-logs.json"
    });

    await bot.initialize();
    logger.divider();

    bot.scheduleOperation(["netrun-daily"], schedule, options);

    process.on("SIGINT", () => {
      logger.header("STOPPING ALPHA BOT");
      bot.stop();
      bot.displayStatus();
      process.exit(0);
    });

    setInterval(() => {
      bot.displayStatus();
    }, 5 * 60 * 1000);
  } catch (error) {
    logger.error(`Netrun cron failed: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Bot Status Command
 */
async function statusBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    const logFile = path.resolve(process.cwd(), options.logFile || config.logFilePath);

    // Display status
    if (fs.existsSync(logFile)) {
      const logs = JSON.parse(fs.readFileSync(logFile, "utf-8"));

      logger.header("STATUS & LOGS");
      logger.info(`Total logs: ${logs.length}`);
      logger.divider();

      // Show last 10 logs
      const recent = logs.slice(-10);
      for (const log of recent) {
        const status = log.status === "success" ? "OK" : "ERR";
        const time = new Date(log.timestamp).toLocaleTimeString();
        logger.info(
          `${status} [${time}] ${log.operation.toUpperCase()} - ${log.wallet.slice(0, 8)}...`
        );
      }
    } else {
      logger.warn("No logs found yet");
    }
  } catch (error) {
    logger.error(`Status check failed: ${error.message}`);
    throw error;
  }
}

/**
 * Bot Config Command - Show config
 */
async function configBotCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("CONFIGURATION");

    console.log(`
[ALPHA BOT] > Network        : ${config.network}
[ALPHA BOT] > Wallet Folder  : ${config.walletsFolderPath}
[ALPHA BOT] > TX Delay       : ${config.txDelayMs}ms
[ALPHA BOT] > Retry Attempts : ${config.retryAttempts}
[ALPHA BOT] > Batch Size     : ${config.batchSize}
[ALPHA BOT] > Log Level      : ${config.logLevel}

[ALPHA BOT] > Commands
  nitron bot:auto    - Run continuously
  nitron bot:cron    - Run on schedule
  nitron bot:batch   - Run once

[ALPHA BOT] > Example
  node src/index.js bot:auto --operations token --interval 60
  node src/index.js bot:cron --operations token,nft --schedule "0 * * * *"
  node src/index.js bot:batch --operations token
    `);
  } catch (error) {
    logger.error(`Config failed: ${error.message}`);
    throw error;
  }
}

async function netrunSyncCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("NETRUN SYNC HISTORY (SITE)");
    logger.divider();

    const walletPath = options.wallet;
    const folder = options.folder || config.walletsFolderPath;
    const imprint = options.imprint; // optional manual imprint

    if (!imprint && !walletPath && !folder) {
      throw new Error("Provide --imprint or --wallet or --folder");
    }

    const imprintAddresses = [];

    if (imprint) {
      imprintAddresses.push(imprint);
    }

    // If wallet/folder provided: try to read imprint from logs
    // (We do not change tx logic; only re-sync to site for already created imprints.)
    const logFile = path.resolve(process.cwd(), options.logFile || "./bot-logs.json");
    if (fs.existsSync(logFile)) {
      const logs = JSON.parse(fs.readFileSync(logFile, "utf-8"));
      for (const l of logs) {
        if (l?.operation === "netrun-imprint" && l?.imprint) {
          // optionally filter by wallet
          if (walletPath) {
            // wallet JSON contains secret key; we can't map easily here without parsing keypair.
            // So we only filter by public key if it was logged in wallet field.
            const needle = l.wallet;
            const walletObj = (() => {
              try {
                const w = require("../wallet/walletManager");
                void w;
              } catch (e) {}
              return null;
            })();
            void walletObj;
          }
          imprintAddresses.push(l.imprint);
        }
      }
    }

    const unique = Array.from(new Set(imprintAddresses));
    if (unique.length === 0) {
      logger.warn("No imprints found to sync (check bot-logs.json or pass --imprint <addr>)");
      return { synced: 0, checked: 0 };
    }

    const timeoutMs = parseInt(options.timeoutMs || "120000", 10);
    const intervalMs = parseInt(options.intervalMs || "10000", 10);

    logger.info(`Imprints to sync: ${unique.length}`);
    logger.info(`Timeout: ${timeoutMs}ms, interval: ${intervalMs}ms`);
    logger.divider();

    let checked = 0;
    let synced = 0;
    const results = [];

    for (const addr of unique) {
      checked++;
      logger.info(`Sync imprint ${checked}/${unique.length}: ${addr}`);
      const r = await syncImprintToSite(addr, {
        timeoutMs,
        intervalMs,
        logger
      });
      results.push({ imprint: addr, ...r });
      if (r.found) synced++;
      logger.divider();
    }

    logger.success(`Sync finished. Found on site: ${synced}/${checked}`);

    return { synced, checked, results };
  } catch (error) {
    logger.error(`Netrun sync failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  initBotCommand,
  autonomousBotCommand,
  scheduledBotCommand,
  batchBotCommand,
  netrunDailyCommand,
  netrunCronCommand,
  statusBotCommand,
  configBotCommand,
  netrunSyncCommand
};
