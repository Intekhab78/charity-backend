const mongoose = require("mongoose");
const db = require("../src/models");

const MONGODB_URI = "mongodb+srv://chatAI:bawsfL1sbUHjKTVt@cluster0.ehduwnn.mongodb.net/charity";

async function run() {
  try {
    await mongoose.connect(MONGODB_URI);
    const bookings = await db.qurbani_booking.find().lean();
    console.log(JSON.stringify(bookings, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}
run();
