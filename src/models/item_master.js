const mongoose = require("mongoose");

const ItemMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    item_code: {
      type: String,
      trim: true
    },
    item_name: {
      type: String,
      trim: true
    },
    status: {
      type: Number,
      default: 1
    },
    company_id: Number,
    location_id: Number
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("item_master", ItemMasterSchema, "items");
