// netlify/functions/lookup.js

// ▼ キーワード → PDF 情報のマップ（サーバ側のみ）
//   このファイルは Netlify Functions としてサーバ側だけに置かれるので、
//   F12 やソースビューからは見えません。
const PDF_MAP = {
  "霧籠村祭事報告書": {
    title: "霧籠村祭事報告書",
    url: "/pdfs/霧籠村祭事報告書.pdf",
    aliases: ["霧籠村祭事報告書", "祭事報告書"]
  },
  "広報こだま": {
    title: "広報こだま",
    url: "/pdfs/広報こだま.pdf",
    aliases: ["広報こだま", "こだま", "広報"]
  },
  "光泉ダム建設計画反対運動ビラ": {
    title: "光泉ダム建設計画反対運動ビラ",
    url: "/pdfs/光泉ダム建設計画反対運動ビラ.pdf",
    aliases: [
      "光泉ダム建設計画反対運動ビラ",
      "光泉ダム建設計画反対運動",
      "光泉ダム 反対",
      "反対運動 チラシ",
      "ビラ"
    ]
  },
  "霧籠郷土館民俗史第二四一号": {
    title: "霧籠郷土館民俗史 第二四一号",
    url: "/pdfs/霧籠郷土館民俗史第二四一号.pdf",
    aliases: [
      "霧籠郷土館民俗史第二四一号",
      "第二四一号",
      "霧籠郷土館民俗史第二四一号 雲土貝",
      "雲土貝",
      "二四一号"
    ]
  },
  "贄": {
    title: "贄",
    url: "/pdfs/贄.pdf",
    aliases: ["贄"]
  },
  "霧籠郷土館民俗史第八六九号": {
    title: "霧籠郷土館民俗史 第八六九号",
    url: "/pdfs/霧籠郷土館民俗史第八六九号.pdf",
    aliases: [
      "霧籠郷土館民俗史第八六九号",
      "霧籠郷土館民俗史 第八六九号",
      "霧籠郷土館民俗史第869号",
      "霧籠郷土館民俗史 第869号",
      "第八六九号",
      "八六九号"
    ]
  },
  "供記": {
    title: "供記",
    url: "/pdfs/供記.pdf",
    aliases: ["供記"]
  }
};

// 入力正規化（前後の空白カット・全角英数→半角・連続スペース整理）
function norm(s) {
  return s?.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

// CORS & セキュリティ系ヘッダ
function baseHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store"
  };
}

export const handler = async (event) => {
  const headers = baseHeaders(event.headers.origin);

  // CORS プリフライト
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers, body: "" };
  }

  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ ok: false })
    };
  }

  try {
    const { keyword } = JSON.parse(event.body || "{}");
    const q = norm(keyword);
    if (!q) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: false })
      };
    }

    // キー完全一致 or aliases 完全一致を探す
    let hit = null;

    for (const [key, value] of Object.entries(PDF_MAP)) {
      if (norm(key) === q) {
        hit = value;
        break;
      }
      const aliases = Array.isArray(value.aliases) ? value.aliases : [];
      if (aliases.some(a => norm(a) === q)) {
        hit = value;
        break;
      }
    }

    if (!hit || !hit.url) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ ok: false })
      };
    }

    return {
      statusCode: 200,
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({
        ok: true,
        data: { title: hit.title, url: hit.url }
      })
    };
  } catch (e) {
    console.error("lookup error:", e);
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ ok: false })
    };
  }
};
