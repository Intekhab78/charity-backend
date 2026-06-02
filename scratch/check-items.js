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

    const items = await db.item_master.find({}).lean();
    console.log("--- ITEM MASTER (items collection) ---");
    console.log(`Count: ${items.length}`);
    console.log(JSON.stringify(items, null, 2));

    const itemLocations = await db.item_location_master.find({}).lean();
    console.log("--- ITEM LOCATION MASTER (item_location_masters collection) ---");
    console.log(`Count: ${itemLocations.length}`);
    console.log(JSON.stringify(itemLocations, null, 2));

    const mainPrices = await db.item_main_price.find({}).lean();
    console.log("--- ITEM MAIN PRICE (item_main_prices collection) ---");
    console.log(`Count: ${mainPrices.length}`);
    console.log(JSON.stringify(mainPrices, null, 2));

    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
