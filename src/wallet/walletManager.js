const { Keypair } = require("@solana/web3.js");
const fs = require("fs");
const path = require("path");
const bs58 = require("bs58").default;
const { validateSecretKey, getFilesInDirectory } = require("../utils/helpers");
const config = require("../config/config");

/**
 * Decode a base58 private key exported from wallet apps.
 */
function decodeBase58SecretKey(value) {
  try {
    const decoded = Array.from(bs58.decode(value));
    validateSecretKey(decoded);
    return decoded;
  } catch (error) {
    throw new Error("Invalid base58 private key. Expected a Solana 64-byte secret key.");
  }
}

/**
 * Extract a secret key from common wallet file formats.
 */
function secretKeyFromParsed(parsed) {
  if (Array.isArray(parsed)) {
    validateSecretKey(parsed);
    return parsed;
  }

  if (typeof parsed === "string") {
    return decodeBase58SecretKey(parsed.trim());
  }

  if (parsed && typeof parsed === "object") {
    const candidates = [
      parsed.secretKey,
      parsed.privateKey,
      parsed.keypair?.secretKey,
      parsed.wallet?.secretKey
    ].filter(Boolean);

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        validateSecretKey(candidate);
        return candidate;
      }

      if (typeof candidate === "string") {
        return decodeBase58SecretKey(candidate.trim());
      }
    }
  }

  throw new Error("Unsupported wallet format. Use a 64-byte JSON array or a base58 private key string.");
}

/**
 * Parse wallet file. Supports Solana CLI JSON arrays and raw base58 private keys.
 */
function loadSecretKey(walletPath = config.walletPath) {
  try {
    if (!fs.existsSync(walletPath)) {
      throw new Error(`File not found: ${walletPath}`);
    }

    const content = fs.readFileSync(walletPath, "utf-8").trim();

    if (!content) {
      throw new Error(`Wallet file is empty: ${walletPath}`);
    }

    try {
      return secretKeyFromParsed(JSON.parse(content));
    } catch (jsonError) {
      const lines = content
        .split(/\r?\n/u)
        .map((line) => line.trim().replace(/^["']|["',]$/g, ""))
        .filter(Boolean);

      const decodableLines = [];
      for (const line of lines) {
        try {
          decodableLines.push(decodeBase58SecretKey(line));
        } catch (error) {
          // It may be one wrapped key split across multiple lines.
        }
      }

      if (decodableLines.length === 1) {
        return decodableLines[0];
      }

      if (decodableLines.length > 1) {
        throw new Error("Multiple private keys found in one wallet file. Put one wallet per .json file.");
      }

      return decodeBase58SecretKey(content.replace(/\s+/g, ""));
    }
  } catch (error) {
    throw new Error(`Failed to load wallet file ${walletPath}: ${error.message}`);
  }
}

/**
 * Load wallet from file.
 */
function loadWallet(walletPath = config.walletPath) {
  try {
    const secretKeyArray = loadSecretKey(walletPath);
    return Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
  } catch (error) {
    throw new Error(`Failed to load wallet: ${error.message}`);
  }
}

/**
 * Load multiple wallets from a folder
 */
function loadMultipleWallets(walletsFolderPath = config.walletsFolderPath) {
  try {
    const walletFiles = getFilesInDirectory(walletsFolderPath, ".json")
      .filter((walletFile) => !path.basename(walletFile).startsWith("."));
    
    if (walletFiles.length === 0) {
      throw new Error(
        `No wallet files found in ${walletsFolderPath}. ` +
          `Expected one or more Solana wallet files in JSON format (*.json). ` +
          `Example: ./wallets/wallet1.json, ./wallets/wallet2.json`
      );
    }

    const wallets = [];
    for (const walletFile of walletFiles) {
      try {
        const secretKeyArray = loadSecretKey(walletFile);
        const keypair = Keypair.fromSecretKey(Uint8Array.from(secretKeyArray));
        wallets.push({
          file: walletFile,
          keypair,
          publicKey: keypair.publicKey.toBase58()
        });
      } catch (error) {
        console.warn(`Failed to load wallet from ${walletFile}: ${error.message}`);
      }
    }

    if (wallets.length === 0) {
      throw new Error("No valid wallets could be loaded");
    }

    return wallets;
  } catch (error) {
    throw new Error(`Failed to load multiple wallets: ${error.message}`);
  }
}

/**
 * Get wallet info
 */
function getWalletInfo(keypair) {
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: Array.from(keypair.secretKey),
    isValid: true
  };
}

module.exports = {
  loadWallet,
  loadMultipleWallets,
  loadSecretKey,
  getWalletInfo
};
