# Der Stern — Project Guide

## Deployment

**Live site:** https://der-stern-dev.netlify.app  
**Platform: Netlify ONLY. Never Vercel.**

Every push to `main` triggers an automatic deploy via GitHub Actions → Netlify.  
No manual steps required — just push to `main`.

**GitHub Actions workflow:** `.github/workflows/netlify-deploy.yml`  
**Netlify site ID:** `c845c816-b371-4223-8f4b-60ff18417f44`

If a manual deploy is ever needed:
```bash
NETLIFY_AUTH_TOKEN=nfp_spFETBh8ctQ4BwpRDVQ8JhXJDvdDWKEgab46 npx netlify deploy --dir=dist --prod --site=c845c816-b371-4223-8f4b-60ff18417f44
```

## Tech Stack

- React + TypeScript + Vite
- Supabase (PostgreSQL + Auth)
- Tailwind CSS
- React PDF for invoice generation

## Development

```bash
npm install
npm run dev      # local dev server
npm run build    # production build → dist/
```

## GitHub Repo

`Aji029/der-stern` — branch `main` is production.
