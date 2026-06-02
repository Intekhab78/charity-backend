const mongoose = require("mongoose");

const CharityWebsiteDataSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    data1: mongoose.Schema.Types.Mixed,
    data2: mongoose.Schema.Types.Mixed,
    data3: mongoose.Schema.Types.Mixed,
    data4: mongoose.Schema.Types.Mixed,
    data5: mongoose.Schema.Types.Mixed
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("charity_website_data", CharityWebsiteDataSchema, "charity_website_data");
