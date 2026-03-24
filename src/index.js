export default {
  async fetch(request, env, ctx) {
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

    // Strip query params for a clean cache key
    const cacheUrl = new URL(url.pathname, url.origin);
    const cacheKey = new Request(cacheUrl.toString(), { method: "GET" });
    const cache = caches.default;

    // 1. Check cache first
    const cached = await cache.match(cacheKey);
    if (cached) {
      return cached;
    }

    // 2. Cache miss — fetch from R2 public URL
    const r2Url = `${env.R2_URL}/${key}`;
    const r2Response = await fetch(r2Url);

    if (!r2Response.ok) {
      return new Response("Not Found", { status: 404, headers: corsHeaders });
    }

    // 3. Build cacheable response with 60-day TTL
    const headers = new Headers(r2Response.headers);
    headers.set("Cache-Control", "public, max-age=5184000, s-maxage=5184000, immutable");
    Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

    const response = new Response(r2Response.body, { headers });

    // 4. Store in cache (non-blocking)
    ctx.waitUntil(cache.put(cacheKey, response.clone()));

    return response;
  },
};
