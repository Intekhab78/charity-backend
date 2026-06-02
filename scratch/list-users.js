const mongoose = require("mongoose");
const db = require("../src/models");

const MONGODB_URI = "mongodb+srv://chatAI:bawsfL1sbUHjKTVt@cluster0.ehduwnn.mongodb.net/charity";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB!");

    // Fetch all users and roles
    const users = await db.user_master.find().lean();
    const roles = await db.role_master.find().lean();

    const roleMap = {};
    roles.forEach(r => {
      roleMap[r.role_id] = r.role_name;
    });

    console.log("\n--- REGISTERED USERS IN SYSTEM ---");
    users.forEach(u => {
      console.log(`- Name: ${u.firstname} ${u.lastname}`);
      console.log(`  Email: ${u.email}`);
      console.log(`  Role: ${roleMap[u.role_id] || 'Unknown'} (Role ID: ${u.role_id})`);
      console.log(`  Hashed Password: ${u.password}`);
      console.log(`  Status: ${u.status === 1 ? "Active" : "Inactive"}`);
      console.log("---------------------------------");
    });

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
