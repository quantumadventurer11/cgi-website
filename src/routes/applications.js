const express = require("express");
const rateLimit = require("express-rate-limit");
const { z } = require("zod");
const { insertApplication } = require("../db");
const { validateBody } = require("../middleware/validate");
const { sendApplicationEmails } = require("../services/mailer");

const router = express.Router();

const applicationLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    error: "Too many application attempts. Please wait and try again."
  }
});

const optionalTrimmed = (max, fieldName) => z.preprocess((value) => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
}, z.string().max(max, `${fieldName} is too long.`).optional());

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(120, "Full name is too long."),
  email: z.string().trim().email("A valid email is required.").max(254, "Email is too long."),
  affiliation: optionalTrimmed(160, "Affiliation"),
  areaOfInterest: optionalTrimmed(80, "Area of interest"),
  message: optionalTrimmed(2000, "Message"),
  website: z.string().optional()
});

router.post("/", applicationLimit, validateBody(applicationSchema), async (req, res, next) => {
  try {
    const application = req.validatedBody;

    if (application.website && application.website.trim()) {
      return res.status(400).json({
        ok: false,
        error: "Invalid application."
      });
    }

    const createdAt = new Date().toISOString();
    const row = {
      full_name: application.fullName,
      email: application.email,
      affiliation: application.affiliation || null,
      area_of_interest: application.areaOfInterest || null,
      message: application.message || null,
      created_at: createdAt,
      status: "new"
    };

    await insertApplication(row);
    await sendApplicationEmails(application);

    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
