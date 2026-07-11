# Framinator

Instagram carousel builder. Compositing runs in your browser; photos never leave your device.

**Live:** https://framinator.skarpa.dev  
**Dev:** https://dev-framinator.skarpa.dev

## Dev

```bash
npm install && npm run dev
```

Copy `.env.example` → `.env.local` if you test smart layout (`GEMINI_API_KEY`).

## Deploy

**Feature preview** → open a PR targeting `develop` → `https://<pr-id>.framinator.skarpa.dev` (native Coolify preview).
**Dev** → merge to `develop` → `dev-framinator.skarpa.dev`.  
**Prod** → merge to `main` → `framinator.skarpa.dev`.

Full setup: [docs/deploy.md](docs/deploy.md).

Smart layout crop alignment debug:

```bash
npm run debug:smart-layout-alignment
```

See `docs/smart-layout-alignment-debug.md` for the horizontal, vertical, and zoom debug process.

## What it does

- Upload up to 25 photos
- Templates: polaroid, clean carousel, Kodak strip, layered prints
- Crop, film filters, live feed preview, profile mockup
- Export: per-slide save/share overlay (+ ZIP on desktop)
- Autosave on device (IndexedDB)
