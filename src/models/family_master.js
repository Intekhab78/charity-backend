const mongoose = require("mongoose");

const FamilyMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    itemfamcode: String,
    itemfamname: {
      type: String,
      trim: true
    },
    itemfamlong: String,
    itemdeptname: String,
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

module.exports = mongoose.model("family_master", FamilyMasterSchema, "family_master");
