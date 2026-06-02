const mongoose = require("mongoose");

const CustomerLoginSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    customer_id: {
      type: Number,
      required: true
    },
    customer_code: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    password: {
      type: String,
      required: true
    },
    last_login: Date
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("customer_login", CustomerLoginSchema, "customer_login");
