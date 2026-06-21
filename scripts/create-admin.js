require("dotenv").config();

const { createAdminUser } = require("../src/db");
const { hashPassword } = require("../src/services/passwords");

async function main() {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;

  if (!username || !password) {
    console.error("Set ADMIN_USERNAME and ADMIN_PASSWORD before running this script.");
    process.exitCode = 1;
    return;
  }

  if (password.length < 16) {
    console.error("ADMIN_PASSWORD must be at least 16 characters.");
    process.exitCode = 1;
    return;
  }

  const adminUser = await createAdminUser({
    username,
    ...hashPassword(password),
    created_at: new Date().toISOString()
  });

  console.log(`Admin account ready: ${adminUser.username}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
