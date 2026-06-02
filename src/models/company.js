const mongoose = require("mongoose");

const CompanySchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    compdesc: {
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

module.exports = mongoose.model("company", CompanySchema, "companies");
