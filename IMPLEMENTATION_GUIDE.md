# Implementation Guide - Nitron CLI

## Overview

Nitron CLI is a production-ready Node.js CLI tool for Solana blockchain operations. This guide explains the architecture, design decisions, and how to extend it.

## Architecture

### Directory Structure

```
src/
├── cli/                    # CLI command implementations
│   ├── tokenCommands.js    # Token operations commands
│   ├── nftCommands.js      # NFT operations commands
│   ├── programCommands.js  # Program interaction commands
│   └── scheduler.js        # Daily scheduler implementation
├── wallet/                 # Wallet management
│   └── walletManager.js    # Load and validate wallets
├── token/                  # SPL token operations
│   └── tokenManager.js     # Create/mint/manage tokens
├── nft/                    # NFT metadata and operations
│   └── nftManager.js       # Create/manage NFT metadata
├── program/                # Custom program interaction
│   └── programManager.js   # Build and execute instructions
├── utils/                  # Utility functions
│   ├── logger.js           # Colored console logging
│   ├── helpers.js          # Helper functions
│   └── rpc.js              # RPC connection utilities
├── config/                 # Configuration
│   └── config.js           # Environment-based config
└── index.js                # Main CLI entry point
```

### Design Patterns

#### 1. **Modular Architecture**
- Each feature has its own module
- Modules are independent and reusable
- Clear separation of concerns

#### 2. **Error Handling**
- Try-catch blocks in all async operations
- Meaningful error messages
- Retry logic with exponential backoff

#### 3. **Logging**
- Colored output for different message types
- Structured logging with prefixes
- Log levels (debug, info, warn, error)

#### 4. **Configuration**
- Environment variables for settings
- Sensible defaults in config.js
- Override per-command with flags

#### 5. **Dependency Injection**
- Logger passed to functions
- Connection passed to token/NFT operations
- Clean testability

## Key Implementation Details

### Wallet Loading (`walletManager.js`)

```javascript
// Single wallet
const wallet = loadWallet("./wallet.json");

// Multiple wallets
const wallets = loadMultipleWallets("./wallets");
```

**Key Points:**
- Validates 64-byte secret key format
- Returns Solana Keypair objects
- Handles file errors gracefully

### Token Creation (`tokenManager.js`)

```javascript
// Single token
const mint = await createToken(connection, wallet, 9);

// Batch with retry
const tokens = await batchCreateTokens(connection, wallet, 5);
```

**Key Points:**
- Uses @solana/spl-token library
- Automatic retry with exponential backoff
- Configurable delays between operations

### NFT Management (`nftManager.js`)

```javascript
// Create metadata
const metadata = createNFTMetadata("My NFT", "NITRON", uri);

// Upload to IPFS
const result = await uploadMetadataToIPFS(metadata);

// Batch create
const nfts = await batchCreateNFTs(connection, wallet, 5);
```

**Key Points:**
- Generates random names
- Handles image selection
- IPFS placeholder implementation (ready for real IPFS)

### Program Interaction (`programManager.js`)

```javascript
// Build instruction
const instruction = buildTransactionInstruction(programId, accounts, data);

// Execute with retry
const signature = await executeCustomProgram(
  connection,
  wallet,
  programId,
  accounts,
  data
);
```

**Key Points:**
- Base58 instruction data encoding
- TransactionInstruction builder
- Automatic retry logic

### Retry Logic (`helpers.js`)

```javascript
const result = await withRetry(
  () => operation(),
  maxAttempts,
  initialDelayMs,
  onRetryCallback
);
```

**Key Points:**
- Exponential backoff: delay * 2^(attempt-1)
- Callback for retry notifications
- Preserves last error

### Batch Execution

```javascript
const results = await batchExecute(
  tasks,
  batchSize,
  delayMs,
  onBatchCompleteCallback
);
```

**Key Points:**
- Parallel execution within batch
- Sequential batches with delays
- Progress tracking

## Adding New Commands

### Step 1: Create Command File

Create `src/cli/myCommands.js`:

```javascript
const { loadWallet } = require("../wallet/walletManager");
const { getConnection, getBalance } = require("../utils/rpc");
const Logger = require("../utils/logger");
const config = require("../config/config");

async function myCommand(options) {
  const logger = new Logger(config.logLevel);

  try {
    logger.header("MY COMMAND");
    logger.divider();

    // Get options
    const walletPath = options.wallet || config.walletPath;
    const network = options.network || config.network;

    // Load wallet
    logger.info(`Loading wallet from: ${walletPath}`);
    const wallet = loadWallet(walletPath);
    logger.success("Wallet loaded", wallet.publicKey.toBase58());

    // Get connection
    logger.info(`Connecting to network: ${network}`);
    const connection = getConnection(network);

    // Do work...

    logger.divider();
    logger.success("Command completed successfully!");

    return result;
  } catch (error) {
    logger.error(`Command failed: ${error.message}`);
    throw error;
  }
}

module.exports = { myCommand };
```

### Step 2: Add to CLI

In `src/index.js`:

```javascript
const { myCommand } = require("./cli/myCommands");

program
  .command("my-command")
  .description("My command description")
  .option("--wallet <path>", "Wallet path")
  .option("--network <network>", "Solana network", "devnet")
  .action(async (options) => {
    try {
      await myCommand(options);
      process.exit(0);
    } catch (error) {
      process.exit(1);
    }
  });
```

### Step 3: Test

```bash
node src/index.js my-command --wallet wallet.json
```

## Adding New Modules

### Example: Database Integration

1. Create `src/db/dbManager.js`:

```javascript
const sqlite3 = require("sqlite3");

class DatabaseManager {
  constructor(dbPath = "./data.db") {
    this.db = new sqlite3.Database(dbPath);
    this.init();
  }

  init() {
    this.db.run(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY,
        signature TEXT,
        type TEXT,
        timestamp DATETIME,
        status TEXT
      )
    `);
  }

  addTransaction(signature, type, status) {
    this.db.run(
      `INSERT INTO transactions (signature, type, timestamp, status)
       VALUES (?, ?, datetime('now'), ?)`,
      [signature, type, status]
    );
  }

  getTransactions(limit = 10) {
    return new Promise((resolve, reject) => {
      this.db.all(
        `SELECT * FROM transactions ORDER BY timestamp DESC LIMIT ?`,
        [limit],
        (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        }
      );
    });
  }
}

module.exports = DatabaseManager;
```

2. Use in commands:

```javascript
const DatabaseManager = require("../db/dbManager");
const db = new DatabaseManager();

// After transaction
db.addTransaction(signature, "token_creation", "success");
```

## Performance Optimization

### 1. Batch Size Tuning

```env
# Smaller batches = safer, slower
BATCH_SIZE=3

# Larger batches = faster, riskier
BATCH_SIZE=10
```

### 2. Delay Adjustment

```env
# Smaller delays = faster, more rate limiting
TX_DELAY_MS=500

# Larger delays = safer, slower
TX_DELAY_MS=3000
```

### 3. Connection Pooling

For production, use connection pooling:

```javascript
// Create pool instead of single connection
const connections = Array.from({ length: 5 }, () => 
  getConnection("devnet")
);

// Rotate connections
let currentIndex = 0;
function getNextConnection() {
  const conn = connections[currentIndex];
  currentIndex = (currentIndex + 1) % connections.length;
  return conn;
}
```

### 4. Parallel Processing

Use Promise.all for independent operations:

```javascript
// Bad: Sequential
for (const token of tokens) {
  await mintTokens(...);
}

// Good: Parallel
await Promise.all(tokens.map(token => 
  mintTokens(...)
));
```

## Security Considerations

### 1. Wallet Security
- Never log full secret keys
- Use read-only operations when possible
- Validate all addresses before transactions

### 2. Network Security
- Use HTTPS for RPC endpoints
- Verify transaction signatures
- Check account ownership

### 3. Input Validation
- Validate addresses (58 characters, base58)
- Validate amounts (positive numbers)
- Validate JSON formats

Example:

```javascript
function validateAddress(address) {
  if (!address || typeof address !== "string") {
    throw new Error("Invalid address");
  }
  if (address.length !== 44) {
    throw new Error("Invalid address length");
  }
  try {
    new PublicKey(address);
  } catch {
    throw new Error("Invalid base58 address");
  }
  return true;
}
```

### 4. Environment Variables
- Never commit .env files
- Use .env.example for templates
- Validate required variables at startup

## Testing

### Unit Tests Example

```javascript
// test/tokenManager.test.js
const { createToken } = require("../src/token/tokenManager");
const { getConnection } = require("../src/utils/rpc");

describe("Token Manager", () => {
  it("should create token", async () => {
    const connection = getConnection("devnet");
    const wallet = loadWallet("./test-wallet.json");

    const mint = await createToken(connection, wallet, 9);
    expect(mint).toBeDefined();
    expect(mint.toBase58).toBeDefined();
  });
});
```

### Integration Tests

```bash
# Test entire workflow
node examples.js all

# Test individual commands
node src/index.js create-token
node src/index.js batch-tokens --count 2
```

## Deployment

### Development
```bash
npm install
node src/index.js --help
```

### Production

1. **Install globally**:
   ```bash
   npm install -g .
   nitron --help
   ```

2. **Use with pm2**:
   ```bash
   pm2 start "nitron scheduler" --name nitron-scheduler
   ```

3. **Docker**:
   ```dockerfile
   FROM node:16
   WORKDIR /app
   COPY . .
   RUN npm install
   CMD ["node", "src/index.js"]
   ```

## Troubleshooting

### Issue: "Rate limited"
- **Solution**: Increase TX_DELAY_MS
- **Root**: Too many requests to RPC

### Issue: "Transaction failed"
- **Solution**: Increase RETRY_ATTEMPTS
- **Root**: Network congestion or invalid instruction

### Issue: "Insufficient funds"
- **Solution**: Airdrop SOL or reduce batch size
- **Root**: Not enough SOL for fees

### Issue: "Invalid instruction data"
- **Solution**: Verify program ID and accounts
- **Root**: Wrong program or account configuration

## Performance Metrics

**Expected performance** on devnet:

| Operation | Time | Notes |
|-----------|------|-------|
| Create token | 2-3s | With retry |
| Mint tokens | 1-2s | Per transaction |
| Create NFT | 1-2s | Metadata upload |
| Batch 5 ops | 15-20s | With 1.5s delays |
| 100 tokens | 2-3 mins | With parallelism |

## Future Enhancements

1. **Database integration** - Track all operations
2. **Real IPFS upload** - Use Pinata or NFT.storage
3. **Metaplex support** - Full NFT standards
4. **Advanced scheduling** - Cron-like syntax
5. **API server** - HTTP endpoints for CLI
6. **Web dashboard** - Monitor operations
7. **Mobile app** - iOS/Android support
8. **Multi-sig support** - Secure transactions

## Contributing

1. Create feature branch
2. Add tests
3. Update documentation
4. Submit PR

---

For questions or issues, refer to README.md or API_REFERENCE.md
