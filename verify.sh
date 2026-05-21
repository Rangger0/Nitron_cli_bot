#!/bin/bash

# Nitron CLI - Complete File Listing & Verification Script
# This script verifies all files are in place

set -e

echo "🔍 Nitron CLI - File Verification"
echo "=================================="
echo ""

ROOT="/home/rose-alpha/bot/nitron"
ERROR_COUNT=0

check_file() {
    local file=$1
    local description=$2
    
    if [ -f "$ROOT/$file" ]; then
        echo "✅ $file"
    else
        echo "❌ MISSING: $file"
        ((ERROR_COUNT++))
    fi
}

check_dir() {
    local dir=$1
    local description=$2
    
    if [ -d "$ROOT/$dir" ]; then
        echo "✅ $dir/"
    else
        echo "❌ MISSING: $dir/"
        ((ERROR_COUNT++))
    fi
}

echo "📁 Root Files:"
check_file "package.json" "NPM configuration"
check_file ".env.example" "Environment template"
check_file ".gitignore" "Git ignore rules"
check_file "README.md" "Main documentation"
check_file "QUICKSTART.md" "Quick start guide"
check_file "API_REFERENCE.md" "API documentation"
check_file "IMPLEMENTATION_GUIDE.md" "Implementation guide"
check_file "PROJECT_SUMMARY.md" "Project summary"
check_file "examples.js" "JavaScript examples"
check_file "examples.sh" "Shell examples"
echo ""

echo "📁 Directories:"
check_dir "src" "Source code"
check_dir "src/cli" "CLI commands"
check_dir "src/wallet" "Wallet management"
check_dir "src/token" "Token operations"
check_dir "src/nft" "NFT operations"
check_dir "src/program" "Program interaction"
check_dir "src/utils" "Utilities"
check_dir "src/config" "Configuration"
echo ""

echo "📄 CLI Files:"
check_file "src/index.js" "Main entry point"
check_file "src/cli/tokenCommands.js" "Token commands"
check_file "src/cli/nftCommands.js" "NFT commands"
check_file "src/cli/programCommands.js" "Program commands"
check_file "src/cli/scheduler.js" "Scheduler implementation"
echo ""

echo "📄 Module Files:"
check_file "src/wallet/walletManager.js" "Wallet management"
check_file "src/token/tokenManager.js" "Token operations"
check_file "src/nft/nftManager.js" "NFT operations"
check_file "src/program/programManager.js" "Program interaction"
check_file "src/config/config.js" "Configuration"
echo ""

echo "📄 Utility Files:"
check_file "src/utils/logger.js" "Logging system"
check_file "src/utils/helpers.js" "Helper functions"
check_file "src/utils/rpc.js" "RPC utilities"
echo ""

echo "📊 Summary:"
echo "-----------"

if [ $ERROR_COUNT -eq 0 ]; then
    echo "✅ All files present!"
else
    echo "❌ $ERROR_COUNT files missing!"
fi

echo ""
echo "💾 Project Size:"
du -sh "$ROOT" | awk '{print "Total: " $1}'

echo ""
echo "📦 Dependencies:"
echo "Node modules status:"
if [ -d "$ROOT/node_modules" ]; then
    echo "  ✅ node_modules present ($(ls "$ROOT/node_modules" | wc -l) packages)"
else
    echo "  ℹ️  node_modules not installed. Run: npm install"
fi

echo ""
echo "✨ Setup Steps:"
echo "1. npm install            # Install dependencies"
echo "2. cp .env.example .env   # Create .env"
echo "3. Create wallet.json     # Add your wallet"
echo "4. node src/index.js --help"
echo ""
