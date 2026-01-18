require("dotenv").config();
const { Pool } = require("pg");

async function testConnection() {
  console.log("Testing PostgreSQL connection...");
  console.log("Config:", {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD ? "***" : "(not set)",
    database: "postgres", // Try default database first
  });

  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: "postgres", // Connect to default postgres database
  });

  try {
    const result = await pool.query("SELECT version(), current_database(), current_user;");
    console.log("\n✅ SUCCESS! Connected to PostgreSQL");
    console.log("Version:", result.rows[0].version.split(",")[0]);
    console.log("Database:", result.rows[0].current_database);
    console.log("User:", result.rows[0].current_user);
    
    // Check if wms_db exists
    const dbCheck = await pool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [process.env.DB_NAME || "wms_db"]
    );
    
    if (dbCheck.rows.length > 0) {
      console.log("\n✅ Database 'wms_db' already exists");
    } else {
      console.log("\n⚠️  Database 'wms_db' does not exist (will be created)");
    }
    
    await pool.end();
    return true;
  } catch (error) {
    console.error("\n❌ Connection failed:");
    console.error("Error code:", error.code);
    console.error("Error message:", error.message);
    
    if (error.code === "28P01") {
      console.error("\n💡 Password authentication failed!");
      console.error("The password 'wms123' is not accepted by PostgreSQL.");
      console.error("\nPossible solutions:");
      console.error("1. Make sure you've saved the password change in PostgreSQL");
      console.error("2. Restart PostgreSQL service if you just changed the password");
      console.error("3. Verify the password is correct using pgAdmin");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Cannot connect to PostgreSQL!");
      console.error("Make sure PostgreSQL is running on port", process.env.DB_PORT || 5432);
    }
    
    await pool.end();
    return false;
  }
}

testConnection();
