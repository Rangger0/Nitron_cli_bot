const crypto = require("crypto");
const {
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction
} = require("@solana/web3.js");
const { withRetry } = require("../utils/helpers");
const config = require("../config/config");

const MPL_CORE_PROGRAM_ID = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");
const NETRUN_PROGRAM_ID = new PublicKey("FqDHFYCYfLadhHjEkbsxTmNmW4f2kMb6Pxf2sSFoRn1G");
const NETRUN_CONFIG_ACCOUNT = new PublicKey("4N57F7UgJkYVkWFDChP6hXN7LrzaFoek6ux52H5Ttrwf");
const CREATE_IMPRINT_DISCRIMINATOR = Buffer.from("23ff5d2a8ff5fcfa", "hex");

function writeU32LE(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32LE(value, 0);
  return buffer;
}

function writeString(value) {
  const data = Buffer.from(value || "", "utf8");
  return Buffer.concat([writeU32LE(data.length), data]);
}

function normalizeImageCid(value) {
  if (!value) {
    return config.netrun.imageCid;
  }

  const trimmed = value.trim();
  const marker = "/ipfs/";
  const markerIndex = trimmed.indexOf(marker);
  if (markerIndex >= 0) {
    return trimmed.slice(markerIndex + marker.length).split(/[/?#]/u)[0];
  }

  if (trimmed.startsWith("ipfs://")) {
    return trimmed.slice("ipfs://".length).split(/[/?#]/u)[0];
  }

  return trimmed;
}

function buildNetrunMetadata({ name, symbol, imageCid, description }) {
  const cid = normalizeImageCid(imageCid);
  const image = `https://cdn.netrun.xyz/ipfs/${cid}`;

  return {
    name,
    symbol,
    description: description || config.netrun.description,
    image,
    attributes: [
      { trait_type: "protocol", value: "netrun" },
      { trait_type: "type", value: "nft" },
      { trait_type: "edition", value: "1/1" }
    ]
  };
}

function metadataToDataUri(metadata) {
  const json = JSON.stringify(metadata);
  return `data:application/json;base64,${Buffer.from(json, "utf8").toString("base64")}`;
}

function buildMplCoreCreateV2Instruction({ asset, payer, name, uri }) {
  const data = Buffer.concat([
    Buffer.from([20, 0]),
    writeString(name),
    writeString(uri),
    Buffer.from([1, 0, 0, 0, 0, 1, 0, 0, 0, 0])
  ]);

  return new TransactionInstruction({
    programId: MPL_CORE_PROGRAM_ID,
    keys: [
      { pubkey: asset.publicKey, isSigner: true, isWritable: true },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false }
    ],
    data
  });
}

function getImprintAddress(assetPublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("imprint"), assetPublicKey.toBuffer()],
    NETRUN_PROGRAM_ID
  )[0];
}

function buildCreateImprintInstruction({ asset, payer, name, imageCid }) {
  const imprint = getImprintAddress(asset.publicKey);
  const cidHash = crypto.createHash("sha256").update(normalizeImageCid(imageCid)).digest();
  const data = Buffer.concat([
    CREATE_IMPRINT_DISCRIMINATOR,
    writeString(name),
    cidHash
  ]);

  return new TransactionInstruction({
    programId: NETRUN_PROGRAM_ID,
    keys: [
      { pubkey: NETRUN_CONFIG_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: imprint, isSigner: false, isWritable: true },
      { pubkey: asset.publicKey, isSigner: true, isWritable: true },
      { pubkey: payer.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false }
    ],
    data
  });
}

async function createNetrunImprint(
  connection,
  wallet,
  options = {},
  logger = null
) {
  const name = options.name || `${config.netrun.nftName}-${randomName(6)}`;
  const symbol = options.symbol || config.netrun.symbol;
  const imageCid = normalizeImageCid(options.imageCid || options.imageUri || config.netrun.imageCid);
  const metadata = buildNetrunMetadata({
    name,
    symbol,
    imageCid,
    description: options.description
  });
  const uri = options.metadataUri || metadataToDataUri(metadata);
  const asset = Keypair.generate();
  const imprint = getImprintAddress(asset.publicKey);

  // Deterministic debug info to compare with on-chain / indexer expectations
  const cidHash = crypto
    .createHash("sha256")
    .update(normalizeImageCid(options.imageCid || options.imageUri || config.netrun.imageCid))
    .digest("hex");

  if (logger) {
    logger.info("[NetrunImprint Debug] Inputs");
    logger.info(`  name: ${name}`);
    logger.info(`  symbol: ${symbol}`);
    logger.info(`  imageCid(normalized): ${imageCid}`);
    logger.info(`  imprintPDA: ${imprint.toBase58()}`);
    logger.info(`  asset(publicKey): ${asset.publicKey.toBase58()}`);
    logger.info(`  cidHash(sha256 hex): ${cidHash}`);
    logger.info(`  metadata.uri(data uri prefix): ${uri.slice(0, 80)}...`);
  }


  const transaction = new Transaction();
  transaction.add(buildMplCoreCreateV2Instruction({ asset, payer: wallet, name, uri }));
  transaction.add(buildCreateImprintInstruction({ asset, payer: wallet, name, imageCid }));

  const signature = await withRetry(
    () => sendAndConfirmTransaction(connection, transaction, [wallet, asset], {
      commitment: "confirmed"
    }),
    config.retryAttempts,
    config.retryDelayMs,
    (attempt, maxAttempts) => {
      if (logger) logger.retry(attempt, maxAttempts);
    }
  );

  if (logger) {
    logger.tx(signature);
    logger.success("Netrun imprint created", asset.publicKey.toBase58());
  }

  return {
    name,
    symbol,
    uri,
    imageCid,
    asset: asset.publicKey.toBase58(),
    imprint: imprint.toBase58(),
    signature,
    explorer: `https://solscan.io/tx/${signature}?cluster=devnet`,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  buildNetrunMetadata,
  metadataToDataUri,
  getImprintAddress,
  buildMplCoreCreateV2Instruction,
  buildCreateImprintInstruction,
  createNetrunImprint
};
