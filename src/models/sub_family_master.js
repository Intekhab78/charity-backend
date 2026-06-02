const mongoose = require("mongoose");

const SubFamilyMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    itemsfamcode: String,
    itemsfamname: {
      type: String,
      trim: true
    },
    itemsfamlong: String,
    itemdeptname: String,
    itemfamcode: String,
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

module.exports = mongoose.model("sub_family_master", SubFamilyMasterSchema, "sub_family_master");
