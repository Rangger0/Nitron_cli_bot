#!/usr/bin/env node

const { program } = require("commander");
const { version } = require("../../package.json");
const config = require("./config/config");

// Import commands
const { createTokenCommand, batchCreateTokenCommand, mintCommand } = require("./cli/tokenCommands");
const { createNFTCommand, batchCreateNFTCommand } = require("./cli/nftCommands");
const { runCustomCommand, batchCommand, multiWalletCommand } = require("./cli/programCommands");
const { startDailyScheduler } = require("./cli/scheduler");
const { setupConfigCommand, setConfigCommand, showConfigCommand } = require("./cli/configCommands");
const { openMenuCommand } = require("./cli/menuCommands");
const {
  initBotCommand,
  autonomousBotCommand,
  scheduledBotCommand,
  batchBotCommand,
  netrunDailyCommand,
  netrunCronCommand,
  statusBotCommand,
  netrunSyncCommand
} = require("./cli/botCommands");


// Global options
program
  .version(version)
  .name("alpha-bot")
  .description("Alpha Bot - terminal CLI for the Netrun project")
  .option("--log-level <level>", "Logging level (debug, info, warn, error)", "info");

// Manual CLI Menu
program
  .command("menu")
  .description("Open Alpha Bot Netrun manual menu")
  .action(async () => {
    try {
      await openMenuCommand();
      process.exit(0);
    } catch (error) {
      console.error(`[ALPHA BOT] [ERR] ${error.message}`);
      process.exit(1);
    }
  });

// CLI Setup Wizard
program
  .command("setup")
  .description("Interactive Alpha Bot CLI setup")
  .option("--config-file <path>", "Path to config file", ".env")
  .action(async (options) => {
    try {
      await setupConfigCommand(options);
      process.exit(0);
    } catch (error) {
      console.error(`[ALPHA BOT] [ERR] ${error.message}`);
      process.exit(1);
    }
  });

// Show CLI Config
program
  .command("config")
  .description("Show Alpha Bot CLI settings")
  .option("--config-file <path>", "Path to config file", ".env")
  .action(async (options) => {
    try {
      await showConfigCommand(options);
      process.exit(0);
    } catch (error) {
      console.error(`[ALPHA BOT] [ERR] ${error.message}`);
      process.exit(1);
    }
  });

// Update CLI Config
program
  .command("config:set")
  .description("Update Alpha Bot CLI settings in .env")
  .option("--config-file <path>", "Path to config file", ".env")
  .option("--network <network>", "Solana network: devnet, testnet, mainnet-beta")
  .option("--rpc <url>", "Custom RPC endpoint")
  .option("--wallet <path>", "Single wallet JSON path")
  .option("--wallets <path>", "Multi-wallet folder path")
  .option("--tx-delay <ms>", "Default transaction delay in milliseconds")
  .option("--retry-attempts <number>", "Retry attempts")
  .option("--retry-delay <ms>", "Retry delay in milliseconds")
  .option("--batch-size <number>", "Batch size")
  .option("--batch-delay <ms>", "Batch delay in milliseconds")
  .option("--tx-count <number>", "Netrun token TX count per wallet")
  .option("--token-count <number>", "Netrun token TX count per wallet")
  .option("--nft-count <number>", "Netrun NFT count per wallet")
  .option("--mint-amount <number>", "Netrun mint amount")
  .option("--decimals <number>", "Netrun token decimals")
  .option("--netrun-delay <ms>", "Netrun TX/action delay in milliseconds")
  .option("--wallet-delay <ms>", "Delay when switching wallet in milliseconds")
  .option("--token-name <name>", "Netrun token name label")
  .option("--nft-name <name>", "Netrun NFT base name")
  .option("--symbol <symbol>", "Netrun symbol")
  .option("--image-cid <cid>", "Netrun NFT image IPFS CID")
  .option("--description <text>", "Netrun NFT description")
  .option("--nft-images <path>", "NFT images folder")
  .option("--ipfs-placeholder <true|false>", "Use placeholder IPFS mode")
  .option("--level <level>", "Saved log level: debug, info, warn, error")
  .action(async (options) => {
    try {
      await setConfigCommand(options);
      process.exit(0);
    } catch (error) {
      console.error(`[ALPHA BOT] [ERR] ${error.message}`);
      process.exit(1);
    }
  });

// Create Token Command
program
  .command("create-token")
  .description("Create a single SPL token")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--decimals <number>", "Token decimals", "9")
  .option("--network <network>", "Solana network (devnet, testnet, mainnet-beta)", config.network)
  .action(async (options) => {
    try {
      await createTokenCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Batch Create Tokens Command
program
  .command("batch-tokens")
  .description("Create multiple SPL tokens")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--count <number>", "Number of tokens to create", "2")
  .option("--decimals <number>", "Token decimals", "9")
  .option("--delay <ms>", "Delay between transactions in milliseconds", String(config.txDelayMs))
  .option("--network <network>", "Solana network (devnet, testnet, mainnet-beta)", config.network)
  .action(async (options) => {
    try {
      await batchCreateTokenCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Mint Command
program
  .command("mint")
  .description("Mint tokens to a wallet")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--mint <address>", "Mint address (required)")
  .option("--amount <number>", "Amount to mint", "1000")
  .option("--decimals <number>", "Token decimals", "9")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await mintCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Create NFT Command
program
  .command("create-nft")
  .description("Create a single NFT")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--name <name>", "NFT name")
  .option("--symbol <symbol>", "NFT symbol", "NITRON")
  .option("--uri <uri>", "Metadata URI")
  .option("--images", "Use random image from images folder")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await createNFTCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Batch Create NFTs Command
program
  .command("batch-nfts")
  .description("Create multiple NFTs")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--count <number>", "Number of NFTs to create", "2")
  .option("--images", "Include random images")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await batchCreateNFTCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Run Custom Program Command
program
  .command("run-custom")
  .description("Execute custom program instruction")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--program <id>", "Program ID")
  .option("--count <number>", "Number of executions", "1")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await runCustomCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Batch Command - Execute multiple operations
program
  .command("batch")
  .description("Batch execute multiple operations")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--operations <ops>", "Operations to execute (token,nft,custom)", "token")
  .option("--count <number>", "Count per operation", "1")
  .option("--batch <size>", "Batch size for parallel execution", String(config.batchSize))
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await batchCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Multi-wallet Command
program
  .command("multi-wallet")
  .description("Execute operations across multiple wallets")
  .option("--folder <path>", "Path to wallets folder")
  .option("--operation <op>", "Operation to execute (token, custom)", "token")
  .option("--count <number>", "Count per wallet", "1")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await multiWalletCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Daily Scheduler Command
program
  .command("scheduler")
  .description("Start daily scheduler for automatic execution")
  .option("--wallet <path>", "Path to wallet JSON file")
  .option("--operations <ops>", "Operations to execute (token,nft,custom)", "token")
  .option("--time <time>", "Daily execution time (HH:MM)", "09:00")
  .option("--network <network>", "Solana network", config.network)
  .action((options) => {
    startDailyScheduler(options);
    // Keep process running
    process.on("SIGINT", () => {
      console.log("\n[ALPHA BOT] [STOP] Scheduler stopped");
      process.exit(0);
    });
  });

// Autonomous Bot Commands

// Init Bot
program
  .command("bot:init")
  .description("Initialize Alpha Bot multi-wallet mode")
  .option("--folder <path>", "Wallets folder path")
  .option("--network <network>", "Solana network", config.network)
  .option("--log-file <path>", "Log file path")
  .action(async (options) => {
    try {
      await initBotCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Autonomous Bot (Continuous)
program
  .command("bot:auto")
  .description("Start Alpha Bot continuous mode")
  .option("--operations <ops>", "Operations: token,nft,program", "token")
  .option("--interval <minutes>", "Interval in minutes", "60")
  .option("--folder <path>", "Wallets folder path")
  .option("--network <network>", "Solana network", config.network)
  .action((options) => {
    autonomousBotCommand(options);
  });

// Scheduled Bot (Cron)
program
  .command("bot:cron")
  .description("Start Alpha Bot with cron schedule")
  .option("--operations <ops>", "Operations: token,nft,program", "token")
  .option("--schedule <cron>", "Cron expression (default: every hour)", "0 * * * *")
  .option("--folder <path>", "Wallets folder path")
  .option("--network <network>", "Solana network", config.network)
  .action((options) => {
    scheduledBotCommand(options);
  });

// Batch Bot (Single execution)
program
  .command("bot:batch")
  .description("Execute Alpha Bot operations once")
  .option("--operations <ops>", "Operations: token,nft,program", "token")
  .option("--folder <path>", "Wallets folder path")
  .option("--network <network>", "Solana network", config.network)
  .action(async (options) => {
    try {
      await batchBotCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Netrun Daily Routine (Single Execution)
program
  .command("netrun:daily")
  .description("Run Netrun daily routine across multiple wallets")
  .option("--folder <path>", "Wallets folder path")
  .option("--tx-count <number>", "Alias for token TX count per wallet", String(config.netrun.tokenCount))
  .option("--token-count <number>", "Tokens to create per wallet", String(config.netrun.tokenCount))
  .option("--nft-count <number>", "NFTs to create per wallet", String(config.netrun.nftCount))
  .option("--token-name <name>", "Token label/name used in logs", config.netrun.tokenName)
  .option("--nft-name <name>", "NFT base name", config.netrun.nftName)
  .option("--symbol <symbol>", "Token/NFT symbol", config.netrun.symbol)
  .option("--image-cid <cid>", "Netrun NFT image IPFS CID", config.netrun.imageCid)
  .option("--metadata-uri <uri>", "Override metadata URI for Mpl Core asset")
  .option("--description <text>", "Netrun NFT description", config.netrun.description)
  .option("--mint-amount <number>", "Amount to mint after each token create", String(config.netrun.mintAmount))
  .option("--decimals <number>", "Token decimals", String(config.netrun.decimals))
  .option("--delay <ms>", "Delay between actions in milliseconds", String(config.netrun.txDelayMs))
  .option("--wallet-delay <ms>", "Delay when switching wallet", String(config.netrun.walletDelayMs))
  .option("--network <network>", "Solana network", config.network)
  .option("--log-file <path>", "Log file path")
  .action(async (options) => {
    try {
      await netrunDailyCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Netrun Daily Routine (Cron)
program
  .command("netrun:cron")
  .description("Schedule Netrun daily routine")
  .option("--folder <path>", "Wallets folder path")
  .option("--schedule <cron>", "Cron expression (default: every day 09:00)", "0 9 * * *")
  .option("--tx-count <number>", "Alias for token TX count per wallet", String(config.netrun.tokenCount))
  .option("--token-count <number>", "Tokens to create per wallet", String(config.netrun.tokenCount))
  .option("--nft-count <number>", "NFTs to create per wallet", String(config.netrun.nftCount))
  .option("--token-name <name>", "Token label/name used in logs", config.netrun.tokenName)
  .option("--nft-name <name>", "NFT base name", config.netrun.nftName)
  .option("--symbol <symbol>", "Token/NFT symbol", config.netrun.symbol)
  .option("--image-cid <cid>", "Netrun NFT image IPFS CID", config.netrun.imageCid)
  .option("--metadata-uri <uri>", "Override metadata URI for Mpl Core asset")
  .option("--description <text>", "Netrun NFT description", config.netrun.description)
  .option("--mint-amount <number>", "Amount to mint after each token create", String(config.netrun.mintAmount))
  .option("--decimals <number>", "Token decimals", String(config.netrun.decimals))
  .option("--delay <ms>", "Delay between actions in milliseconds", String(config.netrun.txDelayMs))
  .option("--wallet-delay <ms>", "Delay when switching wallet", String(config.netrun.walletDelayMs))
  .option("--network <network>", "Solana network", config.network)
  .option("--log-file <path>", "Log file path")
  .action((options) => {
    netrunCronCommand(options);
  });

// Bot Status
program
  .command("bot:status")
  .description("Show bot status and logs")
  .option("--log-file <path>", "Log file path")
  .action(async (options) => {
    try {
      await statusBotCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Netrun Sync (Website)
program
  .command("netrun:sync")
  .description("Sync local created Netrun imprints to website history")
  .option("--imprint <address>", "Single imprint address to sync")
  .option("--wallet <path>", "(Optional) wallet JSON path (only used if you add filtering later)")
  .option("--folder <path>", "(Optional) wallets folder path (only used if you add filtering later)")
  .option("--timeout-ms <ms>", "Polling timeout per imprint", "120000")
  .option("--interval-ms <ms>", "Polling interval per imprint", "10000")
  .option("--log-file <path>", "bot-logs.json path", "./bot-logs.json")
  .action(async (options) => {
    try {
      await netrunSyncCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Bot Config
program
  .command("bot:config")
  .description("Show Alpha Bot CLI settings")
  .option("--config-file <path>", "Path to config file", ".env")
  .action(async (options) => {
    try {
      await showConfigCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });

// Help
program
  .command("help")
  .description("Show detailed help")
  .action(() => {
    console.log(`
============================================================
 ALPHA BOT :: TERMINAL CONTROL
============================================================

USAGE:
  nitron [command] [options]

COMMANDS:

  [token]
    create-token         Create a single SPL token
    batch-tokens         Create multiple tokens
    mint                 Mint tokens to wallet

  [nft]
    create-nft          Create a single NFT
    batch-nfts          Create multiple NFTs

  [program]
    run-custom          Execute custom program instruction
    batch               Batch execute multiple operations
    multi-wallet        Execute across multiple wallets

  [alpha-bot]
    menu                Open manual Netrun setup menu
    setup               Interactive CLI setup, saves .env
    config              Show current CLI settings
    config:set          Update CLI settings from terminal flags
    scheduler           Start daily scheduler
    netrun:daily        Run Netrun-style daily routine once
    netrun:cron         Schedule Netrun-style daily routine
    bot:init            Initialize autonomous bot
    bot:auto            Continuous autonomous bot
    bot:cron            Schedule-based bot execution
    bot:batch           Single batch execution
    bot:status          Show bot status & logs
    bot:config          Show bot configuration
    help                Show this help message

EXAMPLES:

  Create token:
    $ nitron create-token --wallet wallet.json --network devnet

  Create 5 tokens:
    $ nitron batch-tokens --wallet wallet.json --count 5

  Mint tokens:
    $ nitron mint --wallet wallet.json --mint <MINT_ADDRESS> --amount 1000

  Create NFT:
    $ nitron create-nft --wallet wallet.json --name "My NFT"

  Create 10 NFTs with images:
    $ nitron batch-nfts --wallet wallet.json --count 10 --images

  Execute custom program:
    $ nitron run-custom --wallet wallet.json

  Batch operations:
    $ nitron batch --wallet wallet.json --operations token,nft --count 5

  Multi-wallet execution:
    $ nitron multi-wallet --folder ./wallets --operation token --count 3

  Daily scheduler (9 AM):
    $ nitron scheduler --wallet wallet.json --operations token --time 09:00

  Netrun daily routine:
    $ nitron netrun:daily --folder ./wallets --token-count 100 --nft-count 5 --delay 5000

  Netrun history/imprint only:
    $ nitron netrun:daily --folder ./wallets --token-count 0 --nft-count 1 --nft-name "Sucik Nuralia"

  Netrun daily cron (every day 9 AM):
    $ nitron netrun:cron --folder ./wallets --schedule "0 9 * * *"

  Interactive setup:
    $ nitron setup

  Set config without opening file:
    $ nitron config:set --network devnet --wallets ./wallets --tx-count 100 --netrun-delay 5000 --wallet-delay 5000

  Open manual menu:
    $ nitron menu

ALPHA BOT COMMANDS:

  Initialize bot:
    $ nitron bot:init --folder ./wallets

  Continuous bot (every 60 minutes):
    $ nitron bot:auto --operations token --interval 60 --folder ./wallets

  Scheduled bot (every hour):
    $ nitron bot:cron --operations token,nft --schedule "0 * * * *"

  Single batch execution:
    $ nitron bot:batch --operations token,nft --folder ./wallets

  Check bot status:
    $ nitron bot:status

  Show bot config:
    $ nitron config

OPTIONS:
  --wallet <path>      Path to wallet JSON file (default: ./wallet.json)
  --network <network>  Solana network: devnet, testnet, mainnet-beta (default: devnet)
  --count <number>     Number of operations to execute
  --delay <ms>         Delay between transactions (default: 1500ms)
  --batch <size>       Batch size for parallel execution (default: 5)
  --log-level <level>  Logging level: debug, info, warn, error (default: info)

ENVIRONMENT VARIABLES (.env):
  NETWORK              Solana network
  RPC_ENDPOINT         Custom RPC endpoint
  WALLET_PATH          Path to wallet file
  WALLETS_FOLDER       Multi-wallet folder
  TX_DELAY_MS          Delay between transactions
  RETRY_ATTEMPTS       Number of retry attempts
  RETRY_DELAY_MS       Delay before retry
  BATCH_SIZE           Batch execution size
  NETRUN_TOKEN_COUNT   Token TX count per wallet
  NETRUN_NFT_COUNT     NFT count per wallet
  NETRUN_TX_DELAY_MS   Delay between Netrun actions
  NETRUN_WALLET_DELAY_MS Delay between wallets
  LOG_LEVEL            debug, info, warn, error

[ALPHA BOT] > ready
    `);
  });

// Default action
if (process.argv.length < 3) {
  openMenuCommand()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(`[ALPHA BOT] [ERR] ${error.message}`);
      process.exit(1);
    });
} else {
  program.parse(process.argv);
}
