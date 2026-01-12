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

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "Invalid JSON" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  const keywordRaw = (body.keyword ?? "").toString().trim();
  if (!keywordRaw) {
    return new Response(JSON.stringify({ ok: false, error: "keyword is required" }), {
      status: 400,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // Pages の静的ファイル（/PDF_MAP.json）を Functions から読む
  // ※ PDF_MAP.json はリポジトリ直下に置いてください（今アップしてる場所でOK）
  const mapResp = await env.ASSETS.fetch(new Request(new URL("/PDF_MAP.json", request.url)));
  if (!mapResp.ok) {
    return new Response(JSON.stringify({ ok: false, error: "PDF_MAP.json not found" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }
  const PDF_MAP = await mapResp.json();

  // 正規化（全角空白も潰す・大小は必要ならここで）
  const keyword = keywordRaw.replace(/[\u3000\s]+/g, " ").trim();

  const hit = PDF_MAP[keyword];
  if (!hit) {
    return new Response(JSON.stringify({ ok: false, error: "not found" }), {
      status: 404,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // hit には { title, file } みたいなのが入ってる想定
  const file = hit.file ?? hit.filename ?? hit.path;
  if (!file) {
    return new Response(JSON.stringify({ ok: false, error: "map item missing file" }), {
      status: 500,
      headers: { "content-type": "application/json; charset=utf-8" },
    });
  }

  // PDF はあなたの /pdfs/ ルート（= functions/pdfs/[[path]].js）で配る
  const url = `/pdfs/${encodeURIComponent(file)}`;

  return new Response(JSON.stringify({ ok: true, title: hit.title ?? file, url }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

