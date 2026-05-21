const cron = require("node-cron");
const { loadMultipleWallets } = require("../wallet/walletManager");
const { getConnection, getBalance } = require("../utils/rpc");
const {
  createToken,
  batchCreateTokens,
  createAssociatedTokenAccount,
  mintTokens
} = require("../token/tokenManager");
const { createNFT, batchCreateNFTs } = require("../nft/nftManager");
const { createNetrunImprint } = require("../netrun/netrunManager");
const { executeNitronProgram } = require("../program/programManager");
const Logger = require("../utils/logger");
const { sleep, truncateAddress, randomName } = require("../utils/helpers");
const config = require("../config/config");
const fs = require("fs");
const path = require("path");

/**
 * Autonomous Bot Manager untuk multi-account operations
 */
class AutonomousBotManager {
  constructor(options = {}) {
    this.logger = new Logger(config.logLevel);
    this.walletsFolderPath = options.folder || config.walletsFolderPath;
    this.wallets = [];
    this.network = options.network || config.network;
    this.connection = getConnection(this.network);
    this.isRunning = false;
    this.tasks = [];
    this.stats = {
      totalOperations: 0,
      successfulOperations: 0,
      failedOperations: 0,
      startTime: null,
      lastActivityTime: null
    };
    this.logFile = path.resolve(options.logFile || config.logFilePath);
  }

  /**
   * Initialize bot dengan load semua wallets
   */
  async initialize() {
    try {
      this.logger.header("INITIALIZATION");

      // Load wallets
      this.logger.info(`Loading wallets from: ${this.walletsFolderPath}`);
      this.wallets = loadMultipleWallets(this.walletsFolderPath);
      this.logger.success(`Loaded ${this.wallets.length} wallets`);

      // Verify balances
      this.logger.divider();
      this.logger.info("Checking wallet balances...");

      for (const wallet of this.wallets) {
        try {
          const balance = await getBalance(this.connection, wallet.keypair.publicKey);
          const solBalance = (balance / 1e9).toFixed(4);
          const status = balance > 5000000 ? "OK" : "LOW";
          this.logger.info(
            `${status} ${truncateAddress(wallet.publicKey)}: ${solBalance} SOL`
          );
        } catch (error) {
          this.logger.error(`Failed to check balance: ${error.message}`);
        }
      }

      this.logger.divider();
      this.logger.success("Bot initialized successfully!");
      this.stats.startTime = new Date();

      return this;
    } catch (error) {
      this.logger.error(`Initialization failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Execute operation pada satu wallet
   */
  async executeWalletOperation(wallet, operation, params = {}) {
    const operationId = `${wallet.publicKey.slice(0, 8)}-${Date.now()}`;

    try {
      this.logger.info(`[${operationId}] Executing ${operation}...`);

      let result;

      switch (operation) {
        case "token":
          result = await createToken(
            this.connection,
            wallet.keypair,
            parseInt(params.decimals || 9),
            this.logger
          );
          this.logger.success(`[${operationId}] Token created`, result.toBase58());
          break;

        case "nft":
          result = await createNFT(
            this.connection,
            wallet.keypair,
            params.name || `NFT-${Date.now()}`,
            params.symbol || "BOT",
            "",
            this.logger
          );
          this.logger.success(`[${operationId}] NFT created`, result.name);
          break;

        case "program":
          result = await executeNitronProgram(this.connection, wallet.keypair, this.logger);
          this.logger.success(`[${operationId}] Program executed`, result);
          break;

        default:
          throw new Error(`Unknown operation: ${operation}`);
      }

      this.stats.successfulOperations++;
      this.logOperation({
        id: operationId,
        wallet: wallet.publicKey,
        operation,
        status: "success",
        result: result?.toBase58?.() || result,
        timestamp: new Date()
      });

      return result;
    } catch (error) {
      this.stats.failedOperations++;
      this.logger.error(`[${operationId}] Failed: ${error.message}`);

      this.logOperation({
        id: operationId,
        wallet: wallet.publicKey,
        operation,
        status: "failed",
        error: error.message,
        timestamp: new Date()
      });

      throw error;
    }
  }

  /**
   * Batch execute operation pada semua wallets
   */
  async executeBatchOperation(operations, options = {}) {
    this.logger.header("BATCH EXECUTION");
    this.logger.info(`Operations: ${operations.join(", ")}`);
    this.logger.info(`Wallets: ${this.wallets.length}`);
    this.logger.divider();

    const results = {
      successful: [],
      failed: []
    };

    for (const wallet of this.wallets) {
      this.logger.header(`Wallet: ${truncateAddress(wallet.publicKey)}`);

      // Check balance
      try {
        const balance = await getBalance(this.connection, wallet.keypair.publicKey);
        if (balance < 5000000) {
          this.logger.warn(`Low balance: ${(balance / 1e9).toFixed(4)} SOL`);
          continue;
        }
      } catch (error) {
        this.logger.error(`Balance check failed: ${error.message}`);
        continue;
      }

      // Execute each operation
      for (const operation of operations) {
        try {
          const result = await this.executeWalletOperation(wallet, operation, options);
          results.successful.push({
            wallet: wallet.publicKey,
            operation,
            result
          });

          this.stats.totalOperations++;

          // Delay between operations
          if (operation !== operations[operations.length - 1]) {
            await sleep(config.txDelayMs);
          }
        } catch (error) {
          results.failed.push({
            wallet: wallet.publicKey,
            operation,
            error: error.message
          });
        }
      }

      this.logger.divider();
    }

    this.logger.header("BATCH SUMMARY");
    this.logger.success(`Successful: ${results.successful.length}`);
    this.logger.warn(`Failed: ${results.failed.length}`);
    this.logger.divider();

    this.stats.lastActivityTime = new Date();

    return results;
  }

  /**
   * Execute Netrun-style daily routine:
   * create tokens, mint each token to the same wallet, then create NFTs.
   */
  async executeNetrunDaily(options = {}) {
    const tokenCount = parseInt(options.txCount || options.tokenCount || config.netrun.tokenCount, 10);
    const nftCount = parseInt(options.nftCount || config.netrun.nftCount, 10);
    const decimals = parseInt(options.decimals || config.netrun.decimals, 10);
    const mintAmount = parseFloat(options.mintAmount || config.netrun.mintAmount);
    const delayMs = parseInt(options.delay || config.netrun.txDelayMs, 10);
    const walletDelayMs = parseInt(options.walletDelay || config.netrun.walletDelayMs, 10);
    const tokenName = options.tokenName || config.netrun.tokenName;
    const nftName = options.nftName || config.netrun.nftName;
    const symbol = options.symbol || config.netrun.symbol;
    const imageCid = options.imageCid || options.imageUri || config.netrun.imageCid;
    const description = options.description || config.netrun.description;

    this.logger.header("NETRUN DAILY ROUTINE");
    this.logger.info(`Wallets: ${this.wallets.length}`);
    this.logger.info(`Per wallet: ${tokenCount} tokens + mint, ${nftCount} NFTs`);
    this.logger.info(`TX delay: ${delayMs}ms`);
    this.logger.info(`Wallet switch delay: ${walletDelayMs}ms`);
    this.logger.divider();

    const results = {
      successful: [],
      failed: []
    };

    for (let walletIndex = 0; walletIndex < this.wallets.length; walletIndex++) {
      const wallet = this.wallets[walletIndex];
      this.logger.header(`Wallet: ${truncateAddress(wallet.publicKey)}`);

      try {
        const balance = await getBalance(this.connection, wallet.keypair.publicKey);
        this.logger.info(`Balance: ${(balance / 1e9).toFixed(4)} SOL`);

        if (balance < 5000000) {
          this.logger.warn("Low balance, skipping wallet");
          continue;
        }
      } catch (error) {
        this.logger.error(`Balance check failed: ${error.message}`);
        results.failed.push({
          wallet: wallet.publicKey,
          operation: "balance-check",
          error: error.message
        });
        continue;
      }

      for (let i = 0; i < tokenCount; i++) {
        const operationId = `${wallet.publicKey.slice(0, 8)}-token-${i + 1}-${Date.now()}`;
        const tokenLabel = `${tokenName}-${i + 1}-${randomName(4)}`;

        try {
          this.logger.info(`[${operationId}] Creating token ${i + 1}/${tokenCount}: ${tokenLabel}`);
          const mint = await createToken(this.connection, wallet.keypair, decimals, this.logger);

          this.logger.info(`[${operationId}] Creating token account`);
          const tokenAccount = await createAssociatedTokenAccount(
            this.connection,
            wallet.keypair,
            mint,
            wallet.keypair.publicKey,
            this.logger
          );

          this.logger.info(`[${operationId}] Minting ${mintAmount} ${symbol}`);
          const signature = await mintTokens(
            this.connection,
            wallet.keypair,
            mint,
            tokenAccount.address,
            mintAmount,
            decimals,
            this.logger
          );

          const result = {
            wallet: wallet.publicKey,
            operation: "token-mint",
            name: tokenLabel,
            symbol,
            mint: mint.toBase58(),
            tokenAccount: tokenAccount.address.toBase58(),
            signature
          };

          results.successful.push(result);
          this.stats.successfulOperations++;
          this.stats.totalOperations++;
          this.logOperation({
            id: operationId,
            status: "success",
            timestamp: new Date(),
            ...result
          });
        } catch (error) {
          this.stats.failedOperations++;
          results.failed.push({
            wallet: wallet.publicKey,
            operation: "token-mint",
            index: i + 1,
            error: error.message
          });
          this.logger.error(`[${operationId}] Failed: ${error.message}`);
        }

        await sleep(delayMs);
      }

      for (let i = 0; i < nftCount; i++) {
        const operationId = `${wallet.publicKey.slice(0, 8)}-nft-${i + 1}-${Date.now()}`;

        try {
          const name = `${nftName} #${i + 1}-${randomName(4)}`;
          this.logger.info(`[${operationId}] Creating Netrun imprint ${i + 1}/${nftCount}: ${name}`);

          const nft = await createNetrunImprint(
            this.connection,
            wallet.keypair,
            {
              name,
              symbol,
              imageCid,
              description,
              metadataUri: options.metadataUri || options.nftUri
            },
            this.logger
          );

          const result = {
            wallet: wallet.publicKey,
            operation: "netrun-imprint",
            name: nft.name,
            symbol: nft.symbol,
            uri: nft.uri,
            imageCid: nft.imageCid,
            asset: nft.asset,
            imprint: nft.imprint,
            signature: nft.signature,
            explorer: nft.explorer
          };

          results.successful.push(result);
          this.stats.successfulOperations++;
          this.stats.totalOperations++;
          this.logOperation({
            id: operationId,
            status: "success",
            timestamp: new Date(),
            ...result
          });
        } catch (error) {
          this.stats.failedOperations++;
          results.failed.push({
            wallet: wallet.publicKey,
            operation: "netrun-imprint",
            index: i + 1,
            error: error.message
          });
          this.logger.error(`[${operationId}] Failed: ${error.message}`);
        }

        if (i < nftCount - 1) {
          await sleep(delayMs);
        }
      }

      this.logger.divider();

      if (walletIndex < this.wallets.length - 1) {
        this.logger.info(`Switching wallet in ${walletDelayMs}ms...`);
        await sleep(walletDelayMs);
      }
    }

    this.stats.lastActivityTime = new Date();
    this.logger.header("NETRUN DAILY SUMMARY");
    this.logger.success(`Successful: ${results.successful.length}`);
    this.logger.warn(`Failed: ${results.failed.length}`);

    return results;
  }

  /**
   * Schedule autonomous operation
   */
  scheduleOperation(operations, schedule = "0 * * * *", options = {}) {
    this.logger.header("SCHEDULING");
    this.logger.info(`Schedule: ${schedule}`);
    this.logger.info(`Operations: ${operations.join(", ")}`);

    try {
      const task = cron.schedule(schedule, async () => {
        this.logger.header(`AUTO-EXECUTION - ${new Date().toISOString()}`);
        
        try {
          if (operations.includes("netrun-daily")) {
            await this.executeNetrunDaily(options);
          } else {
            await this.executeBatchOperation(operations, options);
          }
        } catch (error) {
          this.logger.error(`Scheduled execution failed: ${error.message}`);
        }
      });

      this.tasks.push(task);
      this.logger.success("Bot scheduled and active!");

      return task;
    } catch (error) {
      this.logger.error(`Scheduling failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start continuous autonomous bot
   */
  async startAutonomous(operations, intervalMs = 3600000) {
    this.logger.header("STARTING");
    this.logger.info(`Interval: ${intervalMs}ms (${(intervalMs / 1000 / 60).toFixed(0)} minutes)`);
    this.logger.info(`Operations: ${operations.join(", ")}`);

    this.isRunning = true;

    // First execution immediately
    try {
      await this.executeBatchOperation(operations);
    } catch (error) {
      this.logger.error(`First execution failed: ${error.message}`);
    }

    // Then schedule repeating
    const task = setInterval(async () => {
      if (!this.isRunning) return;

      try {
        await this.executeBatchOperation(operations);
      } catch (error) {
        this.logger.error(`Auto-execution failed: ${error.message}`);
      }
    }, intervalMs);

    this.tasks.push(task);

    this.logger.success("Alpha Bot started!");
    this.logger.info("Press Ctrl+C to stop");

    return task;
  }

  /**
   * Stop bot
   */
  stop() {
    this.logger.header("STOPPING");
    this.isRunning = false;

    for (const task of this.tasks) {
      if (typeof task?.stop === "function") {
        task.stop(); // For node-cron tasks
      } else if (typeof task === "function") {
        task(); // For callback cleanups
      } else {
        clearInterval(task); // For intervals
      }
    }

    this.tasks = [];
    this.logger.success("Alpha Bot stopped");
  }

  /**
   * Get bot statistics
   */
  getStats() {
    const uptime = this.stats.startTime
      ? Math.floor((Date.now() - this.stats.startTime) / 1000)
      : 0;

    return {
      ...this.stats,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
      successRate:
        this.stats.totalOperations > 0
          ? ((this.stats.successfulOperations / this.stats.totalOperations) * 100).toFixed(2) +
            "%"
          : "N/A"
    };
  }

  /**
   * Log operation untuk audit trail
   */
  logOperation(operationData) {
    try {
      const logDir = path.dirname(this.logFile);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }

      let logs = [];
      if (fs.existsSync(this.logFile)) {
        const content = fs.readFileSync(this.logFile, "utf-8");
        try {
          logs = JSON.parse(content);
        } catch (parseError) {
          this.logger.warn(
            `Corrupt log file detected at ${this.logFile}, resetting history: ${parseError.message}`
          );
          logs = [];
        }
      }

      logs.push(operationData);

      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs = logs.slice(-1000);
      }

      fs.writeFileSync(this.logFile, JSON.stringify(logs, null, 2));
    } catch (error) {
      this.logger.warn(`Failed to log operation: ${error.message}`);
    }
  }

  /**
   * Display bot status
   */
  displayStatus() {
    const stats = this.getStats();

    console.log(`
============================================================
                         ALPHA BOT
                      PROJECT: NETRUN
                          STATUS
============================================================

[stats]
  total_operations : ${stats.totalOperations}
  successful       : ${stats.successfulOperations}
  failed           : ${stats.failedOperations}
  success_rate     : ${stats.successRate}

[timing]
  uptime           : ${stats.uptime}
  last_activity    : ${stats.lastActivityTime ? stats.lastActivityTime.toISOString() : "N/A"}

[wallets]
  active           : ${this.wallets.length}
  network          : ${this.network}

[tasks]
  running          : ${this.isRunning ? "yes" : "no"}
  scheduled        : ${this.tasks.length}
    `);
  }
}

module.exports = AutonomousBotManager;
