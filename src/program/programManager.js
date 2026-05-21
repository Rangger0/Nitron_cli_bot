const { sendAndConfirmTransaction, Transaction, TransactionInstruction, PublicKey, SystemProgram } = require("@solana/web3.js");
const bs58 = require("bs58");
const { withRetry, sleep } = require("../utils/helpers");
const config = require("../config/config");

/**
 * Decode instruction data from base58
 */
function decodeInstructionData(base58Data) {
  try {
    return bs58.decode(base58Data);
  } catch (error) {
    throw new Error(`Failed to decode instruction data: ${error.message}`);
  }
}

/**
 * Encode instruction data to base58
 */
function encodeInstructionData(data) {
  try {
    return bs58.encode(data);
  } catch (error) {
    throw new Error(`Failed to encode instruction data: ${error.message}`);
  }
}

/**
 * Build transaction instruction from program data
 */
function buildTransactionInstruction(programId, accounts, instructionData) {
  try {
    // Convert program ID
    const programPublicKey = new PublicKey(programId);

    // Convert account addresses
    const accountKeys = accounts.map((account) => ({
      pubkey: new PublicKey(account),
      isSigner: false,
      isWritable: true
    }));

    // Decode instruction data
    let data;
    if (typeof instructionData === "string") {
      // Assume base58 encoded
      data = decodeInstructionData(instructionData);
    } else {
      data = instructionData;
    }

    // Create instruction
    const instruction = new TransactionInstruction({
      programId: programPublicKey,
      keys: accountKeys,
      data: Buffer.from(data)
    });

    return instruction;
  } catch (error) {
    throw new Error(`Failed to build transaction instruction: ${error.message}`);
  }
}

/**
 * Send transaction with instruction
 */
async function sendTransaction(connection, wallet, instruction, logger = null) {
  try {
    // Get recent blockhash
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    // Create transaction
    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: wallet.publicKey,
      lastValidBlockHeight
    });

    // Add instruction
    transaction.add(instruction);

    // Send transaction
    if (logger) {
      logger.info("Sending transaction...");
    }

    const signature = await sendAndConfirmTransaction(
      connection,
      transaction,
      [wallet],
      { commitment: "confirmed" }
    );

    if (logger) {
      logger.tx(signature);
    }

    return signature;
  } catch (error) {
    throw new Error(`Failed to send transaction: ${error.message}`);
  }
}

/**
 * Execute custom program instruction with retry
 */
async function executeCustomProgram(
  connection,
  wallet,
  programId,
  accounts,
  instructionData,
  logger = null
) {
  try {
    // Build instruction
    const instruction = buildTransactionInstruction(programId, accounts, instructionData);

    // Send with retry
    const signature = await withRetry(
      () => sendTransaction(connection, wallet, instruction, logger),
      config.retryAttempts,
      config.retryDelayMs,
      (attempt, maxAttempts) => {
        if (logger) logger.retry(attempt, maxAttempts);
      }
    );

    return signature;
  } catch (error) {
    throw new Error(`Failed to execute custom program: ${error.message}`);
  }
}

/**
 * Execute default Nitron program
 */
async function executeNitronProgram(connection, wallet, logger = null) {
  try {
    return await executeCustomProgram(
      connection,
      wallet,
      config.customProgram.programId,
      config.customProgram.accounts,
      config.customProgram.instructionData,
      logger
    );
  } catch (error) {
    throw new Error(`Failed to execute Nitron program: ${error.message}`);
  }
}

/**
 * Batch execute custom program
 */
async function batchExecuteCustomProgram(
  connection,
  wallet,
  programId,
  accounts,
  instructionData,
  count,
  logger = null
) {
  const signatures = [];

  for (let i = 0; i < count; i++) {
    try {
      if (logger) {
        logger.info(`Executing program ${i + 1}/${count}...`);
      }

      const signature = await executeCustomProgram(
        connection,
        wallet,
        programId,
        accounts,
        instructionData,
        logger
      );

      signatures.push(signature);

      if (i < count - 1) {
        await sleep(config.txDelayMs);
      }
    } catch (error) {
      if (logger) {
        logger.error(`Failed to execute program ${i + 1}/${count}: ${error.message}`);
      }
      throw error;
    }
  }

  return signatures;
}

module.exports = {
  decodeInstructionData,
  encodeInstructionData,
  buildTransactionInstruction,
  sendTransaction,
  executeCustomProgram,
  executeNitronProgram,
  batchExecuteCustomProgram
};
