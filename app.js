// ===== app.js（lookup方式・リンクのみ表示） =====
const form = document.getElementById("searchForm");
const input = document.getElementById("keyword");
const resultsEl = document.getElementById("results");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const notFoundEl = document.getElementById("notFound");
const loadingOverlay = document.getElementById("loadingOverlay");
const loadingSub = document.getElementById("loadingSub");
const loadingLog = document.getElementById("loadingLog");
const loadingBar = document.getElementById("loadingBar");
const redactedFlash = document.getElementById("redactedFlash");

let loadingTimer = null;
let loadingStep = 0;

function showLoading(keyword){
  if (!loadingOverlay) return;
  loadingStep = 0;
  loadingOverlay.classList.remove("hidden");
  loadingOverlay.setAttribute("aria-hidden", "false");

  const ts = () => new Date().toISOString().replace("T"," ").replace("Z"," UTC");
  const lines = [
    `[${ts()}] AUTH OK / SESSION: ${Math.random().toString(16).slice(2,10).toUpperCase()}`,
    `[${ts()}] QUERY RECEIVED / KEYWORD: "${keyword}"`,
    `[${ts()}] ROUTE: /lookup  METHOD: POST`,
    `[${ts()}] CLASSIFICATION CHECK: RESTRICTED`,
    `[${ts()}] INDEX SCAN: START`,
  ];

  if (loadingLog) loadingLog.textContent = lines.join("\n");
  if (loadingSub) loadingSub.textContent = "ACCESS LOG: INIT";
  if (loadingBar) loadingBar.style.width = "12%";

  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = setInterval(() => {
    loadingStep++;
    const phases = [
      "ACCESS LOG: INIT",
      "ACCESS LOG: VERIFYING",
      "ACCESS LOG: SCANNING INDEX",
      "ACCESS LOG: RESOLVING POINTER",
      "ACCESS LOG: FINALIZING",
    ];
    const pct = Math.min(88, 12 + loadingStep * 12);
    if (loadingSub) loadingSub.textContent = phases[Math.min(phases.length-1, Math.floor(loadingStep/2))];
    if (loadingBar) loadingBar.style.width = pct + "%";

    if (loadingLog){
      const extra = [
        "… checksum ok",
        "… signature verified",
        "… decryption skipped (link-only mode)",
        "… access logged",
        "… record pointer ready",
      ];
      const ts2 = ts();
      const add = `[${ts2}] ${extra[Math.min(extra.length-1, loadingStep % extra.length)]}`;
      loadingLog.textContent = (loadingLog.textContent + "\n" + add).split("\n").slice(-10).join("\n");
    }
  }, 520);
}

function hideLoading(){
  if (!loadingOverlay) return;
  loadingOverlay.classList.add("hidden");
  loadingOverlay.setAttribute("aria-hidden", "true");
  if (loadingTimer) clearInterval(loadingTimer);
  loadingTimer = null;
  if (loadingBar) loadingBar.style.width = "100%";
}

function sleep(ms){
  return new Promise((r) => setTimeout(r, ms));
}

function flashRedacted(){
  if (!redactedFlash) return;
  redactedFlash.classList.remove("hidden");
  redactedFlash.setAttribute("aria-hidden", "false");
  // restart animation
  redactedFlash.classList.remove("is-active");
  void redactedFlash.offsetWidth; // force reflow
  redactedFlash.classList.add("is-active");
  setTimeout(() => {
    redactedFlash.classList.add("hidden");
    redactedFlash.setAttribute("aria-hidden", "true");
    redactedFlash.classList.remove("is-active");
  }, 1000);
}


// 安全策：残骸の削除（任意）
try { window?.localStorage?.removeItem("keyword"); } catch {}

function clearResults() {
  resultsEl.innerHTML = "";
  if (notFoundEl) notFoundEl.classList.add("hidden"); // ヒット表示時は必ず隠す
  if (statusEl) statusEl.textContent = "";
  hideLoading();
}

function renderNotFound() {
  // #results 側に出す（固定の #notFound があればそれも併用可）
  resultsEl.innerHTML = `<p class="card">検索した資料は存在しません。</p>`;
  if (notFoundEl) notFoundEl.classList.remove("hidden");
}

function renderLink(title, url) {
  // ヒット時は固定メッセージを隠す
  if (notFoundEl) notFoundEl.classList.add("hidden");

  const card = document.createElement("article");
  card.className = "card";

  const h3 = document.createElement("h3");
  h3.textContent = title || "資料";

  // ① ダウンロードリンク
  const aDownload = document.createElement("a");
  aDownload.href = url;
  aDownload.download = "";       // ブラウザに保存を促す
  aDownload.className = "btn-link";
  aDownload.textContent = "PDFをダウンロード";

  // ② 別タブで開くリンク
  const aOpen = document.createElement("a");
  aOpen.href = url;
  aOpen.target = "_blank";
  aOpen.rel = "noopener";
  aOpen.textContent = "新しいタブで開く";
  aOpen.style.marginLeft = "0.5rem";

  const p = document.createElement("p");
  p.appendChild(aDownload);
  p.appendChild(aOpen);

  card.appendChild(h3);
  card.appendChild(p);
  resultsEl.appendChild(card);
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  clearResults();

  const keyword = (input.value || "").trim();
  if (!keyword) {
    resultsEl.innerHTML = `<p class="card">キーワードを入力してください。</p>`;
    return;
  }

  resultsEl.setAttribute("aria-busy", "true");
  submitBtn.disabled = true;
  if (statusEl) statusEl.textContent = "検索中…";
  showLoading(keyword);
  const startedAt = performance.now();

  try {
    const resp = await fetch("/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword })
    });
    const json = await resp.json().catch(() => ({}));
    if (statusEl) statusEl.textContent = "";

    // 検索中表示を最低 2 秒は出す（応答が速い場合でも）
    const elapsed = performance.now() - startedAt;
    if (elapsed < 2000) await sleep(2000 - elapsed);

    if (json && json.ok && json.data && json.data.url) {
      renderLink(json.data.title, json.data.url);   // ← ヒット時のみURLがサーバから返る
    } else {
      renderNotFound();
    }

    // 結果返却後に 1 秒だけ “REDACTED” をチラつかせる（演出のみ）
    flashRedacted();
  } catch (err) {
    if (statusEl) statusEl.textContent = "";
    // 応答エラーでも 1.5 秒は演出を見せる
    const elapsed = performance.now() - startedAt;
    if (elapsed < 2000) await sleep(2000 - elapsed);
    renderNotFound();
    flashRedacted();
    console.error("検索処理でエラー:", err);
  } finally {
    hideLoading();
    resultsEl.setAttribute("aria-busy", "false");
    submitBtn.disabled = false;
  }
});
