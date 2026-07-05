# Framinator

Instagram carousel builder. All image compositing runs client-side in the browser; photos never reach the server.

**Live:** https://framinator.skarpa.dev

## Stack

- Next.js 16 (App Router)
- Tailwind CSS + shadcn-style components
- Canvas 2D compositing (export at 1080×1350 or 1080×1080)
- IndexedDB autosave for resume
- PWA manifest for Add to Home Screen

## Local dev

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Docker

```bash
docker compose up --build
```

## Deploy (Coolify)

Connect this repo in Coolify, use root `docker-compose.yml`, set domain `framinator.skarpa.dev`. No env vars required.

Reference compose also lives in [home_server_iac](https://github.com/TomasSkarpa/home_server_iac) under `compose/coolify/framinator/`.

## Features

- Photo selection (gallery picker + drag-and-drop, max 10)
- Four templates: Grid split, Framed polaroid, Clean carousel, Story arc
- Slide reorder (drag), crop/focal point, filters, borders
- Live preview at Instagram aspect ratio
- Export all slides as numbered JPEGs in a ZIP
- Autosave + resume via IndexedDB
