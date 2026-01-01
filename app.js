const SATS_PER_BTC = 100_000_000;

const amountEl = document.getElementById("amount");
const currencyEl = document.getElementById("currency");
const btcOutEl = document.getElementById("btcOut");
const satOutEl = document.getElementById("satOut");
const lastUpdateEl = document.getElementById("lastUpdate");
const statusNoteEl = document.getElementById("statusNote");
const copyBtn = document.getElementById("copyBtn");
const refreshBtn = document.getElementById("refreshBtn");
document.getElementById("year").textContent = String(new Date().getFullYear());

let lastPrice = null; // BTC price in selected fiat, i.e. 1 BTC = X fiat
let lastCurrency = currencyEl.value;
let inflight = false;

function formatNumber(n, opts = {}) {
  try {
    return new Intl.NumberFormat(undefined, opts).format(n);
  } catch {
    return String(n);
  }
}

function sanitizeAmount(value) {
  // Allow "100", "100.5", "100,5"
  const v = String(value).trim().replace(",", ".");
  const num = Number(v);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function setStatus(msg) {
  statusNoteEl.textContent = msg || "";
}

function computeAndRender() {
  const amount = sanitizeAmount(amountEl.value);
  if (amount === null) {
    btcOutEl.textContent = "—";
    satOutEl.textContent = "—";
    setStatus("Enter a valid amount.");
    return;
  }
  if (!lastPrice) {
    btcOutEl.textContent = "—";
    satOutEl.textContent = "—";
    setStatus("Fetching price…");
    return;
  }

  // If BTC mode: amount is already BTC
if (lastCurrency === "btc") {
  const btc = amount;
  const sats = btc * SATS_PER_BTC;

  btcOutEl.textContent = formatNumber(btc, { maximumFractionDigits: 8 });
  satOutEl.textContent = formatNumber(Math.round(sats), { maximumFractionDigits: 0 });
  setStatus("");
  return;
}

// fiat -> BTC (default)
const btc = amount / lastPrice;
const sats = btc * SATS_PER_BTC;


  btcOutEl.textContent = formatNumber(btc, { maximumFractionDigits: 8 });
  satOutEl.textContent = formatNumber(Math.round(sats), { maximumFractionDigits: 0 });

  setStatus("");
}

async function fetchPrice(currency) {
  if (inflight) return;
  inflight = true;
if (currency === "btc") {
  lastPrice = 1;
  lastCurrency = "btc";
  lastUpdateEl.textContent = "—";
  setStatus("");
  computeAndRender();
  inflight = false;
  return;
}

  try {
    setStatus("Fetching latest BTC price…");
    // CoinGecko simple price endpoint
    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${encodeURIComponent(currency)}`;
    const res = await fetch(url, { headers: { "accept": "application/json" } });

    if (!res.ok) throw new Error(`Price request failed (${res.status})`);
    const data = await res.json();

    const price = data?.bitcoin?.[currency];
    if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price received");

    lastPrice = price;
    lastCurrency = currency;

    const now = new Date();
    lastUpdateEl.textContent = now.toLocaleString();
    setStatus("");

    computeAndRender();
  } catch (e) {
    lastPrice = null;
    computeAndRender();
    setStatus("Could not fetch price right now. Try again in a moment.");
  } finally {
    inflight = false;
  }
}

// Events
amountEl.addEventListener("input", () => computeAndRender());
currencyEl.addEventListener("change", async () => {
  const c = currencyEl.value;
  await fetchPrice(c);
});

refreshBtn.addEventListener("click", async () => {
  await fetchPrice(currencyEl.value);
});

copyBtn.addEventListener("click", async () => {
  const amount = sanitizeAmount(amountEl.value);
  if (amount === null || !lastPrice) return;

  const btcText = btcOutEl.textContent;
  const satText = satOutEl.textContent;
  const cur = currencyEl.value.toUpperCase();

  const text = `${formatNumber(amount)} ${cur} ≈ ${btcText} BTC ≈ ${satText} sats (via satoshi-converter.com)`;

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
    setTimeout(() => setStatus(""), 1500);
  } catch {
    setStatus("Copy failed (browser blocked).");
  }
});

// Initial load
fetchPrice(currencyEl.value);
setInterval(() => fetchPrice(currencyEl.value), 60_000); // refresh every 60s
