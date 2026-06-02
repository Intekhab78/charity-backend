const mongoose = require("mongoose");
const db = require("../src/models");

const MONGODB_URI = "mongodb+srv://chatAI:bawsfL1sbUHjKTVt@cluster0.ehduwnn.mongodb.net/charity";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected to MongoDB!");

    // Set is_approved_by_admin: 1 for bookings made by the Admin
    const res = await db.qurbani_booking.updateMany(
      { 
        $or: [
          { vendor_name: null },
          { vendor_name: { $exists: false } },
          { vendor_name: "" },
          { vendor_name: /Maktaba Shah/i }
        ]
      },
      { $set: { is_approved_by_admin: 1 } }
    );
    console.log(`Successfully approved Admin bookings: ${res.modifiedCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
