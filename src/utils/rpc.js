const { Connection, clusterApiUrl } = require("@solana/web3.js");
const config = require("../config/config");

/**
 * Get Solana RPC connection based on network
 */
function getConnection(network = config.network) {
  let endpoint;

  if (config.rpcEndpoint) {
    endpoint = config.rpcEndpoint;
  } else {
    // Use cluster API URL
    try {
      endpoint = clusterApiUrl(network);
    } catch (error) {
      throw new Error(`Invalid network: ${network}`);
    }
  }

  return new Connection(endpoint, "confirmed");
}

/**
 * Get network-specific connection
 */
function getConnectionByNetwork(network) {
  if (!["devnet", "testnet", "mainnet-beta"].includes(network)) {
    throw new Error(`Invalid network: ${network}. Use: devnet, testnet, or mainnet-beta`);
  }
  return getConnection(network);
}

/**
 * Check if connection is active
 */
async function isConnectionActive(connection) {
  try {
    const version = await connection.getVersion();
    return !!version;
  } catch (error) {
    return false;
  }
}

/**
 * Get account balance in lamports
 */
async function getBalance(connection, publicKey) {
  try {
    return await connection.getBalance(publicKey);
  } catch (error) {
    throw new Error(`Failed to get balance: ${error.message}`);
  }
}

/**
 * Get account info
 */
async function getAccountInfo(connection, publicKey) {
  try {
    return await connection.getAccountInfo(publicKey);
  } catch (error) {
    throw new Error(`Failed to get account info: ${error.message}`);
  }
}

module.exports = {
  getConnection,
  getConnectionByNetwork,
  isConnectionActive,
  getBalance,
  getAccountInfo
};
