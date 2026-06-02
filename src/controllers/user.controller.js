const db = require("../models");
const bcrypt = require("bcrypt");
const crypto = require("crypto");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID, DEFAULT_ORGANISATION_ID, DEFAULT_VENDOR_ROLE_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

/**
 * CREATE VENDOR (Refined with more ERP defaults)
 */
exports.createVendor = async (req, res) => {
  try {
    const { firstname, lastname, email, password, mobile } = req.body;

    if (!email || !firstname || !lastname || !mobile || !password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const existing = await db.user_master.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already exists" });
    }

    const nextId = await getNextId(db.user_master);

    // Prepare full data with all possible ERP required fields
    const userData = {
      id: nextId,
      uuid: crypto.randomUUID(),
      firstname,
      lastname,
      email,
      password,
      mobile,
      role_id: DEFAULT_VENDOR_ROLE_ID,
      status: 1,
      is_approved_by_admin: 1,
      usertype: 2,
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID,
      organisation_id: Number(req.body.organisation_id) || DEFAULT_ORGANISATION_ID,
      login_type: "system",
      parent_id: "0",
      api_token: "",
      email_verified_at: new Date(),
      remember_token: ""
    };

    if (req.file) {
      userData.profile_image = req.file.filename;
    }

    console.log("Attempting to create Mongoose user with data:", userData);

    const newUser = await db.user_master.create(userData);

    res.status(201).json({
      success: true,
      message: "Vendor created successfully",
      data: { id: newUser.id, email: newUser.email }
    });
  } catch (error) {
    console.error("FULL DATABASE ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Database Error",
      detail: error.message,
      stack: error.message
    });
  }
};

/**
 * LIST VENDORS
 */
exports.listVendors = async (req, res) => {
  try {
    const vendors = await db.user_master.find(
      { role_id: DEFAULT_VENDOR_ROLE_ID },
      "id firstname lastname email mobile created_at profile_image"
    ).sort({ created_at: -1 });
    res.status(200).json({ success: true, data: vendors });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE VENDOR
 */
exports.updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, mobile, password } = req.body;

    const conditions = [];
    if (!isNaN(id)) conditions.push({ id: Number(id) });
    if (/^[0-9a-fA-F]{24}$/.test(id)) conditions.push({ _id: id });
    
    if (conditions.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Vendor ID format" });
    }
    
    const user = await db.user_master.findOne({ $or: conditions });
    if (!user) return res.status(404).json({ success: false, message: "Vendor not found" });

    let updateData = { firstname, lastname, email, mobile };
    if (password) {
      updateData.password = await bcrypt.hash(password, 8);
    }

    if (req.file) {
      updateData.profile_image = req.file.filename;
    }

    user.set(updateData);
    await user.save();
    res.status(200).json({ success: true, message: "Vendor updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE VENDOR
 */
exports.deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = [];
    if (!isNaN(id)) conditions.push({ id: Number(id) });
    if (/^[0-9a-fA-F]{24}$/.test(id)) conditions.push({ _id: id });
    
    if (conditions.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Vendor ID format" });
    }

    const user = await db.user_master.findOne({ $or: conditions });
    if (!user) return res.status(404).json({ success: false, message: "Vendor not found" });

    await user.deleteOne();
    res.status(200).json({ success: true, message: "Vendor deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
