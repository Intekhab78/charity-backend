const mongoose = require("mongoose");
const db = require("./src/models");

const MONGODB_URI = "mongodb+srv://chatAI:bawsfL1sbUHjKTVt@cluster0.ehduwnn.mongodb.net/charity";

async function seed() {
  try {
    console.log("Connecting to MongoDB for seeding...");
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log("Connected successfully!");

    // 1. Seed Qurbani Dates (5 records)
    console.log("Seeding Qurbani Dates...");
    await db.qurbani_date_master.deleteMany({});

    const dates = [
      { id: 1001, qurbani_date: "Eid Day 1", actual_date: "2026-06-16", description: "First day of Eid Al-Adha", status: 1 },
      { id: 1002, qurbani_date: "Eid Day 2", actual_date: "2026-06-17", description: "Second day of Eid Al-Adha", status: 1 },
      { id: 1003, qurbani_date: "Eid Day 3", actual_date: "2026-06-18", description: "Third day of Eid Al-Adha", status: 1 },
      { id: 1004, qurbani_date: "Eid Day 4", actual_date: "2026-06-19", description: "Fourth day of Eid Al-Adha", status: 1 },
      { id: 1005, qurbani_date: "Eid Day 5", actual_date: "2026-06-20", description: "Fifth day of Eid Al-Adha (Extended)", status: 1 }
    ];

    for (const dateItem of dates) {
      await db.qurbani_date_master.create(dateItem);
    }
    console.log("✅ Seeded 5 Qurbani Dates successfully!");

    // 2. Seed Departments (5 records)
    console.log("Seeding Departments...");
    await db.item_department.deleteMany({});

    const departments = [
      { id: 2001, deptcode: "DEPT-AQ", deptname: "Aqeeqah", itemdeptname: "Aqeeqah", deptdesclong: "Aqeeqah Sacrificial Department", status: 1, company_id: 26, location_id: 30 },
      { id: 2002, deptcode: "DEPT-QB", deptname: "Qurbani", itemdeptname: "Qurbani", deptdesclong: "Qurbani Sacrificial Department", status: 1, company_id: 26, location_id: 30 },
      { id: 2003, deptcode: "DEPT-SQ", deptname: "Sadqah", itemdeptname: "Sadqah", deptdesclong: "Sadqah Sacrificial Department", status: 1, company_id: 26, location_id: 30 }
    ];

    for (const deptItem of departments) {
      await db.item_department.create(deptItem);
    }
    console.log("✅ Seeded 3 Departments (Aqeeqah, Qurbani, Sadqah) successfully!");

    // 3. Seed Family Master (categories)
    console.log("Seeding Family Master...");
    await db.family_master.deleteMany({});

    const families = [
      { id: 3001, itemfamcode: "FAM-AQ", itemfamname: "Aqeeqah Packages", itemfamlong: "Aqeeqah Sacrificial Packages", itemdeptname: "Aqeeqah", status: 1, company_id: 26, location_id: 30 },
      { id: 3002, itemfamcode: "FAM-QB", itemfamname: "Qurbani Packages", itemfamlong: "Qurbani Sacrificial Packages", itemdeptname: "Qurbani", status: 1, company_id: 26, location_id: 30 },
      { id: 3003, itemfamcode: "FAM-SQ", itemfamname: "Sadqah Packages", itemfamlong: "Sadqah Sacrificial Packages", itemdeptname: "Sadqah", status: 1, company_id: 26, location_id: 30 }
    ];

    for (const familyItem of families) {
      await db.family_master.create(familyItem);
    }
    console.log("✅ Seeded 3 Family Masters successfully!");

    // 4. Seed Item Master (base items)
    console.log("Seeding Item Master...");
    await db.item_master.deleteMany({});

    const items = [
      { id: 5001, item_code: "AQ-001", item_name: "Goat - Single Share", status: 1, company_id: 26, location_id: 30 },
      { id: 5002, item_code: "AQ-002", item_name: "Lamb - Full", status: 1, company_id: 26, location_id: 30 },
      { id: 5003, item_code: "QB-001", item_name: "Buffalo - Share", status: 1, company_id: 26, location_id: 30 },
      { id: 5004, item_code: "QB-002", item_name: "Cow - Full", status: 1, company_id: 26, location_id: 30 },
      { id: 5005, item_code: "SQ-001", item_name: "Rice Package", status: 1, company_id: 26, location_id: 30 },
      { id: 5006, item_code: "SQ-002", item_name: "Flour Package", status: 1, company_id: 26, location_id: 30 },
      { id: 5007, item_code: "QB-003", item_name: "Sheep - Full", status: 1, company_id: 26, location_id: 30 },
      { id: 5008, item_code: "AQ-003", item_name: "Goat - Full", status: 1, company_id: 26, location_id: 30 }
    ];

    for (const itemItem of items) {
      await db.item_master.create(itemItem);
    }
    console.log("✅ Seeded 8 Items successfully!");

    // 5. Seed Item Location Master (items at locations with pricing & images)
    console.log("Seeding Item Location Master...");
    await db.item_location_master.deleteMany({});

    const itemLocations = [
      // Aqeeqah items
      { id: 6001, item_id: "5001", item_code: "AQ-001", item_name: "Goat - Single Share", company_id: 26, location_id: 30, itemprice: 150, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Aqeeqah", item_department: { id: 2001, itemdeptname: "Aqeeqah" }, status: 1 },
      { id: 6002, item_id: "5002", item_code: "AQ-002", item_name: "Lamb - Full", company_id: 26, location_id: 30, itemprice: 450, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Aqeeqah", item_department: { id: 2001, itemdeptname: "Aqeeqah" }, status: 1 },
      { id: 6003, item_id: "5008", item_code: "AQ-003", item_name: "Goat - Full", company_id: 26, location_id: 30, itemprice: 500, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Aqeeqah", item_department: { id: 2001, itemdeptname: "Aqeeqah" }, status: 1 },

      // Qurbani items
      { id: 6004, item_id: "5003", item_code: "QB-001", item_name: "Buffalo - Share", company_id: 26, location_id: 30, itemprice: 250, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Qurbani", item_department: { id: 2002, itemdeptname: "Qurbani" }, status: 1 },
      { id: 6005, item_id: "5004", item_code: "QB-002", item_name: "Cow - Full", company_id: 26, location_id: 30, itemprice: 750, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Qurbani", item_department: { id: 2002, itemdeptname: "Qurbani" }, status: 1 },
      { id: 6006, item_id: "5007", item_code: "QB-003", item_name: "Sheep - Full", company_id: 26, location_id: 30, itemprice: 350, item_image: "1779169378638-pexels-anaussieinvietnam-33639465.jpg", departname: "Qurbani", item_department: { id: 2002, itemdeptname: "Qurbani" }, status: 1 },

      // Sadqah items
      { id: 6007, item_id: "5005", item_code: "SQ-001", item_name: "Rice Package", company_id: 26, location_id: 30, itemprice: 50, item_image: "", departname: "Sadqah", item_department: { id: 2003, itemdeptname: "Sadqah" }, status: 1 },
      { id: 6008, item_id: "5006", item_code: "SQ-002", item_name: "Flour Package", company_id: 26, location_id: 30, itemprice: 40, item_image: "", departname: "Sadqah", item_department: { id: 2003, itemdeptname: "Sadqah" }, status: 1 }
    ];

    for (const itemLoc of itemLocations) {
      await db.item_location_master.create(itemLoc);
    }
    console.log("✅ Seeded 8 Item Location records successfully!");

    console.log("Database seeding completed successfully.");
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
