const mongoose = require("mongoose");

const ItemMainPriceSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    item_id: Number,
    item_price: {
      type: Number,
      default: 0
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

module.exports = mongoose.model("item_main_price", ItemMainPriceSchema, "item_main_prices");
