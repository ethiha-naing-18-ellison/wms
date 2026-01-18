require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function seed() {
  const users = [
    {
      name: "Admin User",
      email: "admin@wms.com",
      password: "admin123",
      role: "admin",
    },
    {
      name: "Manager User",
      email: "manager@wms.com",
      password: "manager123",
      role: "manager",
    },
    {
      name: "Operator User",
      email: "operator@wms.com",
      password: "operator123",
      role: "operator",
    },
  ];

  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 10);

    await pool.query(
      `
      INSERT INTO users (name, email, password_hash, role)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (email) DO NOTHING
      `,
      [u.name, u.email, hash, u.role]
    );
  }

  console.log("✅ Users seeded");
}

// 🔒 SAFE EXECUTION WITH PROPER CLEANUP
seed()
  .then(async () => {
    await pool.end();          // 🔴 CRITICAL FIX
    process.exit(0);
  })
  .catch(async (err) => {
    console.error("❌ Seed error:", err);
    await pool.end();          // 🔴 CRITICAL FIX
    process.exit(1);
  });
