const SATS_PER_BTC = 100_000_000;

const amountEl = document.getElementById("amount");
const satOutEl = document.getElementById("satOut");
const statusNoteEl = document.getElementById("statusNote");
const copyBtn = document.getElementById("copyBtn");
document.getElementById("year").textContent = String(new Date().getFullYear());

function formatNumber(n, opts = {}) {
  try {
    return new Intl.NumberFormat(undefined, opts).format(n);
  } catch {
    return String(n);
  }
}

function sanitizeAmount(value) {
  const v = String(value).trim().replace(",", ".");
  const num = Number(v);
  if (!Number.isFinite(num) || num < 0) return null;
  return num;
}

function setStatus(msg) {
  statusNoteEl.textContent = msg || "";
}

function computeAndRender() {
  const btc = sanitizeAmount(amountEl.value);

  if (btc === null) {
    satOutEl.textContent = "—";
    setStatus("Enter a valid BTC amount.");
    return;
  }

  const sats = btc * SATS_PER_BTC;
  satOutEl.textContent = formatNumber(Math.round(sats), { maximumFractionDigits: 0 });
  setStatus("");
}

amountEl.addEventListener("input", computeAndRender);

copyBtn.addEventListener("click", async () => {
  const btc = sanitizeAmount(amountEl.value);
  if (btc === null) return;

  const satText = satOutEl.textContent;
  const text = `${formatNumber(btc)} BTC = ${satText} sats (via satoshi-converter.com)`;

  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied to clipboard.");
    setTimeout(() => setStatus(""), 1500);
  } catch {
    setStatus("Copy failed (browser blocked).");
  }
});

// Initial render
computeAndRender();
