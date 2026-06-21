# Celestial Governance Initiative Website

Production website and membership application backend for the Celestial Governance Initiative (CGI), a research and policy institute for the governance of outer space.

## What Is Included

- Single-page public website presenting CGI's mission, active projects, governance framework, and membership pathway.
- Node.js + Express API for membership applications.
- Durable Neon Postgres support for Vercel, with SQLite persistence through `better-sqlite3` for local development and Docker.
- Nodemailer notification and applicant confirmation emails, with console fallback in development.
- Protected named-account admin API and admin interface at `/admin.html`.
- Automated backend tests with Node's built-in test runner.

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

The automated test suite covers health checks, public application validation, honeypot rejection, persistence, admin authentication, admin listing, and status updates.

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

For reliable confirmation email delivery, configure SPF and DKIM for the sending domain used in `MAIL_FROM`.

The `public/` folder can also be deployed as a static-only fallback on GitHub Pages, Netlify, or similar hosts. In that mode, the application form will not persist submissions, but the mailto fallback to `contact@celestialgovernance.org` remains available.

## Governance Alignment

The public website summarizes CGI's governance framework: mission, active projects, governance organs, membership pathway, publication discipline, and research review practices.

## Visual Assets

Generated background assets live in `public/assets/`:

- `hero-celestial-governance.webp`
- `projects-research-field.webp`
- `origins-space-law.webp`
- `join-research-forum.webp`
