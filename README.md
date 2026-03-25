# R2 Worker

Cloudflare Worker that proxies requests from `TARGET_URL` to an R2 bucket's public URL.

## change wrangler.toml

```json
[[routes]]
pattern = "content.r24.dev/*"   //intneded url
zone_name = "r24.dev"    //root domain
```



## Setup

### 1. Project Init

```bash

npm install wrangler --save-dev

```

### 2. DNS Record

Add the following DNS record on the Cloudflare account that owns `lpu.social`:

| Type | Name    | Content | Proxy |
|------|---------|---------|-------|
| AAAA | content | `100::` | ON    |

### 3. Environment Variables

Create a `.dev.vars` file for local development:

```
R2_URL=https://pub-<hash>.r2.dev
TARGET_URL=https://content.lpu.social
```

### 4. Login & Deploy

```bash
npx wrangler login
npx wrangler deploy

```

### 5. Add Secrets

```bash
npx wrangler secret put R2_URL
# Paste: https://pub-<hash>.r2.dev

npx wrangler secret put TARGET_URL
# Paste: https://content.r24.dev
```

### 4. ReDeploy 

```bash
npx wrangler deploy
```

### 7. Test

```
https://content.lpu.social/custom_voice.onnx
```

## Environment Variables

| Variable     | Description                        |
|--------------|------------------------------------|
| `R2_URL`     | Public R2 bucket URL               |
| `TARGET_URL` | Allowed CORS origin                |

## Logs

Observability is enabled. View logs at:
**Cloudflare Dashboard → Workers → r2-worker → Logs**
