const mongoose = require("mongoose");

const QurbaniDateMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    uuid: {
      type: String,
      default: () => require("crypto").randomUUID()
    },
    qurbani_date: {
      type: String,
      required: true,
      trim: true
    },
    actual_date: {
      type: String,
      trim: true
    },
    description: {
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

module.exports = mongoose.model("qurbani_date_master", QurbaniDateMasterSchema, "qurbani_date_master");
