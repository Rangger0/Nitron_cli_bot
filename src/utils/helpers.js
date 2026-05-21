const fs = require("fs");
const path = require("path");

/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Generate random name with specified length
 */
function randomName(len = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

/**
 * Generate random number between min and max (inclusive)
 */
function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Validate secret key format (should be 64 bytes)
 */
function validateSecretKey(secretKeyArray) {
  if (!Array.isArray(secretKeyArray) || secretKeyArray.length !== 64) {
    throw new Error("Invalid secret key format. Expected 64 bytes array.");
  }
  return true;
}

/**
 * Load JSON file safely
 */
function loadJsonFile(filePath) {
  try {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }
    const content = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(content);
  } catch (error) {
    throw new Error(`Failed to load JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Save JSON file safely
 */
function saveJsonFile(filePath, data) {
  try {
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf-8");
    return true;
  } catch (error) {
    throw new Error(`Failed to save JSON file ${filePath}: ${error.message}`);
  }
}

/**
 * Get all files in a directory
 */
function getFilesInDirectory(dirPath, extension = ".json") {
  try {
    if (!fs.existsSync(dirPath)) {
      return [];
    }
    return fs.readdirSync(dirPath)
      .filter(file => file.endsWith(extension))
      .map(file => path.join(dirPath, file));
  } catch (error) {
    throw new Error(`Failed to read directory ${dirPath}: ${error.message}`);
  }
}

/**
 * Get random file from directory
 */
function getRandomFileFromDirectory(dirPath, extension = "") {
  try {
    if (!fs.existsSync(dirPath)) {
      throw new Error(`Directory not found: ${dirPath}`);
    }
    const files = fs.readdirSync(dirPath)
      .filter(file => !extension || file.endsWith(extension));
    
    if (files.length === 0) {
      throw new Error(`No files found in ${dirPath}`);
    }
    return path.join(dirPath, files[Math.floor(Math.random() * files.length)]);
  } catch (error) {
    throw new Error(`Failed to get random file: ${error.message}`);
  }
}

/**
 * Format lamports to SOL
 */
function lamportsToSol(lamports) {
  return lamports / 1e9;
}

/**
 * Format SOL to lamports
 */
function solToLamports(sol) {
  return Math.floor(sol * 1e9);
}

/**
 * Truncate address for display
 */
function truncateAddress(address, chars = 4) {
  return `${address.slice(0, chars)}...${address.slice(-chars)}`;
}

/**
 * Execute function with exponential backoff retry
 */
async function withRetry(
  fn,
  maxAttempts = 3,
  initialDelayMs = 1000,
  onRetry = null
) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxAttempts) {
        const delayMs = initialDelayMs * Math.pow(2, attempt - 1);
        if (onRetry) {
          onRetry(attempt, maxAttempts, error);
        }
        await sleep(delayMs);
      }
    }
  }
  
  throw lastError;
}

/**
 * Execute array of promises in batches
 */
async function batchExecute(
  tasks,
  batchSize = 5,
  delayMs = 500,
  onBatchComplete = null
) {
  const results = [];
  
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch);
    results.push(...batchResults);
    
    if (onBatchComplete) {
      onBatchComplete(Math.min(i + batchSize, tasks.length), tasks.length);
    }
    
    // Delay between batches (except for the last one)
    if (i + batchSize < tasks.length) {
      await sleep(delayMs);
    }
  }
  
  return results;
}

module.exports = {
  sleep,
  randomName,
  randomNumber,
  validateSecretKey,
  loadJsonFile,
  saveJsonFile,
  getFilesInDirectory,
  getRandomFileFromDirectory,
  lamportsToSol,
  solToLamports,
  truncateAddress,
  withRetry,
  batchExecute
};
