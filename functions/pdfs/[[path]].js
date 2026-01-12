// functions/pdfs/[...path].js
// /pdfs/〇〇.pdf へのアクセスを R2 から取得して返す（R2は非公開のまま）

export async function onRequestGet({ params, env, request }) {
  // params.path は配列になる（例: ["広報こだま.pdf"] や ["sub", "a.pdf"]）
  const parts = params.path || [];
  const key = `pdfs/${parts.join("/")}`;

  // ★（任意）アクセス制御：referer / cookie / token などで縛れる
  // 例：直叩き対策（最低限）
  // const ref = request.headers.get("Referer") || "";
  // if (!ref.includes("あなたのPagesドメイン")) {
  //   return new Response("Forbidden", { status: 403 });
  // }

  // R2から取得
  const obj = await env.PDF_BUCKET.get(key);

  if (!obj) {
    return new Response("Not Found", { status: 404 });
  }

  // Content-Type 等を設定
  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set("Cache-Control", "private, max-age=300"); // ARGなら短め推奨
  headers.set("X-Content-Type-Options", "nosniff");

  // ファイル名（日本語OK）をダウンロード名として指定したい場合（任意）
  // headers.set("Content-Disposition", `inline; filename*=UTF-8''${encodeURIComponent(parts.at(-1) || "doc.pdf")}`);

  // R2オブジェクトのメタデータがあれば継承
  const httpMeta = obj.httpMetadata;
  if (httpMeta?.contentDisposition) headers.set("Content-Disposition", httpMeta.contentDisposition);
  if (httpMeta?.cacheControl) headers.set("Cache-Control", httpMeta.cacheControl);

  return new Response(obj.body, { headers });
}
