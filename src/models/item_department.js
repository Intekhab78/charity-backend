const mongoose = require("mongoose");

const ItemDepartmentSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    deptcode: String,
    deptname: {
      type: String,
      trim: true
    },
    itemdeptname: {
      type: String,
      trim: true
    },
    deptdesclong: String,
    status: {
      type: Number,
      default: 1
    },
    company_id: Number,
    location_id: Number,
    dept_image: {
      type: String,
      default: ""
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("item_department", ItemDepartmentSchema, "item_departments");
