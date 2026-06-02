const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID } = require("../config/defaults");

const BookingMasterSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    user_id: {
      type: Number,
      required: true
    },
    vehicle_type: String,
    vehicle_number: String,
    from_location: String,
    to_location: String,
    departure_time: String,
    arrival_time: String,
    class_type: String,
    price: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: "Confirmed"
    },
    company_id: {
      type: Number,
      default: DEFAULT_COMPANY_ID
    },
    location_id: {
      type: Number,
      default: DEFAULT_LOCATION_ID
    },
    qurbani_date: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("booking_master", BookingMasterSchema, "booking_masters");
