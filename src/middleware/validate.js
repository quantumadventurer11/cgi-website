function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        ok: false,
        error: result.error.issues[0]?.message || "Invalid request body."
      });
    }

    req.validatedBody = result.data;
    return next();
  };
}

module.exports = { validateBody };
