const mongoose = require("mongoose");

const CreationAnimalSchema = new mongoose.Schema(
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
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("creation_animal", CreationAnimalSchema, "item_location_master");
