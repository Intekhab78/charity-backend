const mongoose = require("mongoose");

const BatchSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    item_id: String,
    batch_number: {
      type: String,
      trim: true
    },
    qty: {
      type: Number,
      default: 0
    },
    current_in_stock: {
      type: Number,
      default: 0
    },
    expiry_date: Date
    ,
    animal_code: String,
    animal_name: String,
    location_id: Number,
    location_name: String,
    location_code: String,
    currency_id_inr: Number,
    currency_id_online: Number,
    currency_code_online: String,
    rate_inr: {
      type: Number,
      default: 0
    },
    rate_inronline: {
      type: Number,
      default: 0
    },
    rate_usd: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("batch", BatchSchema, "batches");
