const SATS_PER_BTC = 100_000_000;

const amountEl = document.getElementById("amount");
const btcOutEl = document.getElementById("btcOut");
const satOutEl = document.getElementById("satOut");
const statusNoteEl = document.getElementById("statusNote");
const copyBtn = document.getElementById("copyBtn");
const refreshBtn = document.getElementById("refreshBtn");
document.getElementById("year").textContent = String(new Date().getFullYear());

function formatNumber(n, opts = {}) {
  try { return new Intl.NumberFormat(undefined, opts).format(n); }
  catch { return String(n); }
}

function sanitizeAmount(value) {
  const v = String(value).trim().replace(",", ".");
  const num = Number(v);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function setStatus(msg) { statusNoteEl.textContent = msg || ""; }

function computeAndRender() {
  const amount = sanitizeAmount(amountEl.value);
  if (amount === null) {
    btcOutEl.textContent = "—";
    satOutEl.textContent = "—";
    setStatus("Enter a valid BTC amount.");
    return;
  }

  const sats = amount * SATS_PER_BTC;

  btcOutEl.textContent = formatNumber(amount, { maximumFractionDigits: 8 });
  satOutEl.textContent = formatNumber(Math.round(sats), { maximumFractionDigits: 0 });
  setStatus("");
}

// Events
amountEl.addEventListener("input", computeAndRender);

refreshBtn.addEventListener("click", () => {
  // nothing to refresh; keep button for UI consistency
  setStatus("No refresh needed (1 BTC = 100,000,000 sats).");
  setTimeout(() => setStatus(""), 1500);
});

copyBtn.addEventListener("click", async () => {
  const amount = sanitizeAmount(amountEl.value);
  if (amount === null) return;

  const btcText = btcOutEl.textContent;
  const satText = satOutEl.textContent;
  const text = `${btcText} BTC = ${satText} sats (via satoshi-converter.com)`;

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
    setTimeout(() => setStatus(""), 1500);
  } catch {
    setStatus("Copy failed (browser blocked).");
  }
});

// Initial
computeAndRender();
