const db = require("../src/models");

const runMigration = async () => {
  try {
    console.log("🚀 Starting Qurbani Table Migration...");

    // 1. Create Booking Header Table
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS qurbani_bookings (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        uuid CHAR(36),
        customer_name VARCHAR(191),
        customer_phone VARCHAR(20),
        customer_email VARCHAR(191),
        total_shares INT,
        share_code VARCHAR(50),
        booking_date DATE,
        total_amount DECIMAL(15, 2),
        payment_mode VARCHAR(50),
        status VARCHAR(50),
        company_id BIGINT,
        location_id BIGINT,
        created_at DATETIME,
        updated_at DATETIME,
        deleted_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // 2. Create Shares Detail Table
    await db.sequelize.query(`
      CREATE TABLE IF NOT EXISTS qurbani_shares (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        booking_id BIGINT,
        share_reg_no VARCHAR(100),
        beneficiary_name VARCHAR(191),
        beneficiary_mobile VARCHAR(20),
        objective VARCHAR(100) DEFAULT 'Qurbani',
        amount DECIMAL(15, 2),
        created_at DATETIME,
        updated_at DATETIME,
        deleted_at DATETIME
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    console.log("✅ Qurbani Tables Created Successfully!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Migration Failed:", error);
    process.exit(1);
  }
};

runMigration();
