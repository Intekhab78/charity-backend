const mongoose = require("mongoose");
const { v4: uuidv4 } = require("uuid");

const RoleSchema = new mongoose.Schema(
  {
    role_id: {
      type: Number,
      unique: true
    },
    uuid: {
      type: String,
      default: uuidv4,
      unique: true
    },
    role_name: {
      type: String,
      required: true,
      trim: true
    },
    role_description: {
      type: String,
      trim: true
    }
  },
  {
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }
  }
);

module.exports = mongoose.model("role_master", RoleSchema, "role_masters");
