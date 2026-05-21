const cron = require("node-cron");
const Logger = require("../utils/logger");
const config = require("../config/config");
const { loadWallet } = require("../wallet/walletManager");
const { getConnection, getBalance } = require("../utils/rpc");
const { createToken } = require("../token/tokenManager");
const { createNFT } = require("../nft/nftManager");
const { executeNitronProgram } = require("../program/programManager");
const { truncateAddress } = require("../utils/helpers");

const logger = new Logger(config.logLevel);

/**
 * Start daily scheduler
 */
function startDailyScheduler(options) {
  logger.header("DAILY SCHEDULER STARTED");
  
  const walletPath = options.wallet || config.walletPath;
  const operations = (options.operations || "token").split(",");
  const time = options.time || "09:00"; // 9 AM daily
  const network = options.network || config.network;

  logger.info(`Wallet: ${walletPath}`);
  logger.info(`Operations: ${operations.join(", ")}`);
  logger.info(`Schedule: Daily at ${time}`);
  logger.info(`Network: ${network}`);
  logger.divider();

  // Parse time
  const [hours, minutes] = time.split(":").map(Number);

  // Create cron schedule (HH MM * * *)
  const cronExpression = `${minutes} ${hours} * * *`;

  // Start scheduler
  const task = cron.schedule(cronExpression, async () => {
    logger.header(`SCHEDULED EXECUTION - ${new Date().toISOString()}`);

    try {
      // Load wallet
      const wallet = loadWallet(walletPath);
      const connection = getConnection(network);

      // Check balance
      const balance = await getBalance(connection, wallet.publicKey);
      logger.info(`Wallet: ${truncateAddress(wallet.publicKey.toBase58())}`);
      logger.info(`Balance: ${(balance / 1e9).toFixed(4)} SOL`);

      if (balance < 5000000) {
        logger.warn("Insufficient balance. Skipping execution.");
        return;
      }

      // Execute operations
      for (const operation of operations) {
        try {
          if (operation === "token") {
            logger.info("Creating token...");
            const mint = await createToken(connection, wallet, 9, logger);
            logger.success("Token created", mint.toBase58());
          } else if (operation === "nft") {
            logger.info("Creating NFT...");
            const nft = await createNFT(connection, wallet, `Scheduled NFT ${Date.now()}`, "NITRON", "", logger);
            logger.success("NFT created", nft.name);
          } else if (operation === "custom") {
            logger.info("Executing custom program...");
            const signature = await executeNitronProgram(connection, wallet, logger);
            logger.success("Program executed", signature);
          }
        } catch (error) {
          logger.error(`Operation failed: ${error.message}`);
        }
      }

      logger.divider();
    } catch (error) {
      logger.error(`Scheduled execution failed: ${error.message}`);
    }
  });

  logger.success("Scheduler active. Press Ctrl+C to stop.");
  
  return task;
}

module.exports = {
  startDailyScheduler
};
