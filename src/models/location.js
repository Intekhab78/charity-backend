const mongoose = require("mongoose");

const LocationSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    compdesc: String,
    loccode: String,
    locname: {
      type: String,
      trim: true
    },
    locdesclong: String,
    ccompany: String,
    ccurrency: String,
    clicense: String,
    ctaxnumber: String,
    cacurrency: String,
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("location", LocationSchema, "locations");
