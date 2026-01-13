// /functions/lookup.js (Cloudflare Pages Functions)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

function jsonResponse(obj, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: {
      ...CORS,
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export async function onRequestOptions() {
  return new Response(null, { headers: CORS });
}

export async function onRequestPost({ request }) {
  try {
    const body = await request.json().catch(() => ({}));
    const keyword = (body.keyword ?? "").toString().trim();

    if (!keyword) return jsonResponse({ ok: false, error: "empty keyword" });

    // ★同一サイト上の静的JSONを読み込む（/PDF_MAP.json が 200 で見えてる前提）
    const mapUrl = new URL("/PDF_MAP.json", request.url);
    const pdfMap = await fetch(mapUrl, { cf: { cacheTtl: 60 } }).then((r) => r.json());

    // 検索（キー一致 or aliases内一致）
    let hit = pdfMap[keyword];
    if (!hit) {
      const values = Object.values(pdfMap);
      hit = values.find((v) => {
        const aliases = Array.isArray(v.aliases) ? v.aliases : [];
        return v.title === keyword || aliases.includes(keyword);
      });
    }

    if (!hit) return jsonResponse({ ok: false });

    return jsonResponse({ ok: true, data: { title: hit.title, url: hit.url } });
  } catch (e) {
    // ここで落ちると 500 になるので、必ずJSONで返す
    return jsonResponse({ ok: false, error: String(e) }, 500);
  }
}
