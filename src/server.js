require("dotenv").config();

const path = require("path");
const express = require("express");
const helmet = require("helmet");
const cors = require("cors");

require("./db");

const applicationsRouter = require("./routes/applications");
const adminRouter = require("./routes/admin");

const app = express();
const port = Number(process.env.PORT || 3000);
const isProduction = process.env.NODE_ENV === "production";
const publicDir = path.join(__dirname, "..", "public");

app.disable("x-powered-by");

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      formAction: ["'self'", "mailto:"],
      frameAncestors: ["'self'"],
      imgSrc: ["'self'", "data:"],
      objectSrc: ["'none'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "https://fonts.googleapis.com", "'unsafe-inline'"],
      connectSrc: ["'self'"]
    }
  }
}));

app.use(cors({
  origin(origin, callback) {
    if (!origin || !isProduction) return callback(null, true);
    return callback(null, false);
  }
}));

app.use(express.json({ limit: "64kb" }));
app.use(express.urlencoded({ extended: false, limit: "64kb" }));
app.use(express.static(publicDir, {
  extensions: ["html"],
  maxAge: isProduction ? "1h" : 0
}));

app.get("/api/health", (req, res) => {
  res.json({ ok: true });
});

app.use("/api/applications", applicationsRouter);
app.use("/api/admin", adminRouter);

app.use((req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      ok: false,
      error: "Not found."
    });
  }
  return next();
});

app.use((error, req, res, next) => {
  console.error(error);
  return res.status(500).json({
    ok: false,
    error: "Internal server error."
  });
});

app.listen(port, () => {
  console.log(`CGI website listening on port ${port}`);
});
