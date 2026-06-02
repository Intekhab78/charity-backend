const mongoose = require("mongoose");
const db = require("../src/models");

const MONGODB_URI = "mongodb+srv://chatAI:bawsfL1sbUHjKTVt@cluster0.ehduwnn.mongodb.net/charity";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log("Connected to MongoDB!");

    // Fetch all users
    const users = await db.user_master.find();
    
    for (const u of users) {
      console.log(`Resetting password for: ${u.email}`);
      u.password = "admin123"; // Set raw string so the .pre("save") hook hashes it exactly once
      await u.save();
    }

    console.log("All passwords successfully reset to admin123 and securely hashed!");
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
