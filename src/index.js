export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const key = url.pathname.slice(1);

    const corsHeaders = {
      "Access-Control-Allow-Origin": env.TARGET_URL || "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
    };

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== "GET" && request.method !== "HEAD") {
      return new Response("Method Not Allowed", { status: 405 });
    }

    if (!key) {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }

    const r2Url = `${env.R2_URL}/${key}`;
    const r2Response = await fetch(r2Url);

    if (!r2Response.ok) {
      const errorBody = await r2Response.text();
      return new Response(
        JSON.stringify({
          status: r2Response.status,
          url: r2Url,
          error: errorBody,
        }),
        { status: r2Response.status, headers: { ...corsHeaders, "content-type": "application/json" } }
      );
    }

    const headers = new Headers(r2Response.headers);
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(r2Response.body, { headers });
  },
};
