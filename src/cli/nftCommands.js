const { loadWallet } = require("../wallet/walletManager");
const { createNFT, batchCreateNFTs, generateRandomNFTName } = require("../nft/nftManager");
const { getConnection, getBalance } = require("../utils/rpc");
const { truncateAddress } = require("../utils/helpers");
const Logger = require("../utils/logger");
const config = require("../config/config");

/**
 * Create NFT Command
 */
async function createNFTCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("CREATE NFT");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const name = options.name || generateRandomNFTName();
    const symbol = options.symbol || "NITRON";
    const uri = options.uri || "";
    const network = options.network || config.network;

    logger.info(`NFT Name: ${name}`);
    logger.info(`Symbol: ${symbol}`);

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

    // Create NFT
    logger.divider();
    logger.info("Creating NFT metadata...");
    const nft = await createNFT(connection, wallet, name, symbol, uri, logger);

    logger.divider();
    logger.success("NFT created successfully!");
    logger.info(`Name: ${nft.name}`);
    logger.info(`URI: ${nft.uri}`);

    return nft;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

/**
 * Batch Create NFTs Command
 */
async function batchCreateNFTCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("BATCH CREATE NFTs");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const count = parseInt(options.count || 2, 10);
    const includeImages = options.images === "true";
    const network = options.network || config.network;

    logger.info(`Creating ${count} NFTs`);
    logger.info(`Include images: ${includeImages}`);

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

    // Create NFTs
    logger.divider();
    const nfts = await batchCreateNFTs(connection, wallet, count, logger, includeImages);

    logger.divider();
    logger.success(`Created ${nfts.length} NFTs successfully!`);
    nfts.forEach((nft, index) => {
      logger.info(`NFT ${index + 1}: ${nft.name}`);
    });

    return nfts;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

module.exports = {
  createNFTCommand,
  batchCreateNFTCommand
};
