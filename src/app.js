require("dotenv").config();

const path = require("path");
const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const adminRouter = require("./routes/admin");
const applicationsRouter = require("./routes/applications");

const app = express();

app.set("trust proxy", 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'"],
      imgSrc: ["'self'", "data:"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"]
    }
  }
}));
app.use(cors());
app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false }));

app.use("/api/applications", rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false
}));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

const legacyRedirects = {
  "/research.html": "/research",
  "/join.html": "/join",
  "/contact.html": "/join",
  "/lunar.html": "/projects/lunar",
  "/ostgap.html": "/projects/ostgap",
  "/team.html": "/team"
};

Object.entries(legacyRedirects).forEach(([from, to]) => {
  app.get(from, (req, res) => {
    res.redirect(301, to);
  });
});

app.use("/api/applications", applicationsRouter);
app.use("/api/admin", adminRouter);

app.get("/topics", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "topics.html"));
});

app.get("/insights", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "insights.html"));
});

app.use(express.static(path.join(__dirname, "..", "public"), {
  extensions: ["html"],
  maxAge: process.env.NODE_ENV === "production" ? "1h" : 0
}));

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ ok: false, error: "Not found." });
  }

  return next();
});

app.use((error, req, res, next) => {
  console.error(error);
  if (res.headersSent) return next(error);

  return res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

module.exports = app;
