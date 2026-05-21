const { loadWallet, loadMultipleWallets } = require("../wallet/walletManager");
const { executeNitronProgram, executeCustomProgram } = require("../program/programManager");
const { getConnection, getBalance } = require("../utils/rpc");
const { truncateAddress, batchExecute } = require("../utils/helpers");
const Logger = require("../utils/logger");
const config = require("../config/config");

/**
 * Run Custom Program Command
 */
async function runCustomCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("RUN CUSTOM PROGRAM");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const programId = options.program || config.customProgram.programId;
    const count = parseInt(options.count || 1, 10);
    const network = options.network || config.network;

    logger.info(`Program ID: ${programId}`);
    logger.info(`Executions: ${count}`);

    // Load wallet
    logger.info(`Loading wallet from: ${walletPath}`);
    const wallet = loadWallet(walletPath);
    logger.success("Wallet loaded", truncateAddress(wallet.publicKey.toBase58()));

    // Get connection
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Check balance
    const balance = await getBalance(connection, wallet.publicKey);
    logger.info(`Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);

    if (balance < 5000000) {
      logger.warn("Low balance detected. May fail on mainnet.");
    }

    // Execute program
    logger.divider();
    logger.info("Executing custom program...");
    const signature = await executeNitronProgram(connection, wallet, logger);

    logger.divider();
    logger.success("Program executed successfully!");
    logger.info(`Signature: ${signature}`);

    return signature;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Batch Command - Execute multiple operations
 */
async function batchCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("BATCH EXECUTION");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const operations = (options.operations || "token").split(",");
    const count = parseInt(options.count || 1, 10);
    const batchSize = parseInt(options.batch || config.batchSize, 10);
    const network = options.network || config.network;

    logger.info(`Operations: ${operations.join(", ")}`);
    logger.info(`Count: ${count}`);
    logger.info(`Batch size: ${batchSize}`);

    // Load wallet
    logger.info(`Loading wallet from: ${walletPath}`);
    const wallet = loadWallet(walletPath);
    logger.success("Wallet loaded", truncateAddress(wallet.publicKey.toBase58()));

    // Get connection
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Check balance
    const balance = await getBalance(connection, wallet.publicKey);
    logger.info(`Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);

    // Create tasks based on operations
    logger.divider();
    const tasks = [];

    for (let i = 0; i < count; i++) {
      for (const operation of operations) {
        tasks.push(async () => {
          if (operation === "token") {
            const { createToken } = require("../token/tokenManager");
            return await createToken(connection, wallet, 9, logger);
          } else if (operation === "nft") {
            const { createNFT } = require("../nft/nftManager");
            return await createNFT(connection, wallet, `Nitron NFT ${i + 1}`, "NITRON", "", logger);
          } else if (operation === "custom") {
            return await executeNitronProgram(connection, wallet, logger);
          }
        });
      }
    }

    logger.info(`Executing ${tasks.length} tasks in batches of ${batchSize}...`);

    // Execute in batches
    const results = await batchExecute(
      tasks,
      batchSize,
      config.batchDelayMs,
      (completed, total) => {
        logger.info(`Progress: ${completed}/${total}`);
      }
    );

    logger.divider();
    logger.success(`Batch execution completed!`);
    logger.info(`Total operations: ${results.length}`);

    return results;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Multi-wallet loop execution
 */
async function multiWalletCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("MULTI-WALLET EXECUTION");
    logger.divider();

    // Get options
    const walletsFolderPath = options.folder || config.walletsFolderPath;
    const operation = options.operation || "token";
    const count = parseInt(options.count || 1, 10);
    const network = options.network || config.network;

    logger.info(`Wallets folder: ${walletsFolderPath}`);
    logger.info(`Operation: ${operation}`);
    logger.info(`Count per wallet: ${count}`);

    // Load multiple wallets
    logger.info("Loading wallets...");
    const wallets = loadMultipleWallets(walletsFolderPath);
    logger.success(`Loaded ${wallets.length} wallets`);

    wallets.forEach((w, index) => {
      logger.info(`Wallet ${index + 1}: ${truncateAddress(w.publicKey)}`);
    });

    // Get connection
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Execute for each wallet
    logger.divider();
    const results = [];

    for (const walletInfo of wallets) {
      logger.header(`Processing: ${truncateAddress(walletInfo.publicKey)}`);

      const balance = await getBalance(connection, walletInfo.keypair.publicKey);
      logger.info(`Balance: ${(balance / 1e9).toFixed(4)} SOL`);

      if (balance < 5000000) {
        logger.warn("Insufficient balance");
        continue;
      }

      try {
        if (operation === "token") {
          const { createToken } = require("../token/tokenManager");
          for (let i = 0; i < count; i++) {
            const mint = await createToken(connection, walletInfo.keypair, 9, logger);
            results.push({
              wallet: walletInfo.publicKey,
              operation: "token",
              result: mint.toBase58()
            });
          }
        } else if (operation === "custom") {
          for (let i = 0; i < count; i++) {
            const signature = await executeNitronProgram(connection, walletInfo.keypair, logger);
            results.push({
              wallet: walletInfo.publicKey,
              operation: "custom",
              result: signature
            });
          }
        }
      } catch (error) {
        logger.error(`Failed for wallet: ${error.message}`);
      }
    }

    logger.divider();
    logger.success("Multi-wallet execution completed!");
    logger.info(`Total results: ${results.length}`);

    return results;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  runCustomCommand,
  batchCommand,
  multiWalletCommand
};
