const crypto = require("crypto");

const DEFAULT_ITERATIONS = 310000;
const DEFAULT_KEY_LENGTH = 32;
const DEFAULT_DIGEST = "sha256";

function hashPassword(password, options = {}) {
  const salt = options.salt || crypto.randomBytes(16).toString("base64url");
  const iterations = options.iterations || DEFAULT_ITERATIONS;
  const keyLength = options.keyLength || DEFAULT_KEY_LENGTH;
  const digest = options.digest || DEFAULT_DIGEST;
  const hash = crypto.pbkdf2Sync(password, salt, iterations, keyLength, digest).toString("base64url");

  return {
    password_hash: hash,
    password_salt: salt,
    password_iterations: iterations,
    password_key_length: keyLength,
    password_digest: digest
  };
}

function verifyPassword(password, adminUser) {
  if (!adminUser || !adminUser.password_hash || !adminUser.password_salt) return false;

  const expected = Buffer.from(adminUser.password_hash, "base64url");
  const actual = crypto.pbkdf2Sync(
    password,
    adminUser.password_salt,
    Number(adminUser.password_iterations),
    Number(adminUser.password_key_length),
    adminUser.password_digest
  );

  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

function createSessionToken() {
  const token = crypto.randomBytes(32).toString("base64url");
  return {
    token,
    token_hash: hashSessionToken(token)
  };
}

function hashSessionToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

module.exports = {
  createSessionToken,
  hashPassword,
  hashSessionToken,
  verifyPassword
};
