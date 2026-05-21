# 🚀 Autonomous Bot - Quick Start

Setup multi-account autonomous bot dalam 3 menit!

## What You'll Get

✅ Bot yang jalan otomatis di multiple wallets  
✅ Bisa schedule dengan cron atau interval  
✅ Automatic error handling & retry  
✅ Logging & monitoring  

## Step 1: Create Wallets

```bash
# Create wallets folder
mkdir -p wallets

# Option A: Using script (if Solana CLI installed)
bash setup-wallets.sh

# Option B: Manual
node -e "
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
for (let i = 1; i <= 3; i++) {
  const kp = Keypair.generate();
  fs.writeFileSync(\`wallets/wallet\${i}.json\`, JSON.stringify(Array.from(kp.secretKey)));
  console.log(\`Wallet \${i}: \${kp.publicKey.toBase58()}\`);
}
"
```

## Step 2: Get SOL for Devnet

```bash
# One wallet
solana airdrop 10 --keypair wallets/wallet1.json --url devnet

# All wallets
for wallet in wallets/*.json; do
  solana airdrop 10 --keypair "$wallet" --url devnet
done
```

## Step 3: Run Bot

```bash
# Option A: Continuous (every 60 minutes)
node src/index.js bot:auto --operations token --interval 60

# Option B: Scheduled (every hour)
node src/index.js bot:cron --operations token --schedule "0 * * * *"

# Option C: Single execution
node src/index.js bot:batch --operations token
```

## Step 4: Monitor

```bash
# View status
node src/index.js bot:status

# View logs
tail -f bot-logs.json | jq

# Stop bot
press Ctrl+C
```

---

## 📚 Full Guide

See [BOT_GUIDE.md](./BOT_GUIDE.md) for complete documentation!

---

## Common Commands

| Command | Use Case |
|---------|----------|
| `bot:init` | Setup & check wallets |
| `bot:auto` | Run continuously |
| `bot:cron` | Schedule with cron |
| `bot:batch` | Run once |
| `bot:status` | View logs |
| `bot:config` | Show config |

---

## Examples

```bash
# Create tokens every hour
node src/index.js bot:cron --operations token --schedule "0 * * * *"

# NFTs every 6 hours
node src/index.js bot:cron --operations nft --schedule "0 */6 * * *"

# Multiple ops every 2 hours
node src/index.js bot:auto --operations token,nft --interval 120

# Daily at 9 AM
node src/index.js bot:cron --operations token --schedule "0 9 * * *"
```

---

**Next:** Read [BOT_GUIDE.md](./BOT_GUIDE.md) for complete setup!
