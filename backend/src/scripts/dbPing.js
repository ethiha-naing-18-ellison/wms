require("dotenv").config();
const pool = require("../config/db");

async function main() {
  try {
    const r = await pool.query(
      "SELECT current_database(), inet_server_port(), current_user;"
    );
    console.log("✅ DB CONNECTED:", r.rows[0]);
  } catch (e) {
    console.error("❌ DB ERROR:");
    console.error(e);
  } finally {
    await pool.end();
  }
}

main();
