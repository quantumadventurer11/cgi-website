const express = require("express");
const { z } = require("zod");
const { getApplication, listApplications, updateApplicationStatus } = require("../db");
const { requireAdmin } = require("../middleware/auth");
const { validateBody } = require("../middleware/validate");

const router = express.Router();

const statusSchema = z.object({
  status: z.enum(["new", "reviewed", "contacted"], {
    errorMap: () => ({ message: "Status must be new, reviewed, or contacted." })
  })
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
