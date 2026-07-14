const express = require("express");
const { z } = require("zod");
const { insertApplication } = require("../db");
const { validateBody } = require("../middleware/validate");

const router = express.Router();

const applicationSchema = z.object({
  fullName: z.string().trim().min(2, "Full name is required.").max(160),
  email: z.string().trim().email("A valid email address is required.").max(254),
  affiliation: z.string().trim().max(200).optional().default(""),
  areaOfInterest: z.string().trim().max(200).optional().default(""),
  message: z.string().trim().max(3000).optional().default(""),
  website: z.string().trim().max(300).optional().default("")
});

function buildNotificationEmail(application) {
  return {
    to: process.env.MAIL_TO || "contact@celestialgovernance.org",
    from: process.env.MAIL_FROM || "CGI Website <no-reply@celestialgovernance.org>",
    subject: `New CGI membership application from ${application.fullName}`,
    text: [
      "A new CGI membership application was submitted.",
      "",
      `Name: ${application.fullName}`,
      `Email: ${application.email}`,
      `Affiliation: ${application.affiliation || "Not provided"}`,
      `Area of interest: ${application.areaOfInterest || "Not provided"}`,
      "",
      application.message || "No message provided."
    ].join("\n")
  };
}

function buildConfirmationEmail(application) {
  return {
    to: application.email,
    from: process.env.MAIL_FROM || "CGI Website <no-reply@celestialgovernance.org>",
    subject: "CGI membership application received",
    text: [
      `Dear ${application.fullName},`,
      "",
      "Thank you for your interest in the Celestial Governance Institute. CGI is an independent research and policy institute organizing toward Canadian not-for-profit registration.",
      "Your application has been received. The team will review your interest and route it toward an appropriate project or general membership path.",
      "",
      "Celestial Governance Institute",
      "contact@celestialgovernance.org"
    ].join("\n")
  };
}

async function sendMail(message) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.info("Email delivery not configured; message follows.");
    console.info(message);
    return;
  }

  const nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT || 587),
    secure: Number(SMTP_PORT || 587) === 465,
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS
    }
  });

  await transporter.sendMail(message);
}

router.post("/", validateBody(applicationSchema), async (req, res, next) => {
  try {
    const application = req.validatedBody;

    if (application.website) {
      return res.status(400).json({
        ok: false,
        error: "Invalid submission."
      });
    }

    await insertApplication({
      full_name: application.fullName,
      email: application.email,
      affiliation: application.affiliation,
      area_of_interest: application.areaOfInterest,
      message: application.message,
      created_at: new Date().toISOString(),
      status: "new"
    });

    await Promise.all([
      sendMail(buildNotificationEmail(application)),
      sendMail(buildConfirmationEmail(application))
    ]);

    return res.status(201).json({ ok: true });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
