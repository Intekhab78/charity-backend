const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const OrderSchema = new mongoose.Schema(
  {
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    organisation_id: {
      type: Number,
      default: 1
    },
    customer_id: Number,
    vendor_id: Number,
    depot_id: Number,
    order_type_id: {
      type: Number,
      default: 1
    },
    salesman_id: Number,
    route_id: Number,
    storage_location_id: Number,
    customer_lpo: String,
    order_number: {
      type: String,
      unique: true
    },
    transaction_type: String,
    payment_id: {
      type: Number,
      default: 1
    },
    payment_term_id: Number,
    payment_type: String,
    order_date: {
      type: Date,
      default: Date.now
    },
    due_date: Date,
    delivery_date: Date,
    total_qty: {
      type: Number,
      default: 0
    },
    open_qty: {
      type: Number,
      default: 0
    },
    total_weight: {
      type: Number,
      default: 0
    },
    total_pallet: {
      type: Number,
      default: 0
    },
    total_pallet_volume: {
      type: Number,
      default: 0
    },
    total_gross: {
      type: Number,
      default: 0
    },
    total_discount_amount: {
      type: Number,
      default: 0
    },
    total_net: {
      type: Number,
      default: 0
    },
    total_vat: {
      type: Number,
      default: 0
    },
    total_excise: {
      type: Number,
      default: 0
    },
    grand_total: {
      type: Number,
      default: 0
    },
    any_comment: String,
    current_stage: {
      type: String,
      default: "Order Placed"
    },
    current_stage_comment: String,
    approval_status: {
      type: String,
      enum: ["Deleted", "Created", "Updated", "In-Process", "Partial-Delivered", "Delivered", "Completed", "Cancel", "Assigned", "On-Hold"]
    },
    is_sync: {
      type: Number,
      default: 0
    },
    erp_id: Number,
    erp_status: String,
    sign_image: String,
    source: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      default: "Order Placed"
    },
    current_order_status: Number,
    is_recurring: Number,
    is_load_created: Number,
    lob_id: Number,
    order_request_json: String,
    source_order_number: String,
    delivery_charge: {
      type: Number,
      default: 0
    },
    card_type: String,
    card_charge: {
      type: Number,
      default: 0
    },
    recurring_id: Number,
    customer_address_id: Number,
    cancel_reason: String,
    cancel_department: String,
    source_ref_number: String,
    created_by: Number,
    order_type: String,
    type: {
      type: String,
      default: "Online Sales Order"
    },
    taxable_total: {
      type: Number,
      default: 0
    },
    cgst_amount: {
      type: Number,
      default: 0
    },
    sgst_amount: {
      type: Number,
      default: 0
    },
    igst_amount: {
      type: Number,
      default: 0
    },
    company_id: Number,
    location_id: Number
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("order", OrderSchema, "orders");
