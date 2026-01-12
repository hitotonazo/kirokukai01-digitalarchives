// functions/pdfs/[...path].js
// /pdfs/〇〇.pdf へのアクセスを R2 から取得して返す（R2は非公開のまま）

export async function onRequestGet({ params, env }) {
  const raw = params.path ?? [];
  const parts = Array.isArray(raw) ? raw : [raw];

  // URLエンコード対策（日本語ファイル名必須）
  const decoded = parts.map((p) => decodeURIComponent(p));

  // まずあなたのR2構成に合わせて pdfs/ を付ける
  const keyA = `pdfs/${decoded.join("/")}`;
  const objA = await env.PDF_BUCKET.get(keyA);
  if (objA) {
    return new Response(objA.body, {
      headers: { "Content-Type": "application/pdf" },
    });
  }

  // もしR2が「直下キー」だった場合も試す（保険）
  const keyB = decoded.join("/");
  const objB = await env.PDF_BUCKET.get(keyB);
  if (objB) {
    return new Response(objB.body, {
      headers: { "Content-Type": "application/pdf" },
    });
  }

  // どっちで探したか表示（ここが超重要）
  return new Response(
    `Not Found\nkeyA=${keyA}\nkeyB=${keyB}\nraw=${JSON.stringify(raw)}\ndecoded=${JSON.stringify(decoded)}`,
    { status: 404, headers: { "content-type": "text/plain; charset=utf-8" } }
  );
}
