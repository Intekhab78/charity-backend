const mongoose = require("mongoose");

const OrderDetailsSchema = new mongoose.Schema(
  {
    uuid: String,
    order_id: mongoose.Schema.Types.ObjectId,
    item_id: Number,
    item_uom_id: Number,
    discount_id: Number,
    is_free: {
      type: Number,
      default: 0
    },
    is_item_poi: {
      type: Number,
      default: 0
    },
    promotion_id: Number,
    item_qty: {
      type: Number,
      default: 0
    },
    open_qty: {
      type: Number,
      default: 0
    },
    item_weight: String,
    total_pallet: {
      type: Number,
      default: 0
    },
    total_pallet_volume: {
      type: Number,
      default: 0
    },
    item_price: {
      type: Number,
      default: 0
    },
    item_gross: {
      type: Number,
      default: 0
    },
    item_discount_amount: {
      type: Number,
      default: 0
    },
    item_net: {
      type: Number,
      default: 0
    },
    item_vat: {
      type: Number,
      default: 0
    },
    item_excise: {
      type: Number,
      default: 0
    },
    item_grand_total: {
      type: Number,
      default: 0
    },
    delivered_qty: {
      type: Number,
      default: 0
    },
    order_status: {
      type: String,
      enum: ["Pending", "Delivered", "Partial-Delivered", "Cancelled", "Refunded", "Exchanged"],
      default: "Pending"
    },
    current_order_status: Number,
    ptr_di: {
      type: Number,
      default: 0
    },
    taxa_ble: {
      type: Number,
      default: 0
    },
    cgst: {
      type: Number,
      default: 0
    },
    cgst_amount: {
      type: Number,
      default: 0
    },
    sgst: {
      type: Number,
      default: 0
    },
    sgst_amount: {
      type: Number,
      default: 0
    },
    igst: {
      type: Number,
      default: 0
    },
    igst_amount: {
      type: Number,
      default: 0
    },
    discounttype: String,
    itemtype: String,
    landed_cost_per_unit: {
      type: Number,
      default: 0
    },
    expiry_delivery_date: Date,
    receiving_site: String,
    purchase_cost_per_unit: {
      type: Number,
      default: 0
    },
    hsn_code: String
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("order_details", OrderDetailsSchema, "order_details");
