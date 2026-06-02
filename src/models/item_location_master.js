const mongoose = require("mongoose");

const ItemLocationMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    item_id: String,
    item_code: {
      type: String,
      trim: true
    },
    item_name: {
      type: String,
      trim: true
    },
    item_description: String,
    company_id: Number,
    location_id: Number,
    itemprice: {
      type: Number,
      default: 0
    },
    item_image: {
      type: String,
      default: ""
    },
    departname: {
      type: String,
      trim: true
    },
    item_department: {
      id: Number,
      itemdeptname: String
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

module.exports = mongoose.model("item_location_master", ItemLocationMasterSchema, "item_location_master");
