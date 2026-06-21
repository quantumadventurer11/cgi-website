const express = require("express");
const { z } = require("zod");
const {
  createAdminSession,
  deleteExpiredAdminSessions,
  findAdminUserByUsername,
  getApplication,
  listApplications,
  updateApplicationStatus
} = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");
const { createSessionToken, verifyPassword } = require("../services/passwords");

const router = express.Router();

const loginSchema = z.object({
  username: z.string().trim().min(1, "Username is required.").max(120),
  password: z.string().min(1, "Password is required.").max(256)
});

const statusSchema = z.object({
  status: z.enum(["new", "reviewed", "contacted"], {
    errorMap: () => ({ message: "Status must be new, reviewed, or contacted." })
  })
});

router.post("/login", validateBody(loginSchema), async (req, res, next) => {
  try {
    const { username, password } = req.validatedBody;
    const adminUser = await findAdminUserByUsername(username);

    if (!adminUser || !verifyPassword(password, adminUser)) {
      return res.status(401).json({
        ok: false,
        error: "Invalid username or password."
      });
    }

    await deleteExpiredAdminSessions();

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const session = createSessionToken();

    await createAdminSession({
      admin_user_id: adminUser.id,
      token_hash: session.token_hash,
      created_at: now.toISOString(),
      expires_at: expiresAt.toISOString()
    });

    return res.json({
      ok: true,
      token: session.token,
      expiresAt: expiresAt.toISOString(),
      admin: {
        username: adminUser.username
      }
    });
  } catch (error) {
    return next(error);
  }
});

router.use(requireAdmin);

router.get("/applications", async (req, res, next) => {
  try {
    const applications = await listApplications();

    return res.json({
      ok: true,
      applications
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/applications/:id", validateBody(statusSchema), async (req, res, next) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        ok: false,
        error: "Invalid application id."
      });
    }

    const result = await updateApplicationStatus({ id, status: req.validatedBody.status });
    if (result.changes === 0) {
      return res.status(404).json({
        ok: false,
        error: "Application not found."
      });
    }

    return res.json({
      ok: true,
      application: await getApplication(id)
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
