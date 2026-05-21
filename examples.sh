#!/bin/bash

# Nitron CLI - Example Scripts
# Run these examples to test the CLI

set -e

echo "🚀 Nitron CLI - Example Scripts"
echo "================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if wallet exists
if [ ! -f "wallet.json" ]; then
    echo -e "${RED}Error: wallet.json not found${NC}"
    echo "Please create a wallet file first:"
    echo "  solana-keygen new --outfile wallet.json"
    exit 1
fi

echo -e "${GREEN}✓ Wallet found${NC}"
echo ""

# Function to run example
run_example() {
    local name=$1
    local cmd=$2
    echo -e "${YELLOW}Example: $name${NC}"
    echo "Command: $cmd"
    echo ""
    eval "$cmd"
    echo ""
    echo "---"
    echo ""
}

# Examples
echo "Running examples..."
echo ""

# Example 1: Create single token
run_example "Create Token" "node src/index.js create-token"

# Example 2: Batch create tokens
run_example "Batch Create Tokens" "node src/index.js batch-tokens --count 3"

# Example 3: Create NFT
run_example "Create NFT" "node src/index.js create-nft --name 'My First NFT'"

# Example 4: Create multiple NFTs
run_example "Batch Create NFTs" "node src/index.js batch-nfts --count 2"

# Example 5: Run custom program
run_example "Run Custom Program" "node src/index.js run-custom"

echo -e "${GREEN}✓ All examples completed!${NC}"
