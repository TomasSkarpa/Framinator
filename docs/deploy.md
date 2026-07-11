# Deployment

Three environments on Coolify, one repo, no release branch.

| Stage | URL | How it deploys |
|-------|-----|----------------|
| **Branch preview** | `https://<pr-id>.framinator.skarpa.dev` | Native Coolify preview for PRs targeting `develop` |
| **Dev** | https://dev-framinator.skarpa.dev | Coolify, automatic on push to `develop` |
| **Prod** | https://framinator.skarpa.dev | Coolify, manual via GitHub Actions **Release to production** |

Flow: feature branch + PR → preview URL → merge to `develop` → dev auto-updates → merge `develop` → `main` → release workflow → prod.

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

## Coolify branch previews

PR previews are native preview deployments on the existing **framinator-dev** application.

1. Use the GitHub App source for `TomasSkarpa/framinator`.
2. Configure branch **`develop`** and automatic deployment on push.
3. Use `docker-compose.yml` + `docker-compose.dev.yml`.
4. Set the application domain in Coolify to `https://dev-framinator.skarpa.dev`.
5. Enable Preview Deployments and automated preview deployment.
6. Set the preview URL template to `{{pr_id}}.framinator.skarpa.dev`.
7. Keep custom Traefik labels out of the Compose files. Coolify must generate unique routers and services for dev and each PR.
8. Set preview-scoped Gemini environment variables in Coolify as needed.

Only PRs targeting the application's configured `develop` branch are previewed here. Existing PRs may need **Load Pull Requests** once after enabling previews.

## Coolify dev (`framinator-dev`)

1. Project **framinator-dev** → repo, branch **`develop`**, **auto deploy on**.
2. **Compose:** `docker-compose.yml` + `docker-compose.dev.yml`.
3. **Domain:** `https://dev-framinator.skarpa.dev`, configured in Coolify rather than Compose labels.
4. **Env:** Gemini keys.

## Coolify prod (`framinator`)

1. Branch **`main`**, **auto deploy off**.
2. **Compose:** `docker-compose.yml` + `docker-compose.prod.yml`.
3. **Domain:** `https://framinator.skarpa.dev`.
4. **Deploy:** GitHub Actions **Release to production** calls the Coolify API (`COOLIFY_URL` + `COOLIFY_TOKEN` + `COOLIFY_PROD_APP_UUID`). Auto deploy stays off so prod only updates on an explicit release.
5. Production previews are optional and only apply to PRs targeting `main`; feature previews targeting `develop` belong to `framinator-dev`.
Release: GitHub → Actions → **Release to production** → confirm `release`.

## GitHub secrets

| Secret | Used by |
|--------|---------|
| `COOLIFY_URL` | Release to production |
| `COOLIFY_TOKEN` | Release to production |
| `COOLIFY_PROD_APP_UUID` | Release to production (Coolify app `framinator`, branch `main`) |
| `COOLIFY_PREVIEWS_APP_UUID` | Legacy; native Coolify previews no longer use the deleted branch-preview workflow |

## Uptime Kuma

| URL | Monitor |
|-----|---------|
| https://framinator.skarpa.dev/api/health | required (prod) |
| https://dev-framinator.skarpa.dev/api/health | optional |
| Branch previews | skip |
