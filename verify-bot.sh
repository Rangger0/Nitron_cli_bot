#!/bin/bash

# Autonomous Bot - Verification Script
# Checks if all bot components are properly installed and working

set -e

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     NITRON AUTONOMOUS BOT - VERIFICATION SCRIPT                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counter
CHECKS=0
PASSED=0

check() {
  CHECKS=$((CHECKS + 1))
  local name=$1
  local cmd=$2
  
  echo -n "[$CHECKS] $name... "
  
  if eval "$cmd" > /dev/null 2>&1; then
    echo -e "${GREEN}✅ PASS${NC}"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}❌ FAIL${NC}"
  fi
}

# Test 1: Files exist
echo -e "${BLUE}📁 Checking Files...${NC}"
check "src/index.js exists" "test -f src/index.js"
check "src/bot/botManager.js exists" "test -f src/bot/botManager.js"
check "src/cli/botCommands.js exists" "test -f src/cli/botCommands.js"
check "src/cli/tokenCommands.js exists" "test -f src/cli/tokenCommands.js"
check "src/cli/nftCommands.js exists" "test -f src/cli/nftCommands.js"
check "src/cli/programCommands.js exists" "test -f src/cli/programCommands.js"
check "src/cli/scheduler.js exists" "test -f src/cli/scheduler.js"
check "BOT_GUIDE.md exists" "test -f BOT_GUIDE.md"
check "BOT_QUICKSTART.md exists" "test -f BOT_QUICKSTART.md"

echo ""
echo -e "${BLUE}🔧 Checking Syntax...${NC}"
check "index.js syntax" "node -c src/index.js"
check "botManager.js syntax" "node -c src/bot/botManager.js"
check "botCommands.js syntax" "node -c src/cli/botCommands.js"

echo ""
echo -e "${BLUE}📦 Checking Dependencies...${NC}"
check "commander.js installed" "node -e \"require('commander')\""
check "@solana/web3.js installed" "node -e \"require('@solana/web3.js')\""
check "@solana/spl-token installed" "node -e \"require('@solana/spl-token')\""
check "node-cron installed" "node -e \"require('node-cron')\""
check "chalk installed" "node -e \"require('chalk')\""

echo ""
echo -e "${BLUE}🤖 Checking Bot Commands...${NC}"
check "help command works" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:auto'"
check "bot:auto is listed" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:auto'"
check "bot:cron is listed" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:cron'"
check "bot:batch is listed" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:batch'"
check "bot:status is listed" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:status'"
check "bot:config is listed" "timeout 2 node src/index.js help 2>&1 | grep -q 'bot:config'"

echo ""
echo -e "${BLUE}📂 Checking Directories...${NC}"
check "wallets folder exists" "test -d wallets"
check "setup-wallets.sh is executable" "test -x setup-wallets.sh"

echo ""
echo "╔════════════════════════════════════════════════════════════════╗"
echo -e "║  ${GREEN}VERIFICATION COMPLETE${NC}                                       ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo -e "Results: ${GREEN}$PASSED${NC}/$CHECKS tests passed"
echo ""

if [ "$PASSED" -eq "$CHECKS" ]; then
  echo -e "${GREEN}✅ All systems ready!${NC}"
  echo ""
  echo "Next steps:"
  echo "1. Create wallets: bash setup-wallets.sh"
  echo "2. Get SOL: solana airdrop 10 --keypair wallets/wallet1.json --url devnet"
  echo "3. Run bot: node src/index.js bot:init --folder ./wallets"
  echo "4. Start bot: node src/index.js bot:auto --operations token"
  echo ""
  exit 0
else
  echo -e "${RED}❌ Some tests failed. Check above for details.${NC}"
  exit 1
fi
