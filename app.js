const SATS_PER_BTC = 100_000_000;

// Elements (may not exist on every page)
const amountEl = document.getElementById("amount");
const currencyEl = document.getElementById("currency");
const btcOutEl = document.getElementById("btcOut");
const satOutEl = document.getElementById("satOut");
const lastUpdateEl = document.getElementById("lastUpdate");
const statusNoteEl = document.getElementById("statusNote");
const copyBtn = document.getElementById("copyBtn");
const refreshBtn = document.getElementById("refreshBtn");
const yearEl = document.getElementById("year");

if (yearEl) yearEl.textContent = String(new Date().getFullYear());

let lastPrice = null; // 1 BTC = X fiat
let inflight = false;

function formatNumber(n, opts = {}) {
  try {
    return new Intl.NumberFormat(undefined, opts).format(n);
  } catch {
    return String(n);
  }
}

function sanitizeAmount(value) {
  const v = String(value ?? "").trim().replace(",", ".");
  const num = Number(v);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function setStatus(msg) {
  if (statusNoteEl) statusNoteEl.textContent = msg || "";
}

function detectCurrencyFromPath() {
  // Examples:
  // /aud-to-satoshi/ -> aud
  // /chf-to-satoshi/ -> chf
  // /10-eur-to-satoshi/ -> eur
  const path = (location.pathname || "").toLowerCase();

  // Prefer 3-letter currency before "-to-satoshi"
  const m1 = path.match(/\/([a-z]{3})-to-satoshi\/?$/);
  if (m1?.[1]) return m1[1];

  // Long-tail like /10-eur-to-satoshi/
  const m2 = path.match(/-([a-z]{3})-to-satoshi\/?$/);
  if (m2?.[1]) return m2[1];

  return null;
}

function getCurrency() {
  // Priority: select value > URL detection > fallback
  const c = (currencyEl && currencyEl.value) ? currencyEl.value : detectCurrencyFromPath();
  return (c || "usd").toLowerCase();
}

function computeAndRender() {
  if (!amountEl || !btcOutEl || !satOutEl) return;

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

  const btc = amount / lastPrice;
  const sats = btc * SATS_PER_BTC;

  btcOutEl.textContent = formatNumber(btc, { maximumFractionDigits: 8 });
  satOutEl.textContent = formatNumber(Math.round(sats), { maximumFractionDigits: 0 });
  setStatus("");
}

async function fetchPrice(currency) {
  if (inflight) return;
  inflight = true;

  try {
    setStatus("Fetching latest BTC price…");

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${encodeURIComponent(currency)}`;
    const res = await fetch(url, { headers: { accept: "application/json" } });

    if (!res.ok) throw new Error(`Price request failed (${res.status})`);
    const data = await res.json();

    const price = data?.bitcoin?.[currency];
    if (!Number.isFinite(price) || price <= 0) throw new Error("Invalid price received");

    lastPrice = price;

    if (lastUpdateEl) lastUpdateEl.textContent = new Date().toLocaleString();
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
if (amountEl) amountEl.addEventListener("input", computeAndRender);

if (currencyEl) {
  currencyEl.addEventListener("change", async () => {
    await fetchPrice(getCurrency());
  });
}

if (refreshBtn) {
  refreshBtn.addEventListener("click", async () => {
    await fetchPrice(getCurrency());
  });
}

if (copyBtn) {
  copyBtn.addEventListener("click", async () => {
    if (!amountEl || !btcOutEl || !satOutEl) return;

    const amount = sanitizeAmount(amountEl.value);
    if (amount === null || !lastPrice) return;

    const btcText = btcOutEl.textContent;
    const satText = satOutEl.textContent;
    const cur = getCurrency().toUpperCase();

    const text = `${formatNumber(amount)} ${cur} ≈ ${btcText} BTC ≈ ${satText} sats (via satoshi-converter.com)`;

    try {
      await navigator.clipboard.writeText(text);
      setStatus("Copied to clipboard.");
      setTimeout(() => setStatus(""), 1500);
    } catch {
      setStatus("Copy failed (browser blocked).");
    }
  });
}

// Initial
const initialCurrency = getCurrency();
fetchPrice(initialCurrency);
setInterval(() => fetchPrice(getCurrency()), 60_000);
