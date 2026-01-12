// functions/pdfs/[...path].js
// /pdfs/〇〇.pdf へのアクセスを R2 から取得して返す（R2は非公開のまま）

export async function onRequestGet({ params, env }) {
  // [[path]] は配列で来ることが多いが、環境差があるので両対応
  const raw = params.path ?? [];
  const parts = Array.isArray(raw) ? raw : [raw];

  // ここが重要：URLエンコードを必ずデコードする
  const decodedParts = parts.map((p) => decodeURIComponent(p));

  // R2のキー（あなたのR2構造に合わせて pdfs/ を付ける）
  const key = `pdfs/${decodedParts.join("/")}`;

  const obj = await env.PDF_BUCKET.get(key);
  if (!obj) {
    // デバッグ用：今探しに行ってるキーを返す（直ったら消してOK）
    return new Response(`Not Found: ${key}`, { status: 404 });
  }

  return new Response(obj.body, {
    headers: {
      "Content-Type": "application/pdf",
      "Cache-Control": "private, max-age=300",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
