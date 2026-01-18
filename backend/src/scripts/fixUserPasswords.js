require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");

async function fixPasswords() {
  const users = [
    {
      email: "admin@wms.com",
      password: "admin123",
    },
    {
      email: "manager@wms.com",
      password: "manager123",
    },
    {
      email: "operator@wms.com",
      password: "operator123",
    },
  ];

  try {
    for (const u of users) {
      const hash = await bcrypt.hash(u.password, 10);
      
      const result = await pool.query(
        `
        UPDATE users 
        SET password_hash = $1 
        WHERE email = $2
        `,
        [hash, u.email]
      );

      if (result.rowCount > 0) {
        console.log(`✅ Updated password for ${u.email}`);
      } else {
        console.log(`⚠️  User ${u.email} not found`);
      }
    }

    console.log("\n✅ All passwords updated!");
    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

fixPasswords();
