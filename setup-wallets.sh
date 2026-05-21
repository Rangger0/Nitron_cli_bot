#!/bin/bash

# Setup wallets untuk autonomous bot
# Menggunakan existing wallet atau generate baru

set -e

echo "🤖 Nitron Bot - Wallet Setup"
echo "=============================="
echo ""

WALLETS_DIR="./wallets"

# Create wallets directory
echo "📁 Creating wallets folder..."
mkdir -p "$WALLETS_DIR"
echo "✅ Folder created: $WALLETS_DIR"
echo ""

# Check if Solana CLI is installed
if ! command -v solana-keygen &> /dev/null; then
    echo "⚠️  Solana CLI not found. Will use Node method instead."
    echo ""
    echo "To generate wallets using Node:"
    echo "node -e '"
    echo "const { Keypair } = require(\"@solana/web3.js\");"
    echo "const fs = require(\"fs\");"
    echo "for (let i = 1; i <= 4; i++) {"
    echo "  const kp = Keypair.generate();"
    echo "  fs.writeFileSync(\`wallets/wallet\${i}.json\`, JSON.stringify(Array.from(kp.secretKey)));"
    echo "  console.log(\`Wallet \${i}: \${kp.publicKey.toBase58()}\`);"
    echo "}"
    echo "'"
    exit 0
fi

echo "🔑 Generating wallets..."
echo ""

# Generate 4 wallets
for i in 1 2 3 4; do
    WALLET_FILE="$WALLETS_DIR/wallet$i.json"
    
    if [ -f "$WALLET_FILE" ]; then
        echo "⏭️  Wallet $i already exists"
    else
        echo "📝 Generating wallet $i..."
        solana-keygen new --outfile "$WALLET_FILE" --no-passphrase --silent
        
        # Get public key
        PUBKEY=$(solana-keygen pubkey "$WALLET_FILE")
        echo "✅ Wallet $i created: $PUBKEY"
    fi
done

echo ""
echo "📊 Wallet Summary:"
ls -la "$WALLETS_DIR"/*.json 2>/dev/null | wc -l | xargs echo "Total wallets:"

echo ""
echo "🎯 Next steps:"
echo "1. Get SOL for devnet:"
echo "   for wallet in $WALLETS_DIR/*.json; do"
echo "     solana airdrop 10 --keypair \$wallet --url devnet"
echo "   done"
echo ""
echo "2. Check balances:"
echo "   for wallet in $WALLETS_DIR/*.json; do"
echo "     solana balance --keypair \$wallet --url devnet"
echo "   done"
echo ""
echo "3. Initialize bot:"
echo "   node src/index.js bot:init --folder ./wallets"
echo ""
echo "4. Run bot:"
echo "   node src/index.js bot:auto --operations token --interval 60"
echo ""
