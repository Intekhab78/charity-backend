const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID, DEFAULT_ORGANISATION_ID } = require("../config/defaults");

const CustomerInfoSchema = new mongoose.Schema(
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
    customer_code: {
      type: String,
      trim: true
    },
    trn_name: String,
    trn_no: String,
    customer_phone: String,
    customer_phone_1: String,
    customer_phone_2: String,
    customer_email: String,
    customer_address_1: String,
    customer_address_2: String,
    customer_city: String,
    customer_state: String,
    customer_zipcode: String,
    profile_image: String,
    radius: String,
    customer_address_1_lat: String,
    customer_address_1_lang: String,
    customer_address_2_lat: String,
    customer_address_2_lang: String,
    balance: {
      type: Number,
      default: 0
    },
    credit_limit: {
      type: Number,
      default: 0
    },
    credit_days: {
      type: Number,
      default: 0
    },
    due_on: {
      type: String,
      enum: ["1", "2"],
      default: "1"
    },
    source: {
      type: Number,
      default: 0
    },
    status: {
      type: Number,
      default: 1
    },
    is_lob: {
      type: Number,
      default: 0
    },
    current_stage: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved"
    },
    sales_enable: {
      type: String,
      enum: ["0", "1"],
      default: "1"
    },
    return_enable: {
      type: String,
      enum: ["0", "1"],
      default: "1"
    },
    collection_enable: {
      type: String,
      enum: ["0", "1"],
      default: "1"
    },
    print_enable: {
      type: String,
      enum: ["0", "1"],
      default: "1"
    },
    geo_checking: {
      type: String,
      enum: ["0", "1"],
      default: "0"
    },
    organisation_id: {
      type: Number,
      default: DEFAULT_ORGANISATION_ID
    },
    company_id: {
      type: Number,
      default: DEFAULT_COMPANY_ID
    },
    location_id: {
      type: Number,
      default: DEFAULT_LOCATION_ID
    },
    creation_source: String,
    created_by: String
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("customer_info", CustomerInfoSchema, "customer_infos");
