# Framinator

Instagram carousel builder. Compositing runs in your browser; photos never leave your device.

**Live:** https://framinator.skarpa.dev

## Dev

```bash
npm install && npm run dev
```

## Deploy

Coolify + root `docker-compose.yml`, domain `framinator.skarpa.dev`. See [home_server_iac compose](https://github.com/TomasSkarpa/home_server_iac/tree/main/compose/coolify/framinator).

## What it does

- Upload up to 10 photos
- Templates: polaroid, clean carousel, Kodak strip
- Crop, film filters, live feed preview, profile mockup
- Export: per-slide save/share overlay (+ ZIP on desktop)
- Autosave on device (IndexedDB)
