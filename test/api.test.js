const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "cgi-api-"));

process.env.NODE_ENV = "test";
process.env.ADMIN_TOKEN = "test-admin-token";
process.env.SQLITE_PATH = path.join(tempDir, "test.sqlite");
process.env.MAIL_TO = "cgi@dfh.org.il";
process.env.MAIL_FROM = "CGI Website <no-reply@dfh.org.il>";
delete process.env.SMTP_HOST;
delete process.env.SMTP_USER;
delete process.env.SMTP_PASS;

const request = require("supertest");
const app = require("../src/app");

test("GET /api/health returns ok", async () => {
  const response = await request(app).get("/api/health").expect(200);
  assert.deepEqual(response.body, { ok: true });
});

test("POST /api/applications rejects invalid body", async () => {
  const response = await request(app)
    .post("/api/applications")
    .send({ fullName: "A", email: "not-an-email", website: "" })
    .expect(400);

  assert.equal(response.body.ok, false);
});

test("POST /api/applications rejects honeypot submissions", async () => {
  const response = await request(app)
    .post("/api/applications")
    .send({
      fullName: "Spam Applicant",
      email: "spam@example.com",
      website: "https://example.com"
    })
    .expect(400);

  assert.equal(response.body.ok, false);
});

test("application flow persists, lists, and updates status", async () => {
  const submitResponse = await request(app)
    .post("/api/applications")
    .send({
      fullName: "Test Applicant",
      email: "test.applicant@example.com",
      affiliation: "Verification Institute",
      areaOfInterest: "Policy",
      message: "I would like to contribute to CGI research.",
      website: ""
    })
    .expect(201);

  assert.deepEqual(submitResponse.body, { ok: true });

  await request(app).get("/api/admin/applications").expect(401);

  const listResponse = await request(app)
    .get("/api/admin/applications")
    .set("Authorization", "Bearer test-admin-token")
    .expect(200);

  assert.equal(listResponse.body.ok, true);
  assert.equal(listResponse.body.applications.length, 1);
  assert.equal(listResponse.body.applications[0].full_name, "Test Applicant");

  const id = listResponse.body.applications[0].id;
  const patchResponse = await request(app)
    .patch(`/api/admin/applications/${id}`)
    .set("x-admin-token", "test-admin-token")
    .send({ status: "contacted" })
    .expect(200);

  assert.equal(patchResponse.body.application.status, "contacted");
});
