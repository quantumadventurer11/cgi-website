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

app.use("/api/applications", applicationsRouter);
app.use("/api/admin", adminRouter);
app.use(express.static(path.join(__dirname, "..", "public")));

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
