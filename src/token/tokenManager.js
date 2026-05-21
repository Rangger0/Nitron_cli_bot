const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getMint,
  getAccount
} = require("@solana/spl-token");
const { sendAndConfirmTransaction, Transaction } = require("@solana/web3.js");
const { withRetry, sleep } = require("../utils/helpers");
const config = require("../config/config");

/**
 * Create SPL token (mint)
 */
async function createToken(connection, wallet, decimals = 9, logger = null) {
  try {
    const mint = await createMint(
      connection,
      wallet,
      wallet.publicKey,
      null,
      decimals
    );

    if (logger) {
      logger.success("Token created", mint.toBase58());
    }

    return mint;
  } catch (error) {
    throw new Error(`Failed to create token: ${error.message}`);
  }
}

/**
 * Get or create associated token account
 */
async function createAssociatedTokenAccount(connection, wallet, mint, owner = null, logger = null) {
  try {
    const targetOwner = owner || wallet.publicKey;
    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      wallet,
      mint,
      targetOwner
    );

    if (logger) {
      logger.success("Token account created/fetched", tokenAccount.address.toBase58());
    }

    return tokenAccount;
  } catch (error) {
    throw new Error(`Failed to create/get associated token account: ${error.message}`);
  }
}

/**
 * Mint tokens to an account
 */
async function mintTokens(
  connection,
  wallet,
  mint,
  destination,
  amount,
  decimals = 9,
  logger = null
) {
  try {
    const realAmount = BigInt(Math.floor(amount * Math.pow(10, decimals)));
    
    const signature = await mintTo(
      connection,
      wallet,
      mint,
      destination,
      wallet,
      realAmount
    );

    if (logger) {
      logger.tx(signature);
    }

    return signature;
  } catch (error) {
    throw new Error(`Failed to mint tokens: ${error.message}`);
  }
}

/**
 * Batch create tokens with retry logic and delays
 */
async function batchCreateTokens(
  connection,
  wallet,
  count,
  decimals = 9,
  logger = null,
  randomNames = false
) {
  const { randomName } = require("../utils/helpers");
  const tokens = [];

  for (let i = 0; i < count; i++) {
    try {
      const name = randomNames ? randomName() : `Token ${i + 1}`;

      if (logger) {
        logger.info(`Creating token ${i + 1}/${count}: ${name}`);
      }

      const mint = await withRetry(
        () => createToken(connection, wallet, decimals),
        config.retryAttempts,
        config.retryDelayMs,
        (attempt, maxAttempts) => {
          if (logger) logger.retry(attempt, maxAttempts);
        }
      );

      tokens.push({
        name,
        mint: mint.toBase58(),
        index: i + 1
      });

      if (logger) {
        logger.success(`Token ${i + 1}/${count}`, mint.toBase58());
      }

      // Delay between creations
      if (i < count - 1) {
        await sleep(config.txDelayMs);
      }
    } catch (error) {
      if (logger) {
        logger.error(`Failed to create token ${i + 1}/${count}: ${error.message}`);
      }
      throw error;
    }
  }

  return tokens;
}

/**
 * Batch mint tokens
 */
async function batchMintTokens(
  connection,
  wallet,
  mint,
  destination,
  count,
  amountPerMint = 1000,
  decimals = 9,
  logger = null
) {
  const signatures = [];

  for (let i = 0; i < count; i++) {
    try {
      if (logger) {
        logger.info(`Minting ${i + 1}/${count}...`);
      }

      const signature = await withRetry(
        () => mintTokens(connection, wallet, mint, destination, amountPerMint, decimals),
        config.retryAttempts,
        config.retryDelayMs,
        (attempt, maxAttempts) => {
          if (logger) logger.retry(attempt, maxAttempts);
        }
      );

      signatures.push(signature);

      if (i < count - 1) {
        await sleep(config.txDelayMs);
      }
    } catch (error) {
      if (logger) {
        logger.error(`Failed to mint token ${i + 1}/${count}: ${error.message}`);
      }
      throw error;
    }
  }

  return signatures;
}

/**
 * Get token supply
 */
async function getTokenSupply(connection, mint) {
  try {
    const supply = await getMint(connection, mint);
    return supply.supply;
  } catch (error) {
    throw new Error(`Failed to get token supply: ${error.message}`);
  }
}

/**
 * Get token account balance
 */
async function getTokenBalance(connection, tokenAccount) {
  try {
    const account = await getAccount(connection, tokenAccount);
    return account.amount;
  } catch (error) {
    throw new Error(`Failed to get token balance: ${error.message}`);
  }
}

module.exports = {
  createToken,
  createAssociatedTokenAccount,
  mintTokens,
  batchCreateTokens,
  batchMintTokens,
  getTokenSupply,
  getTokenBalance
};
