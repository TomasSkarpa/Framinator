# Deployment

Three environments on Coolify, one repo, no release branch.

| Stage | URL | How it deploys |
|-------|-----|----------------|
| **Branch preview** | `https://<branch-slug>.framinator.skarpa.dev` | Coolify preview + GitHub Actions (open PR required) |
| **Dev** | https://dev-framinator.skarpa.dev | Coolify, automatic on push to `develop` |
| **Prod** | https://framinator.skarpa.dev | Coolify, manual via GitHub Actions **Release to production** |

Flow: feature branch + PR → preview URL → merge to `develop` → dev auto-updates → merge `develop` → `main` → release workflow → prod.

Branch slug rules: lowercase, non-alphanumeric → `-`, max 63 chars (`feature/cool-carousel` → `feature-cool-carousel`).

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
| `*.framinator.skarpa.dev` A → server IP | Branch previews (wildcard) |
| `dev-framinator.skarpa.dev` A → server IP | Dev instance |
| `framinator.skarpa.dev` A → server IP | Prod |

TLS: Traefik HTTP-01 issues a cert per preview hostname as previews are created. Wildcard DNS is enough; wildcard cert is not required.

Optional: Coolify **Server → Wildcard Domain** = `https://framinator.skarpa.dev`.

## Coolify branch previews (`framinator-previews`)

Third Coolify project for PR previews (separate from dev/prod so Traefik labels do not clash).

1. New project **framinator-previews** → Docker Compose → GitHub repo `TomasSkarpa/framinator`.
2. **Branch:** `develop` (PRs target develop). **Auto deploy on push:** **off**.
3. **Preview Deployments:** enabled. **Automated preview deploy:** **off** (GitHub Actions sets the URL template and triggers deploy).
4. **Compose files:** `docker-compose.yml` + `docker-compose.preview.yml`.
5. **Service domain (UI):** `https://framinator.skarpa.dev:3000` on the `framinator` service (Coolify uses this as the base for preview FQDN generation).
6. **Preview URL template (initial):** `placeholder.framinator.skarpa.dev` (overwritten per deploy by GitHub Actions).
7. **Env:** `GEMINI_API_KEY`, optional `GEMINI_API_KEY_FALLBACK`.
8. Copy the application **UUID** for GitHub secrets.

Preview URL is set per deploy to `{branch-slug}.framinator.skarpa.dev`. Coolify only supports `{{pr_id}}` in templates natively; the workflow patches the template from the PR branch name before calling the deploy API.

**Requires an open PR** for the branch. Push-only without a PR skips deploy (logged in Actions).

Reference: [home_server_iac compose/coolify/framinator-previews](https://github.com/TomasSkarpa/home_server_iac/tree/main/compose/coolify/framinator-previews).

## Coolify dev (`framinator-dev`)

1. Project **framinator-dev** → repo, branch **`develop`**, **auto deploy on**.
2. **Compose:** `docker-compose.yml` + `docker-compose.dev.yml`.
3. **Domain:** `https://dev-framinator.skarpa.dev`.
4. **Env:** Gemini keys.

## Coolify prod (`framinator`)

1. Branch **`main`**, **auto deploy off**.
2. **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`.
3. **Domain:** `https://framinator.skarpa.dev`.
4. **Deploy webhook** → GitHub secret `COOLIFY_DEPLOY_WEBHOOK_PROD`.

Release: GitHub → Actions → **Release to production** → confirm `release`.

## GitHub secrets

| Secret | Used by |
|--------|---------|
| `COOLIFY_URL` | Branch preview workflow (e.g. `https://coolify.skarpa.dev`) |
| `COOLIFY_TOKEN` | Branch preview workflow (Coolify → Security → API Tokens, deploy + write) |
| `COOLIFY_PREVIEWS_APP_UUID` | Branch preview workflow (framinator-previews app UUID) |
| `COOLIFY_DEPLOY_WEBHOOK_PROD` | Release to production workflow |

Enable Coolify API: Coolify → Settings → API → Enable.

## Uptime Kuma

| URL | Monitor |
|-----|---------|
| https://framinator.skarpa.dev/api/health | required (prod) |
| https://dev-framinator.skarpa.dev/api/health | optional |
| Branch previews | skip |

## Limitations

- One preview URL template per Coolify app: concurrent PR deploys can race if two run at once. Usually fine for solo work; re-run Actions if a preview gets the wrong host.
- Reserved: do not use branch slug `dev` expecting dev-framinator (dev uses a separate hostname).
