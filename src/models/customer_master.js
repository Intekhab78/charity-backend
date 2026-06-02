const mongoose = require("mongoose");

const CustomerMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    customer_code: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    first_name: {
      type: String,
      required: true,
      trim: true
    },
    last_name: {
      type: String,
      trim: true
    },
    email: {
      type: String,
      trim: true,
      lowercase: true
    },
    phone: {
      type: String,
      required: true,
      trim: true
    },
    alternate_phone: String,
    dob: Date,
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"]
    },
    billing_address: {
      type: String,
      required: true
    },
    shipping_address: String,
    city: String,
    state: String,
    country: String,
    zipcode: String,
    gst_number: String,
    customer_type: {
      type: String,
      enum: ["Individual", "Business"],
      default: "Individual"
    },
    loyalty_points: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active"
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("customer_master", CustomerMasterSchema, "customer_master");
