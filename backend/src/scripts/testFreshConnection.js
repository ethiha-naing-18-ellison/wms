require("dotenv").config();
const { Pool } = require("pg");

async function testConnection(password) {
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: password,
    database: "postgres",
  });

  try {
    const result = await pool.query("SELECT current_database(), current_user;");
    console.log(`✅ SUCCESS with password: "${password === "" ? "(empty)" : password}"`);
    console.log("   Database:", result.rows[0].current_database);
    console.log("   User:", result.rows[0].current_user);
    await pool.end();
    return true;
  } catch (error) {
    await pool.end();
    return false;
  }
}

async function main() {
  console.log("Testing fresh PostgreSQL connection...\n");
  
  const passwordsToTry = [
    "",           // Empty password
    "wms123",      // The password you want to use
    "postgres",    // Common default
    "admin",       // Common default
  ];

  for (const pwd of passwordsToTry) {
    const displayPwd = pwd === "" ? "(empty/no password)" : pwd;
    process.stdout.write(`Trying password: ${displayPwd}... `);
    const success = await testConnection(pwd);
    if (success) {
      console.log("\n\n🎉 Found working connection!");
      if (pwd === "") {
        console.log("\n💡 PostgreSQL is using trust authentication (no password).");
        console.log("You can set a password later if needed.");
        console.log("\nTo set password 'wms123', run in psql:");
        console.log("  ALTER USER postgres WITH PASSWORD 'wms123';");
      } else {
        console.log(`\n✅ Password '${pwd}' works!`);
        console.log("Update your .env file if needed.");
      }
      return;
    }
    console.log("❌");
  }

  console.log("\n❌ None of the passwords worked.");
  console.log("\n💡 Since this is a fresh installation:");
  console.log("1. PostgreSQL might need initial setup");
  console.log("2. Try connecting with pgAdmin first to set up the initial password");
  console.log("3. Or check PostgreSQL installation documentation");
}

main();
