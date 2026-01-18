require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function setupDatabase() {
  // Connect to default 'postgres' database first to create our database
  const adminPool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || "postgres",
    password: process.env.DB_PASSWORD || "",
    database: "postgres", // Connect to default database first
  });

  const dbName = process.env.DB_NAME || "wms_db";

  try {
    console.log("🔌 Connecting to PostgreSQL...");

    // Test connection
    await adminPool.query("SELECT 1");
    console.log("✅ Connected to PostgreSQL");

    // Check if database exists
    const dbCheck = await adminPool.query(
      "SELECT 1 FROM pg_database WHERE datname = $1",
      [dbName]
    );

    if (dbCheck.rows.length === 0) {
      console.log(`📦 Creating database '${dbName}'...`);
      await adminPool.query(`CREATE DATABASE ${dbName}`);
      console.log("✅ Database created");
    } else {
      console.log("✅ Database already exists");
    }

    await adminPool.end();

    // Now connect to our database
    const pool = new Pool({
      host: process.env.DB_HOST || "localhost",
      port: Number(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || "postgres",
      password: process.env.DB_PASSWORD || "",
      database: dbName,
    });

    console.log("\n📋 Setting up tables...");

    // Read and execute SQL files in order
    const initDir = path.join(__dirname, "../../db/init");
    const files = [
      "000_create_database.sql",
      "001_users.sql",
      "002_seed_users.sql",
    ];

    for (const file of files) {
      const filePath = path.join(initDir, file);
      if (fs.existsSync(filePath)) {
        console.log(`   Executing ${file}...`);
        const sql = fs.readFileSync(filePath, "utf8");
        
        try {
          // Execute the entire SQL file
          await pool.query(sql);
          console.log(`   ✅ ${file} executed`);
        } catch (err) {
          // Ignore "already exists" errors for CREATE TABLE IF NOT EXISTS
          if (
            err.message.includes("already exists") ||
            err.code === "42P07" ||
            err.code === "42710"
          ) {
            console.log(`   ⚠️  ${file} - Some objects already exist (skipping)`);
          } else {
            console.error(`   ❌ Error in ${file}:`, err.message);
            throw err;
          }
        }
      } else {
        console.log(`   ⚠️  ${file} not found, skipping...`);
      }
    }

    console.log("\n🎉 Database setup complete!");
    console.log("\nNext steps:");
    console.log("1. Verify tables were created");
    console.log("2. Restart your backend server");
    console.log("3. Test login with seeded users:");

    await pool.end();
  } catch (error) {
    console.error("\n❌ Error setting up database:");
    console.error(error.message);

    if (error.code === "28P01") {
      console.error("\n💡 Password authentication failed!");
      console.error("Please update backend/.env with the correct DB_PASSWORD");
    } else if (error.code === "ECONNREFUSED") {
      console.error("\n💡 Cannot connect to PostgreSQL!");
      console.error(
        "Make sure PostgreSQL is running on port",
        process.env.DB_PORT || 5432
      );
    } else if (error.code === "3D000") {
      console.error("\n💡 Database does not exist!");
      console.error("The setup script will create it automatically.");
    }

    await adminPool.end();
    process.exit(1);
  }
}

setupDatabase();
