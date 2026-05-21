const { loadWallet, loadMultipleWallets } = require("../wallet/walletManager");
const { createToken, batchCreateTokens, createAssociatedTokenAccount, mintTokens } = require("../token/tokenManager");
const { getConnection, getBalance } = require("../utils/rpc");
const { withRetry, sleep, truncateAddress } = require("../utils/helpers");
const Logger = require("../utils/logger");
const config = require("../config/config");

/**
 * Create Token Command
 */
async function createTokenCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("CREATE TOKEN");
    logger.divider();

    // Get wallet
    const walletPath = options.wallet || config.walletPath;
    logger.info(`Loading wallet from: ${walletPath}`);
    const wallet = loadWallet(walletPath);
    logger.success("Wallet loaded", truncateAddress(wallet.publicKey.toBase58()));

    // Get connection
    const network = options.network || config.network;
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Check balance
    const balance = await getBalance(connection, wallet.publicKey);
    logger.info(`Wallet balance: ${(balance / 1e9).toFixed(4)} SOL`);

    if (balance < 5000000) {
      logger.warn("Low balance detected. May fail on mainnet.");
    }

    // Create token
    logger.info("Creating token...");
    const decimals = parseInt(options.decimals || 9, 10);
    const mint = await createToken(connection, wallet, decimals, logger);

    logger.divider();
    logger.success("Token created successfully!");
    logger.info(`Mint: ${mint.toBase58()}`);

    return mint.toBase58();
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Create Multiple Tokens Command
 */
async function batchCreateTokenCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("BATCH CREATE TOKENS");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const count = parseInt(options.count || 2, 10);
    const decimals = parseInt(options.decimals || 9, 10);
    const delay = parseInt(options.delay || config.txDelayMs, 10);
    const network = options.network || config.network;

    logger.info(`Creating ${count} tokens`);
    logger.info(`Decimals: ${decimals}`);
    logger.info(`Delay between transactions: ${delay}ms`);

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

    // Create tokens
    logger.divider();
    const tokens = await batchCreateTokens(
      connection,
      wallet,
      count,
      decimals,
      logger
    );

    logger.divider();
    logger.success(`Created ${tokens.length} tokens successfully!`);
    tokens.forEach((token, index) => {
      logger.info(`Token ${index + 1}`, token.mint);
    });

    return tokens;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Mint Command
 */
async function mintCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("MINT TOKENS");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const mint = options.mint;
    const amount = parseFloat(options.amount || 1000);
    const decimals = parseInt(options.decimals || 9, 10);
    const network = options.network || config.network;

    if (!mint) {
      throw new Error("--mint option is required");
    }

    logger.info(`Mint: ${mint}`);
    logger.info(`Amount: ${amount}`);
    logger.info(`Decimals: ${decimals}`);

    // Load wallet
    logger.info(`Loading wallet from: ${walletPath}`);
    const wallet = loadWallet(walletPath);
    logger.success("Wallet loaded", truncateAddress(wallet.publicKey.toBase58()));

    // Get connection
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Create token account
    const { PublicKey } = require("@solana/web3.js");
    const mintPublicKey = new PublicKey(mint);

    logger.info("Creating/fetching associated token account...");
    const tokenAccount = await createAssociatedTokenAccount(
      connection,
      wallet,
      mintPublicKey,
      wallet.publicKey,
      logger
    );

    // Mint tokens
    logger.divider();
    logger.info("Minting tokens...");
    const signature = await mintTokens(
      connection,
      wallet,
      mintPublicKey,
      tokenAccount.address,
      amount,
      decimals,
      logger
    );

    logger.divider();
    logger.success("Tokens minted successfully!");

    return signature;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createTokenCommand,
  batchCreateTokenCommand,
  mintCommand
};
