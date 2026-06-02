const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    role: {
      type: String,
      trim: true
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
      default: 5
    },
    comment: {
      type: String,
      required: true,
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

module.exports = mongoose.model("review", ReviewSchema, "reviews");
