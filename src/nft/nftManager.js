const { randomName, randomNumber, sleep } = require("../utils/helpers");
const fs = require("fs");
const path = require("path");
const config = require("../config/config");

/**
 * Create NFT metadata
 */
function createNFTMetadata(name, symbol = "NFT", uri = "", description = "", image = "") {
  return {
    name: name || randomName(8),
    symbol: symbol,
    uri: uri || `https://placeholder.ipfs.io/ipfs/QmPlaceholder${randomNumber(1000, 9999)}`,
    description: description || `Nitron NFT #${randomNumber(1, 10000)}`,
    image: image || "https://via.placeholder.com/200",
    attributes: [
      {
        trait_type: "Creator",
        value: "Alpha Bot"
      },
      {
        trait_type: "Created",
        value: new Date().toISOString()
      }
    ]
  };
}

/**
 * Generate random NFT name
 */
function generateRandomNFTName(prefix = "Nitron") {
  const adjectives = ["Cosmic", "Stellar", "Quantum", "Digital", "Virtual", "Neo"];
  const nouns = ["Phoenix", "Dragon", "Enigma", "Cipher", "Pulse", "Nova"];
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const number = randomNumber(1, 999);
  
  return `${prefix} ${adjective} ${noun} #${number}`;
}

/**
 * Get random image file from folder
 */
function getRandomImagePath(imagesFolder = config.nftImagesFolder) {
  try {
    if (!fs.existsSync(imagesFolder)) {
      return null; // No images folder
    }

    const imageExtensions = [".png", ".jpg", ".jpeg", ".gif", ".webp"];
    const files = fs.readdirSync(imagesFolder)
      .filter(file => imageExtensions.some(ext => file.toLowerCase().endsWith(ext)));

    if (files.length === 0) {
      return null;
    }

    const randomFile = files[Math.floor(Math.random() * files.length)];
    return path.join(imagesFolder, randomFile);
  } catch (error) {
    console.warn(`Failed to get random image: ${error.message}`);
    return null;
  }
}

/**
 * Upload metadata to IPFS (placeholder function)
 * In production, use Pinata, NFT.storage, or similar
 */
async function uploadMetadataToIPFS(metadata, logger = null) {
  try {
    // Placeholder implementation
    if (config.ipfsPlaceholder) {
      if (logger) {
        logger.info("Uploading metadata to IPFS (placeholder)...");
      }

      // Simulate network delay
      await sleep(500);

      const ipfsHash = `Qm${randomName(44)}`;
      const uri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      if (logger) {
        logger.success("Metadata uploaded", uri);
      }

      return {
        hash: ipfsHash,
        uri: uri
      };
    }

    throw new Error("IPFS upload not configured. Set IPFS_PLACEHOLDER=true in .env or implement real IPFS upload");
  } catch (error) {
    throw new Error(`Failed to upload metadata to IPFS: ${error.message}`);
  }
}

/**
 * Upload image to IPFS (placeholder function)
 */
async function uploadImageToIPFS(imagePath, logger = null) {
  try {
    if (!imagePath || !fs.existsSync(imagePath)) {
      return null;
    }

    // Placeholder implementation
    if (config.ipfsPlaceholder) {
      if (logger) {
        logger.info("Uploading image to IPFS (placeholder)...");
      }

      await sleep(300);

      const ipfsHash = `Qm${randomName(44)}`;
      const uri = `https://gateway.pinata.cloud/ipfs/${ipfsHash}`;

      if (logger) {
        logger.success("Image uploaded", uri);
      }

      return {
        hash: ipfsHash,
        uri: uri
      };
    }

    return null;
  } catch (error) {
    throw new Error(`Failed to upload image to IPFS: ${error.message}`);
  }
}

/**
 * Create NFT with metadata
 * Note: This is a placeholder for actual NFT creation
 * Real implementation would use Metaplex or similar
 */
async function createNFT(
  connection,
  wallet,
  name,
  symbol = "NFT",
  uri = "",
  logger = null
) {
  try {
    if (logger) {
      logger.info(`Creating NFT: ${name}`);
    }

    const metadata = createNFTMetadata(name, symbol, uri);

    // Upload metadata to IPFS
    const ipfsResult = await uploadMetadataToIPFS(metadata, logger);

    if (logger) {
      logger.success("NFT metadata created", ipfsResult.uri);
    }

    return {
      name,
      symbol,
      uri: ipfsResult.uri,
      metadata,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    throw new Error(`Failed to create NFT: ${error.message}`);
  }
}

/**
 * Batch create NFTs
 */
async function batchCreateNFTs(
  connection,
  wallet,
  count,
  logger = null,
  includeImages = false
) {
  const nfts = [];

  for (let i = 0; i < count; i++) {
    try {
      if (logger) {
        logger.info(`Creating NFT ${i + 1}/${count}...`);
      }

      const name = generateRandomNFTName();
      const imagePath = includeImages ? getRandomImagePath() : null;
      const imageIPFS = imagePath ? await uploadImageToIPFS(imagePath, logger) : null;

      const nft = await createNFT(
        connection,
        wallet,
        name,
        "NITRON",
        imageIPFS?.uri || "",
        logger
      );

      nfts.push(nft);

      if (i < count - 1) {
        await sleep(config.txDelayMs);
      }
    } catch (error) {
      if (logger) {
        logger.error(`Failed to create NFT ${i + 1}/${count}: ${error.message}`);
      }
      throw error;
    }
  }

  return nfts;
}

module.exports = {
  createNFTMetadata,
  generateRandomNFTName,
  getRandomImagePath,
  uploadMetadataToIPFS,
  uploadImageToIPFS,
  createNFT,
  batchCreateNFTs
};
