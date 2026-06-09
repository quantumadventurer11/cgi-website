function requireAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = req.get("x-admin-token") || "";
  const providedToken = bearerToken || headerToken;

  if (!configuredToken || configuredToken === "change-me-to-a-long-random-string") {
    return res.status(503).json({
      ok: false,
      error: "Admin access is not configured."
    });
  }

  if (!providedToken || providedToken !== configuredToken) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized."
    });
  }

  return next();
}

module.exports = { requireAdmin };
