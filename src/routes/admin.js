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

router.get("/applications", (req, res) => {
  return res.json({
    ok: true,
    applications: listApplications.all()
  });
});

router.patch("/applications/:id", validateBody(statusSchema), (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      ok: false,
      error: "Invalid application id."
    });
  }

  const result = updateApplicationStatus.run({ id, status: req.validatedBody.status });
  if (result.changes === 0) {
    return res.status(404).json({
      ok: false,
      error: "Application not found."
    });
  }

  return res.json({
    ok: true,
    application: getApplication.get(id)
  });
});

module.exports = router;
