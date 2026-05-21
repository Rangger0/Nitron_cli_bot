/**
 * Nitron CLI - Programmatic Usage Example
 * Use this to integrate Nitron CLI into your own applications
 */

const { loadWallet } = require("./src/wallet/walletManager");
const {
  createToken,
  batchCreateTokens,
  createAssociatedTokenAccount,
  mintTokens
} = require("./src/token/tokenManager");
const {
  createNFT,
  batchCreateNFTs,
  generateRandomNFTName
} = require("./src/nft/nftManager");
const { executeNitronProgram } = require("./src/program/programManager");
const { getConnection, getBalance } = require("./src/utils/rpc");
const Logger = require("./src/utils/logger");
const { truncateAddress, withRetry, batchExecute } = require("./src/utils/helpers");

const logger = new Logger("info");

/**
 * Example 1: Create a token
 */
async function example1_createToken() {
  logger.header("Example 1: Create a Token");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const mint = await createToken(connection, wallet, 9, logger);
  logger.success("Token created", mint.toBase58());

  return mint;
}

/**
 * Example 2: Create and mint tokens
 */
async function example2_createAndMint() {
  logger.header("Example 2: Create Token and Mint");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  // Create token
  logger.info("Creating token...");
  const mint = await createToken(connection, wallet, 9, logger);

  // Create token account
  logger.info("Creating token account...");
  const tokenAccount = await createAssociatedTokenAccount(
    connection,
    wallet,
    mint,
    wallet.publicKey,
    logger
  );

  // Mint tokens
  logger.info("Minting tokens...");
  const signature = await mintTokens(
    connection,
    wallet,
    mint,
    tokenAccount.address,
    1000,
    9,
    logger
  );

  logger.success("Complete", signature);

  return { mint, tokenAccount, signature };
}

/**
 * Example 3: Batch create tokens
 */
async function example3_batchTokens() {
  logger.header("Example 3: Batch Create Tokens");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const tokens = await batchCreateTokens(
    connection,
    wallet,
    5,
    9,
    logger,
    true
  );

  logger.success(`Created ${tokens.length} tokens`);
  tokens.forEach((token) => logger.info(`Token: ${token.mint}`));

  return tokens;
}

/**
 * Example 4: Create NFTs
 */
async function example4_createNFTs() {
  logger.header("Example 4: Create NFTs");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const nfts = await batchCreateNFTs(connection, wallet, 3, logger, false);

  logger.success(`Created ${nfts.length} NFTs`);
  nfts.forEach((nft) => logger.info(`NFT: ${nft.name}`));

  return nfts;
}

/**
 * Example 5: Execute custom program
 */
async function example5_customProgram() {
  logger.header("Example 5: Execute Custom Program");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const signature = await executeNitronProgram(connection, wallet, logger);

  logger.success("Program executed", signature);

  return signature;
}

/**
 * Example 6: Retry logic
 */
async function example6_withRetry() {
  logger.header("Example 6: Retry Logic");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const result = await withRetry(
    () => createToken(connection, wallet, 9),
    3,
    1000,
    (attempt, max) => {
      logger.retry(attempt, max);
    }
  );

  logger.success("Token created with retry", result.toBase58());

  return result;
}

/**
 * Example 7: Batch execution
 */
async function example7_batchExecution() {
  logger.header("Example 7: Batch Execution");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  // Create array of tasks
  const tasks = Array.from({ length: 5 }, () => () =>
    createToken(connection, wallet, 9, logger)
  );

  // Execute in batches
  const results = await batchExecute(
    tasks,
    2,
    1000,
    (completed, total) => {
      logger.info(`Progress: ${completed}/${total}`);
    }
  );

  logger.success(`Completed ${results.length} tasks`);

  return results;
}

/**
 * Example 8: Check wallet balance
 */
async function example8_checkBalance() {
  logger.header("Example 8: Check Wallet Balance");

  const wallet = loadWallet("./wallet.json");
  const connection = getConnection("devnet");

  const balance = await getBalance(connection, wallet.publicKey);
  const solBalance = balance / 1e9;

  logger.info(`Wallet: ${truncateAddress(wallet.publicKey.toBase58())}`);
  logger.success(`Balance: ${solBalance.toFixed(4)} SOL`);

  return { balance, solBalance };
}

/**
 * Example 9: Complex workflow
 */
async function example9_complexWorkflow() {
  logger.header("Example 9: Complex Workflow");

  try {
    const wallet = loadWallet("./wallet.json");
    const connection = getConnection("devnet");

    // 1. Check balance
    logger.info("Checking balance...");
    const balance = await getBalance(connection, wallet.publicKey);
    if (balance < 5000000) {
      throw new Error("Insufficient balance");
    }
    logger.success(`Balance OK: ${(balance / 1e9).toFixed(4)} SOL`);

    // 2. Create tokens
    logger.divider();
    logger.info("Creating tokens...");
    const tokens = await batchCreateTokens(connection, wallet, 2, 9, logger);
    logger.success(`Created ${tokens.length} tokens`);

    // 3. Create NFTs
    logger.divider();
    logger.info("Creating NFTs...");
    const nfts = await batchCreateNFTs(connection, wallet, 2, logger);
    logger.success(`Created ${nfts.length} NFTs`);

    // 4. Execute program
    logger.divider();
    logger.info("Executing program...");
    const signature = await executeNitronProgram(connection, wallet, logger);
    logger.success("Program executed", signature);

    logger.divider();
    logger.success("Workflow completed!");

    return { tokens, nfts, signature };
  } catch (error) {
    logger.error(`Workflow failed: ${error.message}`);
    throw error;
  }
}

/**
 * Example 10: Error handling
 */
async function example10_errorHandling() {
  logger.header("Example 10: Error Handling");

  try {
    const wallet = loadWallet("./invalid-wallet.json");
  } catch (error) {
    logger.error(`Error caught: ${error.message}`);
    logger.info("This is normal error handling");
  }

  logger.success("Error handling works!");
}

/**
 * Main runner
 */
async function runExamples() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    logger.header("Available Examples");
    console.log(`
1. example1_createToken - Create a single token
2. example2_createAndMint - Create token and mint
3. example3_batchTokens - Batch create tokens
4. example4_createNFTs - Create NFTs
5. example5_customProgram - Execute custom program
6. example6_withRetry - Retry logic
7. example7_batchExecution - Batch execution
8. example8_checkBalance - Check wallet balance
9. example9_complexWorkflow - Complex workflow
10. example10_errorHandling - Error handling

Usage:
  node examples.js <number>
  node examples.js 1      # Run example 1
  node examples.js all    # Run all examples

Examples:
  node examples.js 1
  node examples.js 5
  node examples.js all
    `);
    return;
  }

  const examples = {
    1: example1_createToken,
    2: example2_createAndMint,
    3: example3_batchTokens,
    4: example4_createNFTs,
    5: example5_customProgram,
    6: example6_withRetry,
    7: example7_batchExecution,
    8: example8_checkBalance,
    9: example9_complexWorkflow,
    10: example10_errorHandling
  };

  const toRun =
    args[0] === "all" ? Object.keys(examples) : args;

  for (const num of toRun) {
    const example = examples[num];
    if (!example) {
      logger.warn(`Example ${num} not found`);
      continue;
    }

    try {
      await example();
    } catch (error) {
      logger.error(`Example ${num} failed: ${error.message}`);
    }

    logger.divider();
  }

  logger.success("Examples completed!");
}

// Run
runExamples().catch(logger.error);
