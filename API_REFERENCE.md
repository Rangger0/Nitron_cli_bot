# API Reference - Nitron CLI Modules

## Table of Contents

1. [Wallet Manager](#wallet-manager)
2. [Token Manager](#token-manager)
3. [NFT Manager](#nft-manager)
4. [Program Manager](#program-manager)
5. [Helpers](#helpers)
6. [Logger](#logger)
7. [RPC Utils](#rpc-utils)

---

## Wallet Manager

**File**: `src/wallet/walletManager.js`

Handles wallet loading, validation, and management.

### `loadWallet(walletPath)`

Load a single wallet from JSON file.

```javascript
const { loadWallet } = require("./src/wallet/walletManager");

const wallet = loadWallet("./wallet.json");
console.log(wallet.publicKey.toBase58());
```

**Parameters:**
- `walletPath` (string): Path to wallet JSON file

**Returns:**
- `Keypair`: Solana keypair object

**Throws:**
- `Error`: If file not found or invalid format

---

### `loadMultipleWallets(walletsFolderPath)`

Load multiple wallets from a folder.

```javascript
const { loadMultipleWallets } = require("./src/wallet/walletManager");

const wallets = loadMultipleWallets("./wallets");
wallets.forEach(w => {
  console.log(w.publicKey);
});
```

**Parameters:**
- `walletsFolderPath` (string): Path to folder containing wallet.json files

**Returns:**
- `Array`: Array of wallet objects with `{ file, keypair, publicKey }`

---

### `getWalletInfo(keypair)`

Get wallet information from keypair.

```javascript
const { getWalletInfo } = require("./src/wallet/walletManager");

const info = getWalletInfo(wallet);
console.log(info.publicKey);
```

**Parameters:**
- `keypair` (Keypair): Solana keypair

**Returns:**
- `Object`: `{ publicKey, secretKey, isValid }`

---

## Token Manager

**File**: `src/token/tokenManager.js`

Manage SPL token creation, minting, and operations.

### `createToken(connection, wallet, decimals, logger)`

Create a new SPL token.

```javascript
const { createToken } = require("./src/token/tokenManager");
const { getConnection } = require("./src/utils/rpc");

const connection = getConnection("devnet");
const wallet = loadWallet("./wallet.json");

const mint = await createToken(connection, wallet, 9, logger);
console.log(mint.toBase58());
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `decimals` (number): Token decimals (default: 9)
- `logger` (Logger, optional): Logger instance

**Returns:**
- `PublicKey`: Mint address

---

### `createAssociatedTokenAccount(connection, wallet, mint, owner, logger)`

Create or get associated token account.

```javascript
const { createAssociatedTokenAccount } = require("./src/token/tokenManager");

const tokenAccount = await createAssociatedTokenAccount(
  connection,
  wallet,
  mintPublicKey,
  ownerPublicKey
);

console.log(tokenAccount.address.toBase58());
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet with funds
- `mint` (PublicKey): Token mint address
- `owner` (PublicKey, optional): Token account owner
- `logger` (Logger, optional): Logger instance

**Returns:**
- `Account`: Associated token account

---

### `mintTokens(connection, wallet, mint, destination, amount, decimals, logger)`

Mint tokens to destination account.

```javascript
const { mintTokens } = require("./src/token/tokenManager");

const signature = await mintTokens(
  connection,
  wallet,
  mintPublicKey,
  destinationAddress,
  1000,
  9
);

console.log(signature);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Mint authority
- `mint` (PublicKey): Token mint
- `destination` (PublicKey): Destination token account
- `amount` (number): Amount to mint
- `decimals` (number): Token decimals (default: 9)
- `logger` (Logger, optional): Logger instance

**Returns:**
- `string`: Transaction signature

---

### `batchCreateTokens(connection, wallet, count, decimals, logger, randomNames)`

Create multiple tokens with delays and retry logic.

```javascript
const { batchCreateTokens } = require("./src/token/tokenManager");

const tokens = await batchCreateTokens(
  connection,
  wallet,
  5,    // count
  9,    // decimals
  logger,
  true  // randomNames
);

tokens.forEach(t => console.log(t.mint));
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `count` (number): Number of tokens to create
- `decimals` (number, optional): Token decimals
- `logger` (Logger, optional): Logger instance
- `randomNames` (boolean, optional): Generate random names

**Returns:**
- `Array`: Array of created tokens with `{ name, mint, index }`

---

### `batchMintTokens(connection, wallet, mint, destination, count, amountPerMint, decimals, logger)`

Mint tokens multiple times.

```javascript
const { batchMintTokens } = require("./src/token/tokenManager");

const signatures = await batchMintTokens(
  connection,
  wallet,
  mintPublicKey,
  destinationAddress,
  5,    // count
  1000  // amount per mint
);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Mint authority
- `mint` (PublicKey): Token mint
- `destination` (PublicKey): Destination account
- `count` (number): Number of mint operations
- `amountPerMint` (number, optional): Amount per mint (default: 1000)
- `decimals` (number, optional): Token decimals
- `logger` (Logger, optional): Logger instance

**Returns:**
- `Array`: Array of transaction signatures

---

## NFT Manager

**File**: `src/nft/nftManager.js`

Create and manage NFT metadata.

### `createNFTMetadata(name, symbol, uri, description, image)`

Create NFT metadata object.

```javascript
const { createNFTMetadata } = require("./src/nft/nftManager");

const metadata = createNFTMetadata(
  "My NFT",
  "NITRON",
  "https://ipfs.io/ipfs/QmHash",
  "My awesome NFT",
  "https://image.url"
);

console.log(metadata);
```

**Parameters:**
- `name` (string): NFT name
- `symbol` (string, optional): NFT symbol
- `uri` (string, optional): Metadata URI
- `description` (string, optional): NFT description
- `image` (string, optional): Image URL

**Returns:**
- `Object`: NFT metadata object

---

### `generateRandomNFTName(prefix)`

Generate random NFT name.

```javascript
const { generateRandomNFTName } = require("./src/nft/nftManager");

const name = generateRandomNFTName("Nitron");
console.log(name); // "Nitron Cosmic Phoenix #543"
```

**Parameters:**
- `prefix` (string, optional): Name prefix

**Returns:**
- `string`: Random NFT name

---

### `uploadMetadataToIPFS(metadata, logger)`

Upload metadata to IPFS.

```javascript
const { uploadMetadataToIPFS } = require("./src/nft/nftManager");

const result = await uploadMetadataToIPFS(metadata, logger);
console.log(result.uri);
```

**Parameters:**
- `metadata` (Object): NFT metadata object
- `logger` (Logger, optional): Logger instance

**Returns:**
- `Object`: `{ hash, uri }`

---

### `createNFT(connection, wallet, name, symbol, uri, logger)`

Create NFT with metadata.

```javascript
const { createNFT } = require("./src/nft/nftManager");

const nft = await createNFT(
  connection,
  wallet,
  "My NFT",
  "NITRON",
  "",
  logger
);

console.log(nft);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `name` (string): NFT name
- `symbol` (string, optional): NFT symbol
- `uri` (string, optional): Metadata URI
- `logger` (Logger, optional): Logger instance

**Returns:**
- `Object`: Created NFT object with metadata

---

### `batchCreateNFTs(connection, wallet, count, logger, includeImages)`

Create multiple NFTs.

```javascript
const { batchCreateNFTs } = require("./src/nft/nftManager");

const nfts = await batchCreateNFTs(
  connection,
  wallet,
  10,
  logger,
  true  // includeImages
);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `count` (number): Number of NFTs to create
- `logger` (Logger, optional): Logger instance
- `includeImages` (boolean, optional): Include random images

**Returns:**
- `Array`: Array of created NFTs

---

## Program Manager

**File**: `src/program/programManager.js`

Interact with custom Solana programs.

### `buildTransactionInstruction(programId, accounts, instructionData)`

Build transaction instruction.

```javascript
const { buildTransactionInstruction } = require("./src/program/programManager");

const instruction = buildTransactionInstruction(
  "FqDHFYCYfLadhHjEkbsxTmNmW4f2kMb6Pxf2sSFoRn1G",
  ["4N57F7UgJkYVkWFDChP6hXN7LrzaFoek6ux52H5Ttrwf", ...],
  "csGjuqA4Oe9Ohf9Fvs6FwiOB9uJwZg7F4q68wvuGLwT4..."
);
```

**Parameters:**
- `programId` (string): Program ID
- `accounts` (Array): Array of account addresses
- `instructionData` (string|Buffer): Instruction data (base58 or buffer)

**Returns:**
- `TransactionInstruction`: Built instruction

---

### `executeCustomProgram(connection, wallet, programId, accounts, instructionData, logger)`

Execute custom program instruction.

```javascript
const { executeCustomProgram } = require("./src/program/programManager");

const signature = await executeCustomProgram(
  connection,
  wallet,
  programId,
  accounts,
  instructionData,
  logger
);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `programId` (string): Program ID
- `accounts` (Array): Account addresses
- `instructionData` (string|Buffer): Instruction data
- `logger` (Logger, optional): Logger instance

**Returns:**
- `string`: Transaction signature

---

### `executeNitronProgram(connection, wallet, logger)`

Execute default Nitron program.

```javascript
const { executeNitronProgram } = require("./src/program/programManager");

const signature = await executeNitronProgram(connection, wallet, logger);
```

**Parameters:**
- `connection` (Connection): Solana RPC connection
- `wallet` (Keypair): Wallet keypair
- `logger` (Logger, optional): Logger instance

**Returns:**
- `string`: Transaction signature

---

## Helpers

**File**: `src/utils/helpers.js`

Utility functions for common operations.

### `sleep(ms)`

Sleep for specified milliseconds.

```javascript
const { sleep } = require("./src/utils/helpers");

await sleep(1000);
console.log("1 second later");
```

---

### `randomName(len)`

Generate random name.

```javascript
const { randomName } = require("./src/utils/helpers");

const name = randomName(8);
console.log(name); // "ABCDEFGH"
```

---

### `withRetry(fn, maxAttempts, initialDelayMs, onRetry)`

Execute function with retry logic.

```javascript
const { withRetry } = require("./src/utils/helpers");

const result = await withRetry(
  async () => createToken(connection, wallet, 9),
  3,      // maxAttempts
  1000,   // initialDelayMs
  (attempt, max) => console.log(`Attempt ${attempt}/${max}`)
);
```

---

### `batchExecute(tasks, batchSize, delayMs, onBatchComplete)`

Execute array of tasks in batches.

```javascript
const { batchExecute } = require("./src/utils/helpers");

const tasks = Array.from({ length: 10 }, () => () => fetchData());

const results = await batchExecute(
  tasks,
  5,     // batchSize
  500,   // delayMs
  (completed, total) => console.log(`${completed}/${total}`)
);
```

---

## Logger

**File**: `src/utils/logger.js`

Colored console logging.

### Methods

```javascript
const Logger = require("./src/utils/logger");
const logger = new Logger("info");

logger.success("Operation successful", "details");   // Green ✅
logger.error("Operation failed", "details");          // Red ❌
logger.info("Information", "details");                // Blue
logger.warn("Warning", "details");                    // Yellow
logger.tx("signature");                               // Cyan 📋
logger.header("Section Title");                       // Cyan header 🚀
logger.divider();                                      // Gray divider
```

---

## RPC Utils

**File**: `src/utils/rpc.js`

Solana RPC connection utilities.

### `getConnection(network)`

Get Solana RPC connection.

```javascript
const { getConnection } = require("./src/utils/rpc");

const connection = getConnection("devnet");
const version = await connection.getVersion();
```

**Parameters:**
- `network` (string): Network name (devnet, testnet, mainnet-beta)

**Returns:**
- `Connection`: Solana RPC connection

---

### `getBalance(connection, publicKey)`

Get wallet balance in lamports.

```javascript
const { getBalance } = require("./src/utils/rpc");

const balance = await getBalance(connection, wallet.publicKey);
console.log(balance / 1e9); // SOL
```

---

## Complete Example

```javascript
const { loadWallet } = require("./src/wallet/walletManager");
const { createToken, batchCreateTokens } = require("./src/token/tokenManager");
const { getConnection, getBalance } = require("./src/utils/rpc");
const Logger = require("./src/utils/logger");

async function main() {
  const logger = new Logger("info");

  try {
    // Load wallet
    const wallet = loadWallet("./wallet.json");
    logger.success("Wallet loaded", wallet.publicKey.toBase58());

    // Get connection
    const connection = getConnection("devnet");
    logger.success("Connected to devnet");

    // Check balance
    const balance = await getBalance(connection, wallet.publicKey);
    logger.info(`Balance: ${balance / 1e9} SOL`);

    // Create tokens
    const tokens = await batchCreateTokens(
      connection,
      wallet,
      5,
      9,
      logger,
      true
    );

    logger.success(`Created ${tokens.length} tokens`);
    tokens.forEach((t) => logger.info(`Token: ${t.mint}`));
  } catch (error) {
    logger.error(error.message);
  }
}

main();
```

---

For more examples, see the CLI command files in `src/cli/`.
