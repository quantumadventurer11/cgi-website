const nodemailer = require("nodemailer");

const MAIL_TO = process.env.MAIL_TO || "cgi@dfh.org.il";
const MAIL_FROM = process.env.MAIL_FROM || "CGI Website <no-reply@dfh.org.il>";

function hasSmtpConfig() {
  return Boolean(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  if (!hasSmtpConfig()) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT || 587) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function applicationNotification(application) {
  return {
    from: MAIL_FROM,
    to: MAIL_TO,
    replyTo: application.email,
    subject: `New CGI membership application: ${application.fullName}`,
    text: [
      "A new Celestial Governance Initiative membership application was submitted.",
      "",
      `Name: ${application.fullName}`,
      `Email: ${application.email}`,
      `Affiliation: ${application.affiliation || "Not provided"}`,
      `Area of interest: ${application.areaOfInterest || "Not provided"}`,
      "",
      "Message:",
      application.message || "Not provided"
    ].join("\n"),
    html: `
      <div style="font-family: Raleway, Arial, sans-serif; color: #14203D; line-height: 1.6;">
        <div style="border-left: 4px solid #C9A227; padding-left: 18px;">
          <h1 style="font-family: Georgia, serif; color: #0A1A3F;">New CGI membership application</h1>
          <p>A new Celestial Governance Initiative membership application was submitted.</p>
        </div>
        <table style="margin-top: 20px; border-collapse: collapse;">
          <tr><td style="font-weight: 700; padding: 6px 16px 6px 0;">Name</td><td>${escapeHtml(application.fullName)}</td></tr>
          <tr><td style="font-weight: 700; padding: 6px 16px 6px 0;">Email</td><td>${escapeHtml(application.email)}</td></tr>
          <tr><td style="font-weight: 700; padding: 6px 16px 6px 0;">Affiliation</td><td>${escapeHtml(application.affiliation || "Not provided")}</td></tr>
          <tr><td style="font-weight: 700; padding: 6px 16px 6px 0;">Area of interest</td><td>${escapeHtml(application.areaOfInterest || "Not provided")}</td></tr>
        </table>
        <h2 style="font-family: Georgia, serif; color: #0A1A3F;">Message</h2>
        <p>${escapeHtml(application.message || "Not provided").replace(/\n/g, "<br>")}</p>
      </div>
    `
  };
}

function applicantConfirmation(application) {
  return {
    from: MAIL_FROM,
    to: application.email,
    subject: "Celestial Governance Initiative application received",
    text: [
      `Dear ${application.fullName},`,
      "",
      "Thank you for applying to join the Celestial Governance Initiative. Your application has been received, and the CGI team will respond by email.",
      "",
      "Celestial Governance Initiative",
      "cgi@dfh.org.il"
    ].join("\n"),
    html: `
      <div style="font-family: Raleway, Arial, sans-serif; color: #14203D; line-height: 1.6;">
        <h1 style="font-family: Georgia, serif; color: #0A1A3F;">Application received</h1>
        <p>Dear ${escapeHtml(application.fullName)},</p>
        <p>Thank you for applying to join the Celestial Governance Initiative. Your application has been received, and the CGI team will respond by email.</p>
        <p style="color: #0A1A3F; font-weight: 700;">Celestial Governance Initiative</p>
        <p><a href="mailto:cgi@dfh.org.il" style="color: #C9A227;">cgi@dfh.org.il</a></p>
      </div>
    `
  };
}

async function sendApplicationEmails(application) {
  const messages = [
    applicationNotification(application),
    applicantConfirmation(application)
  ];
  const transporter = createTransporter();

  if (!transporter) {
    messages.forEach((message) => {
      console.log("[mailer:fallback]", JSON.stringify({
        to: message.to,
        subject: message.subject,
        text: message.text
      }, null, 2));
    });
    return;
  }

  await Promise.all(messages.map((message) => transporter.sendMail(message)));
}

module.exports = { sendApplicationEmails };
