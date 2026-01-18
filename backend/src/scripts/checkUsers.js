require("dotenv").config();
const pool = require("../config/db");

async function checkUsers() {
  try {
    const result = await pool.query("SELECT id, name, email, role, is_active FROM users");
    console.log(`\n✅ Found ${result.rows.length} users in database:\n`);
    result.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.name} (${user.email})`);
      console.log(`   Role: ${user.role}, Active: ${user.is_active}\n`);
    });
    await pool.end();
  } catch (error) {
    console.error("❌ Error:", error.message);
    await pool.end();
    process.exit(1);
  }
}

checkUsers();
