# Celestial Governance Institute Website

Production website and membership application backend for the Celestial Governance Institute (CGI), an independent, non-commercial research and policy institute for the governance of outer space. CGI is organizing toward Nova Scotia and federal Canadian not-for-profit registration.

## What Is Included

- Multi-page public website presenting CGI's mission, research library, project pages, topic explainers, governance framework, contributor functions, FAQ, glossary, and membership pathway.
- Node.js + Express API for membership applications.
- Durable Neon Postgres support for Vercel, with SQLite persistence through `better-sqlite3` for local development and Docker.
- Nodemailer notification and applicant confirmation emails, with console fallback in development.
- Protected named-account admin API and admin interface at `/admin.html`.
- Automated backend tests with Node's built-in test runner.
- SEO basics for public pages, including canonical URLs, sitemap, robots file, Open Graph metadata, Twitter card metadata, and structured data where appropriate.

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
npm run seo:check
npm run smoke:lunar
```

The automated test suite covers health checks, public routes, legacy redirects, public application validation, honeypot rejection, persistence, admin authentication, admin listing, and status updates.

The SEO check verifies public page titles, descriptions, canonical tags, social metadata, sitemap inclusion, crawlable links, and absence of legacy organization references.

The Lunar smoke test opens `/projects/lunar` in Playwright, verifies the Three.js canvas renders nonblank pixels on desktop and mobile, checks the sustainability section, and writes local screenshots to `.tmp/`.

The Lunar Project viewer uses local browser-ready NASA Scientific Visualization Studio CGI Moon Kit assets in `public/assets/moon/`. City positions are based on the CGI Q3 2026 Strategic Briefing and use planetocentric, east-positive lunar coordinates with NASA's 1737.4 km reference radius. Optimized local city GLB assets live in `public/assets/models/lunar/`; regenerate them with `node scripts/generate-lunar-models.mjs` and keep each city asset below roughly 500 KB.

## Environment

Copy `.env.example` to `.env` and set:

- `PORT`: HTTP port, default `3000`.
- `NODE_ENV`: use `development` locally and `production` in deployment.
- `ADMIN_TOKEN`: optional long random fallback secret for admin API access.
- `ADMIN_USERNAME`, `ADMIN_PASSWORD`: used by `npm run create-admin` to create or rotate a named admin account. Use a password of at least 16 characters.
- `DATABASE_URL` or `POSTGRES_URL`: Neon Postgres connection string for production. Leave unset locally to use SQLite.
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`: SMTP credentials.
- `MAIL_FROM`: sender identity, default `CGI Website <no-reply@celestialgovernance.org>`.
- `MAIL_TO`: application notification recipient, default `contact@celestialgovernance.org`.

If SMTP is not configured, submitted applications are still saved and both emails are logged to the server console for development testing.

## API

- `GET /api/health` returns `{ "ok": true }`.
- `POST /api/applications` accepts `{ fullName, email, affiliation?, areaOfInterest?, message?, website? }`. The `website` field is a honeypot and must be empty.
- `POST /api/admin/login` accepts `{ "username", "password" }` and returns a session token.
- `GET /api/admin/applications` requires `Authorization: Bearer <session token>`. The legacy `ADMIN_TOKEN` also remains accepted as a fallback.
- `PATCH /api/admin/applications/:id` requires the same authorization and accepts `{ "status": "new" | "reviewed" | "contacted" }`.

## Admin View

Create a named admin account, then open `http://localhost:3000/admin.html` and sign in:

```bash
ADMIN_USERNAME=dev-admin ADMIN_PASSWORD=<secure password> npm run create-admin
```

Status changes are written through the protected admin API.

## Deployment

Deploy the container behind Nginx, Caddy, Traefik, or a platform-managed TLS proxy. A typical deployment points the production domain to the host, terminates TLS at the reverse proxy, and forwards traffic to port `3000`.

Recommended production environment variables:

- `DATABASE_URL` or `POSTGRES_URL`
- `NODE_ENV=production`
- `ADMIN_TOKEN=<long random string>` as a fallback admin secret
- `ADMIN_USERNAME`, `ADMIN_PASSWORD` for creating the first named admin account
- `MAIL_TO=contact@celestialgovernance.org`
- `MAIL_FROM=CGI Website <no-reply@celestialgovernance.org>`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` when production mail credentials are ready

Recommended production checklist:

- Set `NODE_ENV=production`.
- Create a named admin account with `npm run create-admin` and keep a long random `ADMIN_TOKEN` fallback.
- Configure SMTP credentials and keep `MAIL_TO=contact@celestialgovernance.org`.
- Persist `/app/data` with a Docker volume, host mount, or managed database.
- Put the app behind HTTPS.
- Restrict firewall access to ports 80/443 plus SSH.
- Configure backups for the database.
- Run `npm audit --audit-level=high` and `npm test` before deployment.
- Run `npm run seo:check` before deployment.

For reliable confirmation email delivery, configure SPF and DKIM for the sending domain used in `MAIL_FROM`.

The `public/` folder can also be deployed as a static-only fallback on GitHub Pages, Netlify, or similar hosts. In that mode, the application form will not persist submissions, but the mailto fallback to `contact@celestialgovernance.org` remains available.

## Public Site Architecture

Core public routes are:

- `/` for the homepage.
- `/research` for the research library.
- `/projects/ostgap` and `/projects/lunar` for active project pages.
- `/publications/ostgap-report` for the OSTGAP publication landing page and citation block.
- `/topics` plus topic guides for outer space governance, treaty gaps, lunar governance, COPUOS policy, space resources governance, space settlement governance, and Articles II, VI, and IX.
- `/insights` plus short explainers.
- `/about`, `/team`, `/join`, `/glossary`, and `/faq`.

When adding or renaming a public page:

- Add a unique `<title>`, meta description, canonical URL, Open Graph metadata, and Twitter card metadata.
- Add the route to `public/sitemap.xml`.
- Add crawlable links from related pages.
- Add or update JSON-LD when the page is an article, report, organization page, or nested content page.
- Add route coverage to `test/api.test.js` when the page is a core public route.
- Run `npm run seo:check`.
- Run `npm run smoke:lunar` after changes to the Lunar Project page, Three.js viewer, or core layout styles.

Legacy redirects for removed `.html` paths live in `src/app.js` and should be kept when a public URL changes.

## Search Console And Launch Metrics

After production deployment, submit `https://celestialgovernance.org/sitemap.xml` in Google Search Console. Track indexed pages, impressions, clicks, top queries, membership form submissions, and report downloads after launch.

## Governance Alignment

The public website summarizes CGI's governance framework: mission, active projects, governance organs, membership pathway, publication discipline, and research review practices.

## Visual Assets

Generated background assets live in `public/assets/`:

- `hero-celestial-governance.webp`
- `projects-research-field.webp`
- `origins-space-law.webp`
- `join-research-forum.webp`
