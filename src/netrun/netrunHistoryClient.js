const config = require("../config/config");
const { withRetry, sleep } = require("../utils/helpers");

// Note: website uses /api/imprints/[address]
const DEFAULT_BASE_URL = "https://app.netrun.xyz";

async function httpGetJson(url, logger = null) {
  // Use global fetch if available (Node 18+). Otherwise fallback to https.
  if (typeof fetch === "function") {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        "accept": "application/json"
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      const err = new Error(`HTTP ${res.status} ${res.statusText}: ${text.slice(0, 500)}`);
      err.status = res.status;
      throw err;
    }

    return res.json();
  }

  // Fallback (older Node). Keep minimal to not change logic.
  const https = require("https");
  const urlObj = new URL(url);

  return new Promise((resolve, reject) => {
    const req = https.request(
      urlObj,
      {
        method: "GET",
        headers: {
          "accept": "application/json"
        }
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode < 200 || res.statusCode >= 300) {
            const err = new Error(`HTTP ${res.statusCode}: ${data.slice(0, 500)}`);
            err.status = res.statusCode;
            return reject(err);
          }
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Failed to parse JSON: ${e.message}`));
          }
        });
      }
    );

    req.on("error", (e) => reject(e));
    req.end();
  });
}


function getBaseUrl() {
  return config.netrun?.historyBaseUrl || DEFAULT_BASE_URL;
}

function getImprintApiUrl(imprintAddress) {
  // Based on network tab:
  // /api/imprints/<address>
  return `${getBaseUrl()}/api/imprints/${imprintAddress}`;
}

async function fetchImprint(imprintAddress, { logger = null } = {}) {
  if (!imprintAddress) throw new Error("imprintAddress is required");
  const url = getImprintApiUrl(imprintAddress);
  return httpGetJson(url, logger);
}

function isRateLimited(err) {
  return !!err && (err.status === 429 || String(err.message || "").includes("429"));
}

// Sync by polling until imprint becomes available on the site.
async function syncImprintToSite(imprintAddress, {
  timeoutMs = 2 * 60 * 1000,
  intervalMs = 10_000,
  logger = null
} = {}) {
  const start = Date.now();
  let lastErr;
  let attempt = 0;

  while (Date.now() - start < timeoutMs) {
    attempt++;

    try {
      const data = await fetchImprint(imprintAddress, { logger });
      return {
        imprintAddress,
        found: true,
        data,
        url: getImprintApiUrl(imprintAddress),
        attempts: attempt
      };
    } catch (e) {
      lastErr = e;

      // If rate-limited, backoff lebih agresif + interval naik bertahap.
      // Server sering mengembalikan 429 + body "Security Checkpoint" (Vercel).
      if (isRateLimited(e) || String(e?.message || "").toLowerCase().includes("security checkpoint")) {
        const base = Math.max(intervalMs, 5000);
        const backoff = Math.min(
          Math.floor(base * Math.pow(2, Math.min(attempt, 10))),
          15 * 60 * 1000
        );

        if (logger) {
          logger.info(
            `Site rate-limited (429) for imprint ${imprintAddress.slice(0, 6)}... backing off ${backoff}ms: ${e.message}`
          );
        }

        await sleep(backoff);
        continue;
      }

      if (logger) {
        logger.info(
          `Site imprint not ready yet (${imprintAddress.slice(0, 6)}...): ${e.message}`
        );
      }
      await sleep(intervalMs);
    }
  }


  return {
    imprintAddress,
    found: false,
    error: lastErr ? lastErr.message : "Unknown error",
    url: getImprintApiUrl(imprintAddress),
    attempts: attempt
  };
}


module.exports = {
  fetchImprint,
  syncImprintToSite
};

