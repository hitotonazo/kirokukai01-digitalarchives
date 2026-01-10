// functions/lookup.js (Cloudflare Pages Functions)

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



function norm(s) {
  return s?.toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0));
}

function baseHeaders(origin) {
  return {
    "Access-Control-Allow-Origin": origin || "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Cache-Control": "no-store"
  };
}

export async function onRequest({ request }) {
  const origin = request.headers.get("Origin");
  const headers = baseHeaders(origin);

  if (request.method === "OPTIONS") {
    return new Response("", { status: 200, headers });
  }
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ ok:false }), { status: 405, headers });
  }

  try {
    const { keyword } = await request.json();
    const q = norm(keyword);
    if (!q) return new Response(JSON.stringify({ ok:false }), { status: 200, headers });

    let hit = null;
    for (const [key, value] of Object.entries(PDF_MAP)) {
      if (norm(key) === q) { hit = value; break; }
      const aliases = Array.isArray(value.aliases) ? value.aliases : [];
      if (aliases.some(a => norm(a) === q)) { hit = value; break; }
    }

    if (!hit || !hit.url) {
      return new Response(JSON.stringify({ ok:false }), { status: 200, headers });
    }

    return new Response(JSON.stringify({ ok:true, data:{ title: hit.title, url: hit.url } }), {
      status: 200,
      headers: { ...headers, "Content-Type": "application/json" }
    });
  } catch (e) {
    return new Response(JSON.stringify({ ok:false }), { status: 200, headers });
  }
}

