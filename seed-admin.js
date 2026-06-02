const db = require("./src/models");
const bcrypt = require("bcrypt");

async function seed() {
  try {
    // 1. Ensure Role exists
    const [adminRole] = await db.role_master.findOrCreate({
      where: { role_name: "Admin" },
      defaults: {
        role_description: "Full System Administrator",
      }
    });

    const [vendorRole] = await db.role_master.findOrCreate({
      where: { role_name: "Vendor" },
      defaults: {
        role_description: "Limited Access Vendor",
      }
    });

    console.log("Roles verified.");

    // 2. Create Admin User
    const adminEmail = "admin@charity.com";
    const existingAdmin = await db.user_master.findOne({ where: { email: adminEmail } });

    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash("admin123", 8);
      await db.user_master.create({
        firstname: "System",
        lastname: "Admin",
        email: adminEmail,
        password: hashedPassword,
        role_id: adminRole.role_id,
        status: 1
      });
      console.log("✅ Admin user created: admin@charity.com / admin123");
    } else {
      console.log("ℹ️ Admin user already exists.");
    }

    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

seed();
