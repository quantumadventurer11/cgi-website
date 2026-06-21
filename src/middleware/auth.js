const { findAdminSession } = require("../db");
const { hashSessionToken } = require("../services/passwords");

async function requireAdmin(req, res, next) {
  const configuredToken = process.env.ADMIN_TOKEN;
  const authHeader = req.get("authorization") || "";
  const bearerToken = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  const headerToken = req.get("x-admin-token") || "";
  const providedToken = bearerToken || headerToken;

  if (!providedToken) {
    return res.status(401).json({
      ok: false,
      error: "Unauthorized."
    });
  }

  if (configuredToken && configuredToken !== "change-me-to-a-long-random-string" && providedToken === configuredToken) {
    req.admin = { authMethod: "token" };
    return next();
  }

  try {
    const session = await findAdminSession(hashSessionToken(providedToken));
    if (!session) {
      return res.status(401).json({
        ok: false,
        error: "Unauthorized."
      });
    }

    req.admin = {
      authMethod: "session",
      id: session.admin_user_id,
      username: session.username
    };
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = { requireAdmin };
