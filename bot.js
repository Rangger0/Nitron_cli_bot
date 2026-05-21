const {
  Connection,
  Keypair,
  clusterApiUrl
} = require("@solana/web3.js");

const {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo
} = require("@solana/spl-token");

const fs = require("fs");
const cron = require("node-cron");

// ===== CONFIG =====
const connection = new Connection(clusterApiUrl("devnet"), "confirmed");

const wallet = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(fs.readFileSync("wallet.json")))
);

// ===== HELPER =====
function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function randomName(len = 5) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return Array.from({ length: len }, () =>
    chars[Math.floor(Math.random() * chars.length)]
  ).join("");
}

// ===== NFT (SIMPLE LOG DULU) =====
async function createNFT() {
  console.log("🔥 NITRON CREATE NFT:", randomName());
}

// ===== TOKEN =====
async function createTokens(count) {
  for (let i = 0; i < count; i++) {
    try {
      const name = randomName();

      console.log(`🪙 Token ${i + 1}:`, name);

      const mint = await createMint(
        connection,
        wallet,
        wallet.publicKey,
        null,
        9
      );

      const tokenAccount = await getOrCreateAssociatedTokenAccount(
        connection,
        wallet,
        mint,
        wallet.publicKey
      );

      await mintTo(
        connection,
        wallet,
        mint,
        tokenAccount.address,
        wallet,
        1000
      );

      console.log("✅ SUCCESS:", mint.toBase58());

      await sleep(1500);

    } catch (err) {
      console.log("❌ ERROR, retry...");
      await sleep(3000);
      i--;
    }
  }
}

// ===== MAIN TEST =====
(async () => {
  console.log("🚀 NITRON BOT START");

  await createNFT();
  await createTokens(2); // test dulu 2
})();