# Celestial Governance Initiative Website

Production-grade website and membership application backend for the Celestial Governance Initiative (CGI), under the Democracy and Federalism Hub and affiliated with the Space Generation Advisory Council.

## Local Development

```bash
npm install
cp .env.example .env
npm run dev
```

The site runs at `http://localhost:3000`. The API health check is available at `http://localhost:3000/api/health`.

## Environment

Copy `.env.example` to `.env` and set:

- `PORT`: HTTP port, default `3000`.
- `NODE_ENV`: use `development` locally and `production` in deployment.
- `ADMIN_TOKEN`: long random secret for admin API access.
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

For reliable confirmation email delivery, configure SPF and DKIM for the sending domain used in `MAIL_FROM`.

The `public/` folder can also be deployed as a static-only fallback on GitHub Pages, Netlify, or similar hosts. In that mode, the application form will not persist submissions, but the mailto fallback to `cgi@dfh.org.il` remains available.
