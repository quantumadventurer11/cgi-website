# Celestial Governance Initiative Website

Production-grade website and membership application backend for the Celestial Governance Initiative (CGI), under the Democracy and Federalism Hub and affiliated with the Space Generation Advisory Council.

## What Is Included

- Polished single-page public website with generated WebP background assets, scroll animation, reduced-motion support, and responsive team profiles.
- Node.js + Express API for membership applications.
- Durable Neon Postgres support for Vercel, with SQLite persistence through `better-sqlite3` for local development and Docker.
- Nodemailer notification and applicant confirmation emails, with console fallback in development.
- Protected admin API and branded admin interface at `/admin.html`.
- Docker, Docker Compose, GitHub Actions CI, and automated backend tests.

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

The site runs at `http://localhost:3000`. The API health check is available at `http://localhost:3000/api/health`.

## Testing

```bash
npm audit --audit-level=high
npm test
```

The automated test suite covers health checks, public application validation, honeypot rejection, persistence, admin authentication, admin listing, and status updates. GitHub Actions runs install, audit, and tests on pushes to `main` and pull requests.

## Environment

Copy `.env.example` to `.env` and set:

- `PORT`: HTTP port, default `3000`.
- `NODE_ENV`: use `development` locally and `production` in deployment.
- `ADMIN_TOKEN`: long random secret for admin API access.
- `DATABASE_URL` or `POSTGRES_URL`: Neon Postgres connection string for Vercel production. Leave unset locally to use SQLite.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP credentials.
- `MAIL_FROM`: sender identity, default `CGI Website <no-reply@dfh.org.il>`.
- `MAIL_TO`: application notification recipient, default `cgi@dfh.org.il`.

If SMTP is not configured, submitted applications are still saved and both emails are logged to the server console for development testing.

## API

- `GET /api/health` returns `{ "ok": true }`.
- `POST /api/applications` accepts `{ fullName, email, affiliation?, areaOfInterest?, message?, website? }`. The `website` field is a honeypot and must be empty.
- `GET /api/admin/applications` requires `Authorization: Bearer <ADMIN_TOKEN>` or `x-admin-token`.
- `PATCH /api/admin/applications/:id` requires the same token and accepts `{ "status": "new" | "reviewed" | "contacted" }`.

## Admin View

Open `http://localhost:3000/admin.html`, enter the configured `ADMIN_TOKEN`, and load applications. Status changes are written through the protected admin API.

## Docker

```bash
cp .env.example .env
docker compose up --build
```

SQLite data is persisted in the `cgi-data` Docker volume mounted at `/app/data`.

## Deployment

Deploy the container behind Nginx, Caddy, Traefik, or a platform-managed TLS proxy. A typical VPS deployment points a subdomain such as `cgi.dfh.org.il` to the host, terminates TLS at the reverse proxy, and forwards traffic to port `3000`.

### Vercel + Neon

This repository includes `vercel.json` and `api/index.js` so Vercel can serve `public/` through its CDN and run the Express API as a Vercel Function.

```bash
npx vercel install neon
npx vercel env add ADMIN_TOKEN production
npx vercel env add NODE_ENV production
npx vercel env add MAIL_TO production
npx vercel env add MAIL_FROM production
npx vercel --prod
```

Recommended Vercel environment variables:

- `DATABASE_URL` or `POSTGRES_URL`, provided by the Neon Marketplace integration.
- `NODE_ENV=production`
- `ADMIN_TOKEN=<long random string>`
- `MAIL_TO=cgi@dfh.org.il`
- `MAIL_FROM=CGI Website <no-reply@dfh.org.il>`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` when production mail credentials are ready

The app automatically uses Neon when `DATABASE_URL` or `POSTGRES_URL` is present. If neither is present, it falls back to SQLite locally and to temporary `/tmp` SQLite on Vercel; that temporary Vercel fallback is useful for smoke testing but not durable production storage.

### Render

This repository includes `render.yaml` for a Render Web Service with a persistent disk mounted at `/var/data` and `SQLITE_PATH=/var/data/cgi.sqlite`.

1. Connect `https://github.com/quantumadventurer11/cgi-website` in Render.
2. Create the Blueprint/Web Service from `render.yaml`.
3. Confirm the service is on a paid plan that supports persistent disks.
4. Provide `SMTP_HOST`, `SMTP_USER`, and `SMTP_PASS` when prompted, or leave SMTP unset to use the console fallback until mail credentials are ready.
5. Keep `MAIL_TO=cgi@dfh.org.il` and allow Render to generate `ADMIN_TOKEN`.
6. After deploy, verify `/api/health`, submit the public application form, and use `/admin.html` with the generated admin token.

Recommended production checklist:

- Set `NODE_ENV=production`.
- Set a long random `ADMIN_TOKEN`.
- Configure SMTP credentials and keep `MAIL_TO=cgi@dfh.org.il`.
- Persist `/app/data` with a Docker volume or host mount.
- Put the app behind HTTPS.
- Restrict firewall access to ports 80/443 plus SSH.
- Configure backups for the SQLite volume.
- Run `npm audit --audit-level=high` and `npm test` before deployment.

For reliable confirmation email delivery, configure SPF and DKIM for the sending domain used in `MAIL_FROM`.

The `public/` folder can also be deployed as a static-only fallback on GitHub Pages, Netlify, or similar hosts. In that mode, the application form will not persist submissions, but the mailto fallback to `cgi@dfh.org.il` remains available.

## Visual Assets

Generated background assets live in `public/assets/`:

- `hero-celestial-governance.webp`
- `projects-research-field.webp`
- `origins-space-law.webp`
- `join-research-forum.webp`

They are intentionally abstract, text-free, and optimized for use beneath navy/gold overlays.
