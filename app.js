// ===== app.js（lookup方式・リンクのみ表示） =====
const form = document.getElementById("searchForm");
const input = document.getElementById("keyword");
const resultsEl = document.getElementById("results");
const submitBtn = document.getElementById("submitBtn");
const statusEl = document.getElementById("status");
const notFoundEl = document.getElementById("notFound");

// 安全策：残骸の削除（任意）
try { window?.localStorage?.removeItem("keyword"); } catch {}

function clearResults() {
  resultsEl.innerHTML = "";
  if (notFoundEl) notFoundEl.classList.add("hidden"); // ヒット表示時は必ず隠す
  if (statusEl) statusEl.textContent = "";
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

  try {
    const resp = await fetch("/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ keyword })
    });
    const json = await resp.json().catch(() => ({}));
    if (statusEl) statusEl.textContent = "";

    if (json && json.ok && json.data && json.data.url) {
      renderLink(json.data.title, json.data.url);   // ← ヒット時のみURLがサーバから返る
    } else {
      renderNotFound();
    }
  } catch (err) {
    if (statusEl) statusEl.textContent = "";
    renderNotFound();
    console.error("検索処理でエラー:", err);
  } finally {
    resultsEl.setAttribute("aria-busy", "false");
    submitBtn.disabled = false;
  }
});
