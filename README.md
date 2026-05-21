# Nitron CLI - Production-Ready Solana CLI Tool

A comprehensive, modular, production-oriented Node.js CLI tool for Solana blockchain operations. Build, manage, and execute token and NFT operations with ease.

## Features

### ✅ Core Features

- **Wallet Management**
  - Load wallet from JSON file (64-byte secret key)
  - Support multiple wallets from a folder
  - Validate key format and security checks

- **Network Operations**
  - Default to Solana devnet with CLI flag support
  - Switch between devnet, testnet, and mainnet-beta
  - Health checks and balance verification

- **Token Operations**
  - Create SPL tokens (mint)
  - Create associated token accounts
  - Mint tokens to wallets
  - Batch token creation with exponential backoff
  - Configurable delays between transactions

- **NFT Operations**
  - Create NFT metadata (name, URI, attributes)
  - Random name generation
  - Image selection from local folder
  - IPFS metadata upload (placeholder + real implementation ready)
  - Batch NFT creation

- **Custom Program Interaction**
  - Build and send custom program instructions
  - Base58 instruction data encoding/decoding
  - Transactions with retry logic
  - Direct program invocation

- **Advanced Features**
  - Batch execution with configurable parallelism
  - Multi-wallet loop execution
  - Daily scheduler for automated operations
  - Error handling with detailed messages
  - Transaction retry with exponential backoff
  - Colored logs (success, error, info, warning)

## Installation

### Prerequisites

- **Node.js**: v16 or higher
- **npm**: v7 or higher
- **Solana Wallet**: JSON file with secret key

### Setup

1. **Clone the project**
   ```bash
   cd /home/rose-alpha/bot/nitron
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create environment file**
   ```bash
   cp .env.example .env
   ```

4. **Configure .env**
   ```ini
   NETWORK=devnet
   WALLET_PATH=./wallet.json
   TX_DELAY_MS=1500
   RETRY_ATTEMPTS=3
   ```

5. **Link globally (optional)**
   ```bash
   npm link
   # Now use: nitron [command]
   ```

## Quick Start

### Basic Token Creation

```bash
node src/index.js create-token --wallet wallet.json --network devnet
```

### Create Multiple Tokens

```bash
node src/index.js batch-tokens --wallet wallet.json --count 5 --delay 1500
```

### Mint Tokens

```bash
node src/index.js mint \
  --wallet wallet.json \
  --mint <MINT_ADDRESS> \
  --amount 1000 \
  --decimals 9
```

### Create NFT

```bash
node src/index.js create-nft \
  --wallet wallet.json \
  --name "My First NFT" \
  --symbol "NITRON"
```

### Batch Create NFTs

```bash
node src/index.js batch-nfts \
  --wallet wallet.json \
  --count 10 \
  --images
```

### Execute Custom Program

```bash
node src/index.js run-custom --wallet wallet.json
```

### Batch Multiple Operations

```bash
node src/index.js batch \
  --wallet wallet.json \
  --operations token,nft,custom \
  --count 5 \
  --batch 3
```

### Multi-Wallet Execution

```bash
node src/index.js multi-wallet \
  --folder ./wallets \
  --operation token \
  --count 3
```

### Daily Scheduler

```bash
node src/index.js scheduler \
  --wallet wallet.json \
  --operations token,nft \
  --time 09:00
```

## Commands Reference

### Token Commands

#### `create-token`
Create a single SPL token.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --decimals <number>  Token decimals (default: 9)
  --network <network>  Solana network (default: devnet)
```

#### `batch-tokens`
Create multiple SPL tokens with delays.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --count <number>     Number of tokens (default: 2)
  --decimals <number>  Token decimals (default: 9)
  --delay <ms>         Delay between txs (default: 1500)
  --network <network>  Solana network (default: devnet)
```

#### `mint`
Mint tokens to a wallet.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --mint <address>     Mint address (required)
  --amount <number>    Amount to mint (default: 1000)
  --decimals <number>  Token decimals (default: 9)
  --network <network>  Solana network (default: devnet)
```

### NFT Commands

#### `create-nft`
Create a single NFT with metadata.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --name <name>        NFT name
  --symbol <symbol>    NFT symbol (default: NITRON)
  --uri <uri>          Metadata URI
  --images             Use random image
  --network <network>  Solana network (default: devnet)
```

#### `batch-nfts`
Create multiple NFTs.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --count <number>     Number of NFTs (default: 2)
  --images             Include random images
  --network <network>  Solana network (default: devnet)
```

### Program Commands

#### `run-custom`
Execute custom program instruction.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --program <id>       Program ID
  --count <number>     Executions (default: 1)
  --network <network>  Solana network (default: devnet)
```

#### `batch`
Batch execute multiple operations.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --operations <ops>   token,nft,custom (default: token)
  --count <number>     Count per operation (default: 1)
  --batch <size>       Batch size (default: 5)
  --network <network>  Solana network (default: devnet)
```

#### `multi-wallet`
Execute across multiple wallets.

```bash
Options:
  --folder <path>      Wallets folder path
  --operation <op>     token or custom (default: token)
  --count <number>     Count per wallet (default: 1)
  --network <network>  Solana network (default: devnet)
```

#### `scheduler`
Start daily scheduler.

```bash
Options:
  --wallet <path>      Wallet JSON file path
  --operations <ops>   token,nft,custom (default: token)
  --time <time>        Execution time HH:MM (default: 09:00)
  --network <network>  Solana network (default: devnet)
```

## Environment Variables

Create a `.env` file in the root directory:

```ini
# Network Configuration
NETWORK=devnet
# RPC_ENDPOINT=https://api.devnet.solana.com

# Wallet Configuration
WALLET_PATH=./wallet.json
WALLETS_FOLDER=./wallets

# Transaction Settings
TX_DELAY_MS=1500
RETRY_ATTEMPTS=3
RETRY_DELAY_MS=3000

# Batch Settings
BATCH_SIZE=5
BATCH_DELAY_MS=500

# NFT Settings
NFT_IMAGES_FOLDER=./images
IPFS_PLACEHOLDER=true

# Logging
LOG_LEVEL=info
```

## Project Structure

```
nitron-cli/
├── src/
│   ├── cli/                    # CLI commands
│   │   ├── tokenCommands.js
│   │   ├── nftCommands.js
│   │   ├── programCommands.js
│   │   └── scheduler.js
│   ├── wallet/                 # Wallet management
│   │   └── walletManager.js
│   ├── token/                  # Token operations
│   │   └── tokenManager.js
│   ├── nft/                    # NFT operations
│   │   └── nftManager.js
│   ├── program/                # Program interaction
│   │   └── programManager.js
│   ├── utils/                  # Utilities
│   │   ├── logger.js
│   │   ├── helpers.js
│   │   └── rpc.js
│   ├── config/                 # Configuration
│   │   └── config.js
│   └── index.js                # Main entry point
├── package.json
├── .env.example
└── README.md
```

## Module Documentation

### `walletManager.js`
Handles wallet loading and validation.

- `loadWallet(walletPath)` - Load single wallet
- `loadMultipleWallets(folderPath)` - Load multiple wallets
- `getWalletInfo(keypair)` - Get wallet information

### `tokenManager.js`
Token creation and management.

- `createToken(connection, wallet, decimals)` - Create token
- `createAssociatedTokenAccount(connection, wallet, mint)` - Create token account
- `mintTokens(connection, wallet, mint, destination, amount)` - Mint tokens
- `batchCreateTokens(connection, wallet, count)` - Create multiple tokens

### `nftManager.js`
NFT creation and metadata.

- `createNFTMetadata(name, symbol, uri)` - Create metadata object
- `generateRandomNFTName(prefix)` - Generate random name
- `uploadMetadataToIPFS(metadata)` - Upload to IPFS
- `createNFT(connection, wallet, name)` - Create NFT
- `batchCreateNFTs(connection, wallet, count)` - Create multiple NFTs

### `programManager.js`
Custom program interaction.

- `buildTransactionInstruction(programId, accounts, data)` - Build instruction
- `executeCustomProgram(connection, wallet, programId, accounts, data)` - Execute program
- `executeNitronProgram(connection, wallet)` - Execute Nitron program

### `helpers.js`
Utility functions.

- `sleep(ms)` - Delay execution
- `randomName(len)` - Generate random name
- `withRetry(fn, maxAttempts)` - Retry with exponential backoff
- `batchExecute(tasks, batchSize)` - Execute tasks in batches
- `truncateAddress(address)` - Truncate address for display

### `logger.js`
Colored logging.

- `logger.success(message)` - Success message (green)
- `logger.error(message)` - Error message (red)
- `logger.info(message)` - Info message (blue)
- `logger.warn(message)` - Warning message (yellow)
- `logger.tx(signature)` - Transaction signature (cyan)

## Error Handling

The CLI includes comprehensive error handling:

- **Transaction Failures**: Automatic retry with exponential backoff
- **Network Errors**: Connection validation before operations
- **Balance Checks**: Verify sufficient funds before execution
- **Invalid Input**: Validate addresses, amounts, and key formats
- **Detailed Logging**: Show exact error messages and retry attempts

## Performance Considerations

1. **Batch Execution**: Parallel execution with configurable batch size
2. **Transaction Delays**: Configurable delays to avoid RPC rate limiting
3. **Retry Logic**: Exponential backoff for failed transactions
4. **Multi-wallet Support**: Process multiple wallets sequentially to avoid conflicts

## Security Notes

⚠️ **Important Security Reminders:**

1. **Never commit wallet.json** - Add to .gitignore
2. **Use environment variables** - Store sensitive data in .env
3. **Validate addresses** - Verify mint and program addresses before execution
4. **Mainnet caution** - Test on devnet first
5. **Key management** - Keep wallet files secure and backed up

## Example Wallet.json Format

```json
[1, 2, 3, ..., 64]  // 64-byte array (secret key)
```

Generate from keypair:
```javascript
const fs = require("fs");
const { Keypair } = require("@solana/web3.js");

const keypair = Keypair.generate();
fs.writeFileSync("wallet.json", JSON.stringify(Array.from(keypair.secretKey)));
```

## Advanced Usage

### Custom Program Execution

```bash
node src/index.js run-custom \
  --wallet wallet.json \
  --program FqDHFYCYfLadhHjEkbsxTmNmW4f2kMb6Pxf2sSFoRn1G
```

### Scheduled Daily Operations

```bash
# Run token creation every day at 9 AM
node src/index.js scheduler \
  --wallet wallet.json \
  --operations token \
  --time 09:00
```

### Complex Batch Operations

```bash
# Create tokens and NFTs in batches of 3
node src/index.js batch \
  --wallet wallet.json \
  --operations token,nft \
  --count 10 \
  --batch 3
```

## Troubleshooting

### "Failed to load wallet"
- Verify wallet.json exists and is readable
- Check file format (should be array of 64 numbers)
- Ensure path is correct

### "Insufficient funds"
- Check wallet balance: `solana balance --keypair wallet.json`
- Need SOL for transaction fees (~0.00005 SOL per transaction)

### "RPC rate limit"
- Increase TX_DELAY_MS in .env
- Use custom RPC endpoint with higher limits
- Reduce batch size

### "Invalid program ID"
- Verify program ID is correct and on the network
- Check if program is deployed to the selected network

## Dependencies

- `@solana/web3.js` - Solana blockchain interaction
- `@solana/spl-token` - SPL token operations
- `bs58` - Base58 encoding/decoding
- `commander` - CLI framework
- `dotenv` - Environment variables
- `chalk` - Colored console output
- `ora` - Loading spinners
- `node-cron` - Scheduling

## Development

### Adding New Commands

1. Create command file in `src/cli/`
2. Export function from command file
3. Import and add to `src/index.js`

Example:
```javascript
program
  .command("my-command")
  .description("Description")
  .option("--option <value>", "Description")
  .action(async (options) => {
    try {
      await myCommandFunction(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });
```

## License

MIT

## Support

For issues, suggestions, or contributions:
- GitHub: [nitron-cli](https://github.com/yourusername/nitron-cli)
- Issues: [GitHub Issues](https://github.com/yourusername/nitron-cli/issues)

## Changelog

### v1.0.0
- Initial release
- Token creation and minting
- NFT metadata creation
- Custom program execution
- Multi-wallet support
- Daily scheduler
- Comprehensive CLI with all features

---

**Built with ❤️ for Solana developers**
