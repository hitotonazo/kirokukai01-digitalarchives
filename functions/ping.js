export const onRequestGet = () =>
  new Response("pong-from-functions", {
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
