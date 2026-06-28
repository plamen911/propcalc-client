# Deployment

This frontend is hosted on **Cloudflare Pages**.

- **Live site:** https://propcalc-dy7.pages.dev/
- **Cloudflare project:** `propcalc` (Workers & Pages → propcalc)
- **Build output:** `dist/` (static files produced by Vite)

## How it actually deploys (important)

This is a Cloudflare Pages **Direct Upload** project — there is **no GitHub
Git integration connected** (Settings → Build → Git repository shows
*"Connect"*, not a linked repo).

Consequences:

- **`git push` does NOT deploy anything.** There is no webhook/CI. Pushing to
  GitHub only updates the source repo.
- Deployment is **manual**: build locally, then upload `dist/` with
  **Wrangler** (`wrangler pages deploy`).
- Wrangler auto-detects local git metadata (branch, commit hash, commit
  message) at deploy time and attaches it to the deployment. That's why the
  dashboard's Deployments list shows real commit messages even though no repo
  is connected — the metadata comes from *your local git*, not from Cloudflare
  reading GitHub.

```
Local machine                              Cloudflare Pages
─────────────                              ────────────────
npm run build            →  dist/
npx wrangler pages deploy dist  ─────────►  new deployment
   (reads local git branch/commit)          → propcalc-dy7.pages.dev
```

## One-time setup: authenticate Wrangler

Wrangler needs Cloudflare credentials. Pick **one**:

### Option A — Interactive login (recommended for laptop deploys)

Run in your own Terminal (needs a browser for the OAuth flow):

```bash
npx wrangler login
```

The credential is cached after the first login; subsequent deploys don't
re-prompt.

### Option B — API token (for scripted/non-interactive deploys)

1. Create a token at https://dash.cloudflare.com/profile/api-tokens using the
   **"Edit Cloudflare Workers"** template (includes Pages deploy permission),
   or a custom token with **Account → Cloudflare Pages → Edit**.
2. Export it before deploying (do not commit it):

```bash
export CLOUDFLARE_API_TOKEN=your_token_here
```

## Deploying

### Easiest — the deploy script

```bash
./deploy.sh           # build + deploy
npm run deploy        # same thing, via package.json

./deploy.sh --skip-build   # deploy the existing dist/ without rebuilding
```

`deploy.sh` will:
1. Verify the **production** API URL is the active one in
   `src/services/api.js` (warns before shipping the local/dev URL).
2. Run `npm run build`.
3. Run `npx wrangler pages deploy dist --project-name=propcalc`.

### Manual — the raw commands

```bash
npm run build
npx wrangler pages deploy dist --project-name=propcalc
```

### Dashboard — no CLI

Cloudflare dashboard → Workers & Pages → `propcalc` → **Create deployment** →
upload the `dist/` folder.

## Pre-deploy checklist

- [ ] **API URL is production.** In `src/services/api.js`, the active line must
      be `const API_URL = 'https://propcalc.zastrahovaite.com/';` and the
      `127.0.0.1:8000` line must stay commented. This value is baked into the
      bundle at build time (there is no `.env`).
- [ ] `npm run lint` passes.
- [ ] `npm run build` succeeds.
- [ ] Wrangler is authenticated (Option A or B above).

## Notes

- Cloudflare Pages keeps every deployment at its own preview URL
  (`https://<hash>.propcalc-dy7.pages.dev`); the latest production deploy is
  served at the bare `propcalc-dy7.pages.dev`.
- To make `git push`-triggered deploys work in the future, you'd connect the
  GitHub repo under Settings → Build → Git repository → **Connect** (build
  command `npm run build`, output dir `dist`). Until then, deploys are manual.
