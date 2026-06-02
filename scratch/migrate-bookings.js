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

    // 1. Mark admin bookings as approved by admin (1)
    const adminRes = await db.qurbani_booking.updateMany(
      { vendor_name: "Maktaba Shah Waliullah Trust" },
      { $set: { is_approved_by_admin: 1 } }
    );
    console.log(`Updated admin bookings count: ${adminRes.modifiedCount}`);

    // 2. Mark vendor bookings as not admin approved (0)
    const vendorRes = await db.qurbani_booking.updateMany(
      { vendor_name: { $ne: "Maktaba Shah Waliullah Trust" } },
      { $set: { is_approved_by_admin: 0 } }
    );
    console.log(`Updated vendor bookings count: ${vendorRes.modifiedCount}`);

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
