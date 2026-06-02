const mongoose = require("mongoose");

const CurrencyMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    currency_name: {
      type: String,
      trim: true
    },
    currency_code: {
      type: String,
      trim: true,
      uppercase: true
    },
    symbol: String,
    rate_inr: {
      type: Number,
      default: 1
    },
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("currency_master", CurrencyMasterSchema, "currency_masters");
