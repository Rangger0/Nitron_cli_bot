const fs = require("fs");
const path = require("path");
const readline = require("readline");
const dotenv = require("dotenv");
const Logger = require("../utils/logger");
const config = require("../config/config");

const ENV_TEMPLATE = [
  "# Alpha Bot CLI Settings",
  "NETWORK=devnet",
  "RPC_ENDPOINT=",
  "WALLET_PATH=./wallet.json",
  "WALLETS_FOLDER=./wallets",
  "TX_DELAY_MS=1500",
  "RETRY_ATTEMPTS=3",
  "RETRY_DELAY_MS=3000",
  "BATCH_SIZE=5",
  "BATCH_DELAY_MS=500",
  "NETRUN_TOKEN_COUNT=100",
  "NETRUN_NFT_COUNT=5",
  "NETRUN_MINT_AMOUNT=1000",
  "NETRUN_DECIMALS=9",
  "NETRUN_TX_DELAY_MS=5000",
  "NETRUN_WALLET_DELAY_MS=5000",
  "NETRUN_TOKEN_NAME=Netrun Token",
  "NETRUN_NFT_NAME=Netrun NFT",
  "NETRUN_SYMBOL=NETRUN",
  "NETRUN_IMAGE_CID=QmYLB6Dekvhp7Zx9m7QZMz3aocrRv7jMYHkMdamvbSZJfq",
  "NETRUN_DESCRIPTION=NFT created with Netrun",
  "NFT_IMAGES_FOLDER=./images",
  "IPFS_PLACEHOLDER=true",
  "LOG_LEVEL=info",
  ""
].join("\n");

const OPTION_TO_ENV = {
  network: "NETWORK",
  rpc: "RPC_ENDPOINT",
  wallet: "WALLET_PATH",
  wallets: "WALLETS_FOLDER",
  txDelay: "TX_DELAY_MS",
  retryAttempts: "RETRY_ATTEMPTS",
  retryDelay: "RETRY_DELAY_MS",
  batchSize: "BATCH_SIZE",
  batchDelay: "BATCH_DELAY_MS",
  txCount: "NETRUN_TOKEN_COUNT",
  tokenCount: "NETRUN_TOKEN_COUNT",
  nftCount: "NETRUN_NFT_COUNT",
  mintAmount: "NETRUN_MINT_AMOUNT",
  decimals: "NETRUN_DECIMALS",
  netrunDelay: "NETRUN_TX_DELAY_MS",
  walletDelay: "NETRUN_WALLET_DELAY_MS",
  tokenName: "NETRUN_TOKEN_NAME",
  nftName: "NETRUN_NFT_NAME",
  symbol: "NETRUN_SYMBOL",
  imageCid: "NETRUN_IMAGE_CID",
  description: "NETRUN_DESCRIPTION",
  nftImages: "NFT_IMAGES_FOLDER",
  ipfsPlaceholder: "IPFS_PLACEHOLDER",
  level: "LOG_LEVEL",
  logLevel: "LOG_LEVEL"
};

function getEnvPath(options = {}) {
  return path.resolve(process.cwd(), options.configFile || ".env");
}

function quoteEnvValue(value) {
  const stringValue = String(value);

  if (!/[\s#"']/u.test(stringValue)) {
    return stringValue;
  }

  return `"${stringValue.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function collectUpdates(options) {
  const updates = {};

  for (const [optionKey, envKey] of Object.entries(OPTION_TO_ENV)) {
    if (options[optionKey] !== undefined) {
      updates[envKey] = options[optionKey];
    }
  }

  return updates;
}

function readEnvSource(envPath) {
  if (fs.existsSync(envPath)) {
    return fs.readFileSync(envPath, "utf-8");
  }

  const examplePath = path.resolve(process.cwd(), ".env.example");
  if (fs.existsSync(examplePath)) {
    return fs.readFileSync(examplePath, "utf-8");
  }

  return ENV_TEMPLATE;
}

function readEnvValues(envPath) {
  if (!fs.existsSync(envPath)) {
    return {};
  }

  return dotenv.parse(fs.readFileSync(envPath, "utf-8"));
}

function envValue(values, key, fallback) {
  return values[key] !== undefined && values[key] !== "" ? values[key] : fallback;
}

function writeEnvUpdates(envPath, updates) {
  const existing = readEnvSource(envPath);
  const lines = existing.split(/\r?\n/u);
  const pending = new Set(Object.keys(updates));

  const nextLines = lines.map((line) => {
    const match = line.match(/^([A-Z0-9_]+)=/u);
    if (!match) {
      return line;
    }

    const key = match[1];
    if (!pending.has(key)) {
      return line;
    }

    pending.delete(key);
    return `${key}=${quoteEnvValue(updates[key])}`;
  });

  if (pending.size > 0) {
    if (nextLines[nextLines.length - 1] !== "") {
      nextLines.push("");
    }
    nextLines.push("# Added by Alpha Bot CLI");

    for (const key of pending) {
      nextLines.push(`${key}=${quoteEnvValue(updates[key])}`);
    }
  }

  fs.writeFileSync(envPath, nextLines.join("\n"), "utf-8");
}

function validateUpdates(updates) {
  const validNetworks = ["devnet", "testnet", "mainnet-beta"];
  const validLogLevels = ["debug", "info", "warn", "error"];

  if (updates.NETWORK && !validNetworks.includes(updates.NETWORK)) {
    throw new Error(`Invalid network: ${updates.NETWORK}. Use: ${validNetworks.join(", ")}`);
  }

  if (updates.LOG_LEVEL && !validLogLevels.includes(updates.LOG_LEVEL)) {
    throw new Error(`Invalid log level: ${updates.LOG_LEVEL}. Use: ${validLogLevels.join(", ")}`);
  }

  for (const key of [
    "TX_DELAY_MS",
    "RETRY_ATTEMPTS",
    "RETRY_DELAY_MS",
    "BATCH_SIZE",
    "BATCH_DELAY_MS",
    "NETRUN_TOKEN_COUNT",
    "NETRUN_NFT_COUNT",
    "NETRUN_MINT_AMOUNT",
    "NETRUN_DECIMALS",
    "NETRUN_TX_DELAY_MS",
    "NETRUN_WALLET_DELAY_MS"
  ]) {
    if (updates[key] !== undefined && Number.isNaN(parseInt(updates[key], 10))) {
      throw new Error(`${key} must be a number`);
    }
  }
}

function question(rl, label, fallback) {
  const suffix = fallback ? ` (${fallback})` : "";

  return new Promise((resolve) => {
    rl.question(`[ALPHA BOT] ? ${label}${suffix}: `, (answer) => {
      const value = answer.trim();
      resolve(value || fallback || "");
    });
  });
}

async function setupConfigCommand(options = {}) {
  const logger = new Logger(config.logLevel);
  const envPath = getEnvPath(options);

  if (!process.stdin.isTTY) {
    throw new Error("Setup needs an interactive terminal. Use config:set for non-interactive setup.");
  }

  logger.header("SETUP WIZARD");
  logger.info(`Config file: ${envPath}`);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    const updates = {
      NETWORK: await question(rl, "Network [devnet/testnet/mainnet-beta]", config.network),
      RPC_ENDPOINT: await question(rl, "RPC endpoint, kosongkan untuk default", config.rpcEndpoint || ""),
      WALLET_PATH: await question(rl, "Single wallet path", config.walletPath),
      WALLETS_FOLDER: await question(rl, "Multi wallet folder", config.walletsFolderPath),
      TX_DELAY_MS: await question(rl, "Default TX delay ms", String(config.txDelayMs)),
      RETRY_ATTEMPTS: await question(rl, "Retry attempts", String(config.retryAttempts)),
      RETRY_DELAY_MS: await question(rl, "Retry delay ms", String(config.retryDelayMs)),
      BATCH_SIZE: await question(rl, "Batch size", String(config.batchSize)),
      BATCH_DELAY_MS: await question(rl, "Batch delay ms", String(config.batchDelayMs)),
      NETRUN_TOKEN_COUNT: await question(rl, "Netrun token TX count per wallet", String(config.netrun.tokenCount)),
      NETRUN_NFT_COUNT: await question(rl, "Netrun NFT count per wallet", String(config.netrun.nftCount)),
      NETRUN_MINT_AMOUNT: await question(rl, "Netrun mint amount", String(config.netrun.mintAmount)),
      NETRUN_DECIMALS: await question(rl, "Netrun token decimals", String(config.netrun.decimals)),
      NETRUN_TX_DELAY_MS: await question(rl, "Netrun TX delay ms", String(config.netrun.txDelayMs)),
      NETRUN_WALLET_DELAY_MS: await question(rl, "Netrun wallet switch delay ms", String(config.netrun.walletDelayMs)),
      NETRUN_TOKEN_NAME: await question(rl, "Netrun token name", config.netrun.tokenName),
      NETRUN_NFT_NAME: await question(rl, "Netrun NFT base name", config.netrun.nftName),
      NETRUN_SYMBOL: await question(rl, "Netrun symbol", config.netrun.symbol),
      NETRUN_IMAGE_CID: await question(rl, "Netrun image IPFS CID", config.netrun.imageCid),
      NETRUN_DESCRIPTION: await question(rl, "Netrun NFT description", config.netrun.description),
      NFT_IMAGES_FOLDER: await question(rl, "NFT images folder", config.nftImagesFolder),
      IPFS_PLACEHOLDER: await question(rl, "IPFS placeholder [true/false]", String(config.ipfsPlaceholder)),
      LOG_LEVEL: await question(rl, "Log level [debug/info/warn/error]", config.logLevel)
    };

    validateUpdates(updates);
    writeEnvUpdates(envPath, updates);

    logger.success("Config saved", envPath);
    logger.info("Run `node src/index.js config` to check it.");
  } finally {
    rl.close();
  }
}

async function setConfigCommand(options = {}) {
  const logger = new Logger(config.logLevel);
  const envPath = getEnvPath(options);
  const updates = collectUpdates(options);

  logger.header("CONFIG SET");

  if (Object.keys(updates).length === 0) {
    logger.warn("No settings provided");
    logger.info("Example: node src/index.js config:set --network devnet --wallets ./wallets --tx-count 100 --netrun-delay 5000 --wallet-delay 5000");
    return;
  }

  validateUpdates(updates);
  writeEnvUpdates(envPath, updates);

  logger.success("Config saved", envPath);

  for (const [key, value] of Object.entries(updates)) {
    logger.info(`${key}=${value}`);
  }
}

async function showConfigCommand(options = {}) {
  const logger = new Logger(config.logLevel);
  const envPath = getEnvPath(options);
  const exists = fs.existsSync(envPath);
  const values = readEnvValues(envPath);

  logger.header("CONFIGURATION");

  console.log(`
[ALPHA BOT] > Config File    : ${envPath}
[ALPHA BOT] > File Exists    : ${exists ? "yes" : "no"}
[ALPHA BOT] > Network        : ${envValue(values, "NETWORK", config.network)}
[ALPHA BOT] > RPC Endpoint   : ${envValue(values, "RPC_ENDPOINT", config.rpcEndpoint || "default cluster RPC")}
[ALPHA BOT] > Wallet Path    : ${envValue(values, "WALLET_PATH", config.walletPath)}
[ALPHA BOT] > Wallet Folder  : ${envValue(values, "WALLETS_FOLDER", config.walletsFolderPath)}
[ALPHA BOT] > TX Delay       : ${envValue(values, "TX_DELAY_MS", config.txDelayMs)}ms
[ALPHA BOT] > Retry Attempts : ${envValue(values, "RETRY_ATTEMPTS", config.retryAttempts)}
[ALPHA BOT] > Retry Delay    : ${envValue(values, "RETRY_DELAY_MS", config.retryDelayMs)}ms
[ALPHA BOT] > Batch Size     : ${envValue(values, "BATCH_SIZE", config.batchSize)}
[ALPHA BOT] > Batch Delay    : ${envValue(values, "BATCH_DELAY_MS", config.batchDelayMs)}ms
[ALPHA BOT] > Project        : Netrun
[ALPHA BOT] > Netrun TX Count: ${envValue(values, "NETRUN_TOKEN_COUNT", config.netrun.tokenCount)}
[ALPHA BOT] > Netrun NFTs    : ${envValue(values, "NETRUN_NFT_COUNT", config.netrun.nftCount)}
[ALPHA BOT] > Netrun Mint    : ${envValue(values, "NETRUN_MINT_AMOUNT", config.netrun.mintAmount)}
[ALPHA BOT] > Netrun Decimals: ${envValue(values, "NETRUN_DECIMALS", config.netrun.decimals)}
[ALPHA BOT] > Netrun TX Delay: ${envValue(values, "NETRUN_TX_DELAY_MS", config.netrun.txDelayMs)}ms
[ALPHA BOT] > Wallet Delay   : ${envValue(values, "NETRUN_WALLET_DELAY_MS", config.netrun.walletDelayMs)}ms
[ALPHA BOT] > Netrun Token   : ${envValue(values, "NETRUN_TOKEN_NAME", config.netrun.tokenName)}
[ALPHA BOT] > Netrun NFT     : ${envValue(values, "NETRUN_NFT_NAME", config.netrun.nftName)}
[ALPHA BOT] > Netrun Symbol  : ${envValue(values, "NETRUN_SYMBOL", config.netrun.symbol)}
[ALPHA BOT] > NFT Images     : ${envValue(values, "NFT_IMAGES_FOLDER", config.nftImagesFolder)}
[ALPHA BOT] > IPFS Placeholder: ${envValue(values, "IPFS_PLACEHOLDER", config.ipfsPlaceholder)}
[ALPHA BOT] > Log Level      : ${envValue(values, "LOG_LEVEL", config.logLevel)}

[ALPHA BOT] > Setup
  node src/index.js setup
  node src/index.js config:set --network devnet --wallets ./wallets --tx-count 100 --netrun-delay 5000 --wallet-delay 5000
  node src/index.js netrun:daily
`);
}

module.exports = {
  setupConfigCommand,
  setConfigCommand,
  showConfigCommand
};
