const mongoose = require("mongoose");

const ShippingAddressSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    customer_id: {
      type: Number,
      required: true
    },
    customer_code: String,
    full_name: {
      type: String,
      required: true,
      trim: true
    },
    phone_number: {
      type: String,
      required: true,
      trim: true
    },
    alternate_phone_number: String,
    pincode: {
      type: String,
      required: true,
      trim: true
    },
    address_line1: {
      type: String,
      required: true
    },
    address_line2: String,
    city: {
      type: String,
      required: true,
      trim: true
    },
    state: {
      type: String,
      required: true,
      trim: true
    },
    country: {
      type: String,
      required: true,
      default: "India"
    },
    address_type: {
      type: String,
      enum: ["Home", "Office", "Other"],
      default: "Home"
    },
    is_default: {
      type: Boolean,
      default: false
    },
    latitude: String,
    longitude: String,
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

module.exports = mongoose.model("shipping_address", ShippingAddressSchema, "shipping_address");
