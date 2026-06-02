const db = require("../models");
const crypto = require("crypto");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID, DEFAULT_ORGANISATION_ID, DEFAULT_CUSTOMER_USER_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

/**
 * LIST CUSTOMERS
 */
exports.listCustomers = async (req, res) => {
  try {
    const filter = DEFAULT_COMPANY_ID ? { company_id: DEFAULT_COMPANY_ID } : {};
    const customers = await db.customer_info.find(filter)
      .sort({ created_at: -1 });
    res.status(200).json({ success: true, data: customers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CREATE CUSTOMER (Refined with all ERP required fields)
 */
exports.createCustomer = async (req, res) => {
  try {
    const { trn_name, customer_code, customer_phone, customer_email, customer_address_1, customer_city, user_id } = req.body;
    const nextId = await getNextId(db.customer_info);
    
    const customerData = {
      id: nextId,
      uuid: crypto.randomUUID(),
      trn_name,
      customer_code: customer_code || `CUS-${Date.now()}`,
      customer_phone,
      customer_email: customer_email || "",
      customer_address_1,
      customer_city,
      user_id: user_id || DEFAULT_CUSTOMER_USER_ID,
      status: 1,
      current_stage: 'Approved',
      organisation_id: Number(req.body.organisation_id) || DEFAULT_ORGANISATION_ID,
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID,
      
      profile_image: req.file ? req.file.filename : "", 
      customer_address_2: "",
      trn_no: "",
      trn_name: trn_name,
      customer_state: "",
      customer_zipcode: "",
      radius: "0",
      customer_phone_1: "",
      customer_phone_2: "",
      customer_address_1_lat: "0",
      customer_address_1_lang: "0",
      customer_address_2_lat: "0",
      customer_address_2_lang: "0",
      balance: 0,
      credit_limit: 0,
      credit_days: 0,
      due_on: "1",
      source: 0,
      is_lob: 0,
      sales_enable: "1",
      return_enable: "1",
      collection_enable: "1",
      print_enable: "1",
      geo_checking: "0",
      creation_source: "web",
      created_by: "system"
    };

    console.log("Creating customer in MongoDB with full ERP defaults...");

    const newCustomer = await db.customer_info.create(customerData);
    res.status(201).json({ success: true, message: "Customer created successfully", data: newCustomer });
  } catch (error) {
    console.error("CUSTOMER CREATE ERROR:", error);
    res.status(500).json({ 
      success: false, 
      message: "Database Error",
      detail: error.message 
    });
  }
};

/**
 * UPDATE CUSTOMER
 */
exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = [];
    if (!isNaN(id)) conditions.push({ id: Number(id) });
    if (/^[0-9a-fA-F]{24}$/.test(id)) conditions.push({ _id: id });
    
    if (conditions.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID format" });
    }

    const customer = await db.customer_info.findOne({ $or: conditions });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    const updateData = { ...req.body };
    if (req.file) {
      updateData.profile_image = req.file.filename;
    }

    customer.set(updateData);
    await customer.save();
    res.status(200).json({ success: true, message: "Customer updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE CUSTOMER
 */
exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const conditions = [];
    if (!isNaN(id)) conditions.push({ id: Number(id) });
    if (/^[0-9a-fA-F]{24}$/.test(id)) conditions.push({ _id: id });
    
    if (conditions.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid Customer ID format" });
    }

    const customer = await db.customer_info.findOne({ $or: conditions });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    await customer.deleteOne();
    res.status(200).json({ success: true, message: "Customer deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
