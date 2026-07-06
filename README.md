# Framinator

Instagram carousel builder. Compositing runs in your browser; photos never leave your device.

**Live:** https://framinator.skarpa.dev

## Dev

```bash
npm install && npm run dev
```

## Deploy

Coolify + root `docker-compose.yml`, domain `framinator.skarpa.dev`. See [home_server_iac compose](https://github.com/TomasSkarpa/home_server_iac/tree/main/compose/coolify/framinator).

Smart layout: set `GEMINI_API_KEY` and optional `GEMINI_API_KEY_FALLBACK` in Coolify (not in git). Fallback is used on rate limit.

## What it does

- Upload up to 25 photos
- Templates: polaroid, clean carousel, Kodak strip, layered prints
- Crop, film filters, live feed preview, profile mockup
- Export: per-slide save/share overlay (+ ZIP on desktop)
- Autosave on device (IndexedDB)
