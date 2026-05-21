# Nitron CLI - Quick Start Guide

Get started with Nitron CLI in 5 minutes!

## 1. Installation

```bash
# Install dependencies
npm install

# Make the script executable
chmod +x src/index.js
```

## 2. Prepare Your Wallet

Create a `wallet.json` file with your Solana wallet secret key:

```bash
# Using solana CLI (if installed)
solana-keygen new --outfile wallet.json

# Or create from existing keypair
solana-keygen show ~/.config/solana/id.json --outfile wallet.json
```

The file should contain a JSON array of 64 numbers (your secret key).

## 3. Configure Environment

```bash
# Copy example config
cp .env.example .env

# Edit .env (optional)
nano .env
```

Default values work for devnet. Change `NETWORK` for testnet/mainnet-beta.

## 4. Try Your First Command

### Create a Token

```bash
node src/index.js create-token
```

You should see:
```
🚀 CREATE TOKEN
──────────────────────────────────────────────────────
[INFO] Loading wallet from: ./wallet.json
✅ Wallet loaded: 4N57F7...Rrwf
[INFO] Connecting to network: devnet
[INFO] Wallet balance: 5.1234 SOL
[INFO] Creating token...
✅ Token created: EPjFWADvboxJcqZN3iHuFw2UgLwqhXfHqxUhqRdqzSfA
──────────────────────────────────────────────────────
✅ Token created successfully!
Mint: EPjFWADvboxJcqZN3iHuFw2UgLwqhXfHqxUhqRdqzSfA
```

## 5. Common Commands

### Create Multiple Tokens

```bash
node src/index.js batch-tokens --count 5
```

### Mint Tokens

```bash
node src/index.js mint --mint <MINT_ADDRESS> --amount 1000
```

### Create an NFT

```bash
node src/index.js create-nft --name "My First NFT"
```

### Create Multiple NFTs

```bash
node src/index.js batch-nfts --count 10
```

### Batch Operations (Token + NFT + Custom)

```bash
node src/index.js batch --operations token,nft,custom --count 5
```

### Run Daily Scheduler

```bash
# Run at 9 AM every day
node src/index.js scheduler --operations token --time 09:00
```

## 6. Use Different Networks

```bash
# Testnet
node src/index.js create-token --network testnet

# Mainnet (⚠️ real money!)
node src/index.js create-token --network mainnet-beta
```

## 7. Multiple Wallets

Create a `wallets/` folder with multiple wallet files:

```
wallets/
├── wallet1.json
├── wallet2.json
└── wallet3.json
```

Then execute across all:

```bash
node src/index.js multi-wallet --operation token --count 3
```

## 8. Enable npm Link (Optional)

Make `nitron` available globally:

```bash
npm link

# Now you can use:
nitron create-token
nitron batch-tokens --count 10
nitron create-nft
```

## 9. View Help

```bash
node src/index.js help
```

## 10. Troubleshooting

### "Failed to load wallet"
```bash
# Check wallet file exists and is valid
cat wallet.json
# Should show: [1, 2, 3, ..., 64] (64 numbers)
```

### "Insufficient funds"
```bash
# Get free devnet SOL
solana airdrop 10

# Or check balance
solana balance
```

### "Connection failed"
```bash
# Check internet connection
# Verify network is correct in .env
# Try custom RPC endpoint in .env
```

## Environment Variables Cheat Sheet

```ini
# Switch to testnet
NETWORK=testnet

# Slower execution (avoid rate limits)
TX_DELAY_MS=2000
RETRY_ATTEMPTS=5

# Faster batching
BATCH_SIZE=10

# Use custom RPC
RPC_ENDPOINT=https://api.devnet.solana.com
```

## Next Steps

1. **Explore Commands**: Try different commands with `--help`
2. **Automate**: Set up scheduler for daily operations
3. **Monitor**: Check logs and transaction signatures
4. **Scale**: Add multiple wallets in `wallets/` folder
5. **Customize**: Modify NFT names, metadata, and images

## Example Workflow

```bash
# 1. Create a token
TOKEN=$(node src/index.js create-token | grep "Mint:" | cut -d: -f2)

# 2. Mint tokens to wallet
node src/index.js mint --mint $TOKEN --amount 1000

# 3. Create NFTs
node src/index.js batch-nfts --count 5

# 4. Execute custom program
node src/index.js run-custom

# 5. Schedule daily operations
node src/index.js scheduler --operations token,nft --time 09:00 &
```

## Security Checklist

- [ ] Added `wallet.json` to `.gitignore`
- [ ] Use devnet for testing first
- [ ] Verify amounts before mainnet execution
- [ ] Keep .env file secure
- [ ] Back up your wallet files
- [ ] Use strong wallet passphrases

## Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "ENOENT: wallet.json not found" | Run `solana-keygen new` or create manually |
| "RPC rate limited" | Increase `TX_DELAY_MS` to 3000+ |
| "Transaction failed" | Increase `RETRY_ATTEMPTS` in .env |
| "Low balance" | Use `solana airdrop 10` on devnet |
| "Invalid program ID" | Verify program deployed to selected network |

## Performance Tips

1. **Batch Size**: Larger batch size = faster execution
2. **Delays**: Smaller delays = faster, larger = safer
3. **Network**: Devnet is fastest, mainnet may have higher latency
4. **Multi-wallet**: Process sequentially to avoid conflicts

## Resources

- [Solana Docs](https://docs.solana.com)
- [SPL Token Docs](https://spl.solana.com/token)
- [Web3.js Docs](https://solana-labs.github.io/solana-web3.js/)
- [Solana CLI](https://docs.solana.com/cli/install-solana-cli-tools)

---

**Happy deploying! 🚀**
