# 🤖 Nitron Autonomous Bot - Multi-Account Guide

Complete guide to setup and run the autonomous multi-account bot.

## What is Autonomous Bot?

**Autonomous Bot** adalah fitur yang memungkinkan CLI Nitron untuk:

✅ Run multiple wallets simultaneously  
✅ Execute operations secara otomatis (tidak perlu manual)  
✅ Schedule operations dengan cron atau interval  
✅ Track semua operasi dengan logging  
✅ Handle errors dan retry otomatis  

---

## 📁 Setup Multi-Account (Wallets Folder)

### Step 1: Create Wallets Folder

```bash
cd /home/rose-alpha/bot/nitron

# Create wallets folder
mkdir -p wallets
```

### Step 2: Add Wallet Files

Setiap wallet harus jadi file `.json` terpisah dalam folder `wallets/`:

```
wallets/
├── wallet1.json      # Account 1
├── wallet2.json      # Account 2
├── wallet3.json      # Account 3
└── wallet4.json      # Account 4
```

**Format setiap wallet:**
```json
[1, 2, 3, 4, ..., 64]  // 64 bytes (secret key)
```

### Step 3: Generate Wallets

Cara buat multiple wallets:

**Opsi A: Dari Solana CLI**
```bash
# Generate 4 wallets
for i in 1 2 3 4; do
  solana-keygen new --outfile wallets/wallet$i.json --no-passphrase
done
```

**Opsi B: Dari Node Script**
```bash
node -e "
const { Keypair } = require('@solana/web3.js');
const fs = require('fs');
for (let i = 1; i <= 4; i++) {
  const kp = Keypair.generate();
  fs.writeFileSync(\`wallets/wallet\${i}.json\`, JSON.stringify(Array.from(kp.secretKey)));
  console.log(\`Wallet \${i}: \${kp.publicKey.toBase58()}\`);
}
"
```

**Opsi C: Copy dari Existing Wallets**
```bash
# Copy existing wallet ke wallets folder
cp wallet.json wallets/wallet1.json
```

---

## 🎯 Bot Commands

### 1. **Initialize Bot** (Check wallets)
```bash
node src/index.js bot:init --folder ./wallets
```

Output:
```
✅ Loaded 4 wallets
✅ Balance OK: 5.1234 SOL
✅ Balance OK: 3.5678 SOL
...
✅ Bot initialized successfully!
```

---

### 2. **Autonomous Bot - Continuous** (Jalanin terus)
```bash
# Run setiap 60 minutes (default)
node src/index.js bot:auto --operations token --interval 60

# Run every 30 minutes
node src/index.js bot:auto --operations token,nft --interval 30

# Multiple operations
node src/index.js bot:auto --operations token,nft,program --interval 120
```

**Apa yang terjadi:**
- Bot membaca semua wallets di folder `wallets/`
- Setiap interval, bot eksekusi operasi di semua wallets
- Hasilnya di-log di `bot-logs.json`
- Press `Ctrl+C` untuk stop

**Example output:**
```
🚀 AUTONOMOUS BOT - CONTINUOUS MODE
Interval: 60 minutes
Operations: token, nft

📊 Statistics:
  • Total Operations: 8
  • Successful: 8
  • Failed: 0
  • Success Rate: 100.00%

⏱️ Timing:
  • Uptime: 1h 45m
  • Last Activity: 2024-05-17T14:30:00Z
```

---

### 3. **Scheduled Bot - Cron** (Jalanin sesuai jadwal)
```bash
# Every hour (default)
node src/index.js bot:cron --operations token

# Every 6 hours
node src/index.js bot:cron --operations token --schedule "0 */6 * * *"

# Every day at 9 AM
node src/index.js bot:cron --operations token,nft --schedule "0 9 * * *"

# Every Monday 10 AM
node src/index.js bot:cron --operations token --schedule "0 10 * * 1"

# Every 30 minutes
node src/index.js bot:cron --operations token --schedule "*/30 * * * *"
```

**Cron Format:**
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
│ │ │ │ │
* * * * *
```

**Common schedules:**
```
0 * * * *    - Every hour
0 */6 * * *  - Every 6 hours
0 9 * * *    - Every day at 9 AM
0 10 * * 1   - Monday at 10 AM
*/30 * * * * - Every 30 minutes
```

---

### 4. **Batch Bot - Single Execution** (Jalanin sekali)
```bash
# Execute once
node src/index.js bot:batch --operations token

# Multiple operations
node src/index.js bot:batch --operations token,nft,program
```

Output sama seperti multi-wallet command, tapi hanya jalanin 1 kali.

---

### 5. **Bot Status** (Lihat log)
```bash
node src/index.js bot:status
```

Output:
```
📋 BOT STATUS & LOGS

Total logs: 128

✅ [14:30:15] TOKEN - 4N57F7...
✅ [14:25:10] NFT - FHccEk...
❌ [14:20:05] PROGRAM - JAhjsZ...
✅ [14:15:00] TOKEN - 2wf3o5...
...
```

---

### 6. **Bot Config** (Lihat setting)
```bash
node src/index.js bot:config
```

Output:
```
Network:              devnet
Wallet Folder:        ./wallets
TX Delay:             1500ms
Retry Attempts:       3
Batch Size:           5
Log Level:            info
```

---

## 📋 Complete Examples

### Example 1: Create Tokens Every Hour (All Wallets)
```bash
node src/index.js bot:cron --operations token --schedule "0 * * * *"
```

### Example 2: NFT Bot Every 2 Hours
```bash
node src/index.js bot:auto --operations nft --interval 120
```

### Example 3: Token + NFT + Program Every 6 Hours
```bash
node src/index.js bot:cron --operations token,nft,program --schedule "0 */6 * * *"
```

### Example 4: Daily Bot at 9 AM
```bash
node src/index.js bot:cron --operations token,nft --schedule "0 9 * * *"
```

### Example 5: Run Every 30 Minutes
```bash
node src/index.js bot:cron --operations token --schedule "*/30 * * * *"
```

---

## 🔍 Monitoring Bot

### View Logs in Real-Time
```bash
# Watch logs file
tail -f bot-logs.json | jq

# Or with timestamps
watch -n 5 "tail -20 bot-logs.json"
```

### Check Status Every 5 Minutes
```bash
while true; do
  clear
  node src/index.js bot:status
  sleep 300
done
```

### Create Log Analytics
```javascript
// analyze-logs.js
const fs = require('fs');
const logs = JSON.parse(fs.readFileSync('./bot-logs.json', 'utf-8'));

const stats = {
  total: logs.length,
  success: logs.filter(l => l.status === 'success').length,
  failed: logs.filter(l => l.status === 'failed').length,
  byOperation: {},
  byWallet: {}
};

logs.forEach(log => {
  stats.byOperation[log.operation] = (stats.byOperation[log.operation] || 0) + 1;
  stats.byWallet[log.wallet] = (stats.byWallet[log.wallet] || 0) + 1;
});

console.log(JSON.stringify(stats, null, 2));
```

Run: `node analyze-logs.js`

---

## 🚀 Production Setup (PM2)

### Install PM2
```bash
npm install -g pm2
```

### Start Bot with PM2
```bash
# Start autonomous bot
pm2 start "node src/index.js bot:auto --operations token --interval 60" --name nitron-bot

# Start scheduled bot
pm2 start "node src/index.js bot:cron --operations token,nft --schedule '0 * * * *'" --name nitron-scheduler

# Start multiple bots
pm2 start "node src/index.js bot:auto --operations token --interval 60" --name bot-tokens
pm2 start "node src/index.js bot:auto --operations nft --interval 120" --name bot-nfts
pm2 start "node src/index.js bot:auto --operations program --interval 180" --name bot-programs
```

### Manage with PM2
```bash
# Status
pm2 status

# Logs
pm2 logs nitron-bot

# Monitor
pm2 monit

# Restart
pm2 restart nitron-bot

# Stop
pm2 stop nitron-bot

# Delete
pm2 delete nitron-bot

# Save startup
pm2 startup
pm2 save
```

---

## 🔧 Advanced Configuration

### Custom Log File Location
```bash
node src/index.js bot:auto --operations token --log-file ./logs/my-bot.json
```

### Use Different Network
```bash
# Testnet
node src/index.js bot:auto --operations token --network testnet

# Mainnet (be careful!)
node src/index.js bot:auto --operations token --network mainnet-beta
```

### Environment Variables
Edit `.env`:

```ini
# Bot settings
WALLETS_FOLDER=./wallets
TX_DELAY_MS=2000        # Increase for safety
RETRY_ATTEMPTS=5
BATCH_SIZE=10
```

---

## 📊 Bot Architecture

```
Bot Manager
    ├─ Load Wallets
    ├─ Initialize Connections
    ├─ Schedule/Run Operations
    ├─ Track Statistics
    └─ Log Results

Operations (on each wallet)
    ├─ Token Creation
    ├─ NFT Creation
    ├─ Program Execution
    └─ Logging & Error Handling
```

---

## ⚠️ Important Notes

### Security
- ✅ Never commit wallet files
- ✅ Use `.env` for configuration
- ✅ Keep backup of wallet files
- ✅ Test on devnet first

### Performance
- **Interval**: Larger = safer, slower
- **Batch Size**: Larger = faster, riskier
- **TX Delay**: Larger = safer, slower

### Troubleshooting
| Issue | Solution |
|-------|----------|
| "Failed to load wallets" | Check wallets folder exists |
| "No wallets found" | Add .json files to wallets/ folder |
| "Insufficient balance" | Airdrop SOL to wallets |
| "RPC rate limited" | Increase TX_DELAY_MS |

---

## 📝 Common Workflows

### Workflow 1: Create Tokens on Multiple Wallets
```bash
# One-time
node src/index.js bot:batch --operations token

# Hourly
node src/index.js bot:cron --operations token --schedule "0 * * * *"

# Every 30 minutes
node src/index.js bot:cron --operations token --schedule "*/30 * * * *"
```

### Workflow 2: Daily NFT Creation
```bash
# Every day at 9 AM
node src/index.js bot:cron --operations nft --schedule "0 9 * * *"
```

### Workflow 3: Multiple Operations
```bash
# Every 6 hours: token + nft + program
node src/index.js bot:cron --operations token,nft,program --schedule "0 */6 * * *"
```

### Workflow 4: Continuous Monitoring
```bash
# Run continuously every hour
node src/index.js bot:auto --operations token --interval 60 &
node src/index.js bot:auto --operations nft --interval 120 &

# Monitor
watch -n 5 "node src/index.js bot:status"
```

---

## 🎉 Ready to Go!

**Quick start:**
```bash
# 1. Create wallets folder
mkdir -p wallets

# 2. Add your wallets
cp wallet.json wallets/wallet1.json

# 3. Initialize bot
node src/index.js bot:init --folder ./wallets

# 4. Run bot
node src/index.js bot:auto --operations token --interval 60
```

**Happy botting! 🤖**

---

See also:
- [README.md](../../README.md) - Main documentation
- [API_REFERENCE.md](../../API_REFERENCE.md) - API docs
