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

    // Fetch from R2 with Cloudflare CDN caching (global, per PoP)
    const r2Url = `${env.R2_URL}/${key}`;
    const r2Response = await fetch(r2Url, {
      cf: {
        cacheEverything: true,
        cacheTtl: 5184000,
      },
    });

    if (!r2Response.ok) {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }

    const headers = new Headers(r2Response.headers);
    headers.set("Cache-Control", "public, max-age=5184000, s-maxage=5184000, immutable");
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    return new Response(r2Response.body, {
      status: r2Response.status,
      headers,
    });
  },
};
