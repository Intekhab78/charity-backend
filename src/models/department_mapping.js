const mongoose = require("mongoose");

const DepartmentMappingSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      unique: true
    },
    dept_id: Number,
    company_id: Number,
    location_id: Number,
    organisation_id: Number,
    status: {
      type: Number,
      default: 1
    }
  },
  {
    timestamps: false
  }
);

module.exports = mongoose.model("department_mapping", DepartmentMappingSchema, "department_mapping");
