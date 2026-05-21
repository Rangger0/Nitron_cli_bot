const dotenv = require("dotenv");
const path = require("path");

// Load environment variables
dotenv.config();

module.exports = {
  // Network Configuration
  network: process.env.NETWORK || "devnet",
  rpcEndpoint: process.env.RPC_ENDPOINT || null,

  // Wallet Configuration
  walletPath: process.env.WALLET_PATH || path.join(process.cwd(), "wallet.json"),
  walletsFolderPath: process.env.WALLETS_FOLDER || path.join(process.cwd(), "wallets"),

  // Transaction Settings
  txDelayMs: parseInt(process.env.TX_DELAY_MS || "1500", 10),
  retryAttempts: parseInt(process.env.RETRY_ATTEMPTS || "3", 10),
  retryDelayMs: parseInt(process.env.RETRY_DELAY_MS || "3000", 10),

  // Batch Settings
  batchSize: parseInt(process.env.BATCH_SIZE || "5", 10),
  batchDelayMs: parseInt(process.env.BATCH_DELAY_MS || "500", 10),

  // Netrun Routine Defaults
  netrun: {
    tokenCount: parseInt(process.env.NETRUN_TOKEN_COUNT || "100", 10),
    nftCount: parseInt(process.env.NETRUN_NFT_COUNT || "5", 10),
    mintAmount: parseFloat(process.env.NETRUN_MINT_AMOUNT || "1000"),
    decimals: parseInt(process.env.NETRUN_DECIMALS || "9", 10),
    txDelayMs: parseInt(process.env.NETRUN_TX_DELAY_MS || process.env.TX_DELAY_MS || "5000", 10),
    walletDelayMs: parseInt(process.env.NETRUN_WALLET_DELAY_MS || "5000", 10),
    tokenName: process.env.NETRUN_TOKEN_NAME || "Netrun Token",
    nftName: process.env.NETRUN_NFT_NAME || "Netrun NFT",
    symbol: process.env.NETRUN_SYMBOL || "NETRUN",
    imageCid: process.env.NETRUN_IMAGE_CID || "QmYLB6Dekvhp7Zx9m7QZMz3aocrRv7jMYHkMdamvbSZJfq",
    description: process.env.NETRUN_DESCRIPTION || "NFT created with Netrun",
    // website indexer base URL
    historyBaseUrl: process.env.NETRUN_HISTORY_BASE_URL || "https://app.netrun.xyz"
  },

  // NFT Settings
  nftImagesFolder: process.env.NFT_IMAGES_FOLDER || path.join(process.cwd(), "images"),
  ipfsPlaceholder: process.env.IPFS_PLACEHOLDER !== "false",

  // Logging
  logLevel: process.env.LOG_LEVEL || "info",
  logFilePath: process.env.LOG_FILE_PATH || path.join(process.cwd(), "bot-logs.json"),

  // Program Configuration
  customProgram: {
    programId: "FqDHFYCYfLadhHjEkbsxTmNmW4f2kMb6Pxf2sSFoRn1G",
    accounts: [
      "4N57F7UgJkYVkWFDChP6hXN7LrzaFoek6ux52H5Ttrwf",
      "FHccEkGLyS3ur4X3s7MtV3GQMeA7xsN5RoA7TicVTuM7",
      "JAhjsZ71xHntsNZv9zt1Z1uZ39uEzivD2VPEYWi4vgJd",
      "2wf3o5itzRTAf8pCvsRZBpecftNVyGXn2P7Yokb1nWqP",
      "FTQr5iY1H1VRbZPvkxSZ15qopuC5LDfHSAbYtZBsSx9z",
      "11111111111111111111111111111111"
    ],
    instructionData: "csGjuqA4Oe9Ohf9Fvs6FwiOB9uJwZg7F4q68wvuGLwT4tKd1wytLdcbCjjYcG7ZT8OXTE3mZd3WZnv4QANNRtBFGNY2hVEqZHPLPAd7vJEjW890reaNa0kmtSXiEcmMuR7SRhOrgXAgEANativxa8kskOyqESjOkiDEjDpNhNxOJBf0KYMw8vRUAAAAAAAAAAQAAAAAAAAAVAAAAAAAAAAcOCWoAAAAA"
  }
};
