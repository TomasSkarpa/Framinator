# Deployment

Three environments on Coolify, one repo, no release branch.

| Stage | URL | How it deploys |
|-------|-----|----------------|
| **PR preview** | `https://<pr-id>.framinator.skarpa.dev` | Coolify Preview Deployments (GitHub App, automatic) |
| **Dev** | https://dev-framinator.skarpa.dev | Coolify, automatic on push to `develop` |
| **Prod** | https://framinator.skarpa.dev | Coolify, manual via GitHub Actions **Release to production** |

Flow: open PR → Coolify deploys preview → merge to `develop` → dev updates → merge `develop` → `main` → release workflow → prod.

Example: PR #5 → `https://5.framinator.skarpa.dev`

## Local

```bash
cp .env.example .env.local   # GEMINI keys if you test smart layout
npm install && npm run dev   # http://localhost:3000
```

Prod-parity Docker (optional):

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

## DNS

| Record | Purpose |
|--------|---------|
| `*.framinator.skarpa.dev` A → server IP | PR previews (`5.framinator.skarpa.dev`, etc.) |
| `dev-framinator.skarpa.dev` A → server IP | Dev instance |
| `framinator.skarpa.dev` A → server IP | Prod |

TLS: Traefik HTTP-01 per preview hostname. Wildcard DNS is enough.

Optional: Coolify **Server → Wildcard Domain** = `https://framinator.skarpa.dev`.

## Coolify dev + previews (`framinator-dev`)

One Coolify project handles **both** integration dev and PR previews (PRs target `develop`).

1. Project **framinator-dev** → Docker Compose → GitHub repo `TomasSkarpa/framinator`.
2. **GitHub App:** `tomas-skarpa` (Preview Deployments permission enabled when registering the app).
3. **Branch:** `develop`. **Auto deploy on push:** on.
4. **Compose:** `docker-compose.yml` + `docker-compose.dev.yml`.
5. **Domain:** `https://dev-framinator.skarpa.dev` on the `framinator` service.
6. **Preview Deployments:** enabled. **Automated preview deploy:** on.
7. **Preview URL template:** `{{pr_id}}.framinator.skarpa.dev`
8. **Service domain for previews:** also set `https://framinator.skarpa.dev:3000` if Coolify asks (port tells Traefik where to route).
9. **Env:** `GEMINI_API_KEY`, optional `GEMINI_API_KEY_FALLBACK`.

Open a PR → Coolify builds → URL appears in Coolify UI and as a GitHub PR comment. Close PR → preview removed automatically.

No GitHub Actions workflow needed for previews.

Reference: [home_server_iac compose/coolify/framinator-dev](https://github.com/TomasSkarpa/home_server_iac/tree/main/compose/coolify/framinator-dev).

## Coolify prod (`framinator`)

1. Branch **`main`**. **Auto deploy off**.
2. **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`.
3. **Domain:** `https://framinator.skarpa.dev`.
4. **Preview Deployments:** off.
5. **Deploy webhook** → GitHub secret `COOLIFY_DEPLOY_WEBHOOK_PROD`.

Release: GitHub → Actions → **Release to production** → confirm `release`.

## GitHub secrets

| Secret | Used by |
|--------|---------|
| `COOLIFY_DEPLOY_WEBHOOK_PROD` | Release to production workflow |

Preview deploys use the Coolify GitHub App only (no repo secrets).

## Uptime Kuma

| URL | Monitor |
|-----|---------|
| https://framinator.skarpa.dev/api/health | required (prod) |
| https://dev-framinator.skarpa.dev/api/health | optional |
| PR previews | skip |
