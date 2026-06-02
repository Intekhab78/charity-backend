const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID } = require("../config/defaults");

const JWT_SECRET = process.env.JWT_SECRET;

// Auto-increment integer ID helper to ensure full compatibility with original ERP IDs
const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

const createOrderNumber = () => {
  const random = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `S1O-${Date.now()}-${random}`;
};

const createOrderWithUniqueNumber = async (orderData) => {
  let lastError;

  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      return await db.order.create({
        ...orderData,
        order_number: createOrderNumber()
      });
    } catch (error) {
      const isDuplicateOrderNumber =
        error?.code === 11000 && error?.keyPattern?.order_number;

      if (!isDuplicateOrderNumber) {
        throw error;
      }

      lastError = error;
    }
  }

  throw lastError;
};

const getCustomerDisplayName = (data = {}) => {
  return data.customer_name ||
    [data.first_name, data.last_name].filter(Boolean).join(" ").trim() ||
    data.name ||
    "";
};

const createQurbaniBookingFromOrder = async (order, payload) => {
  const existing = await db.qurbani_booking.findOne({ source_order_id: String(order._id) });
  if (existing) return existing;

  const items = Array.isArray(payload.items) ? payload.items : [];
  const charityPersons = Array.isArray(payload.charity_persons) ? payload.charity_persons : [];
  const itemIds = [...new Set(items.map(item => Number(item.item_id)).filter(Number.isFinite))];
  const itemRecords = await db.item_location_master.find({ id: { $in: itemIds } }).lean();
  const itemById = new Map(itemRecords.map(item => [Number(item.id), item]));
  const itemPayloadById = new Map(items.map(item => [Number(item.item_id), item]));

  const nextBookingId = await getNextId(db.qurbani_booking);
  const booking = await db.qurbani_booking.create({
    id: nextBookingId,
    customer_name: getCustomerDisplayName(payload),
    customer_phone: payload.phone || payload.customer_phone || "",
    customer_email: payload.email || payload.customer_email || "",
    vendor_name: payload.vendor_name || process.env.WEBSITE_VENDOR_NAME || "",
    total_shares: charityPersons.length || Number(order.total_qty) || 0,
    share_code: [...new Set(items.map(item => item.name || itemById.get(Number(item.item_id))?.item_name).filter(Boolean))].join(", "),
    booking_date: order.order_date || new Date(),
    total_amount: Number(order.grand_total || payload.total || 0),
    payment_mode: order.payment_type || payload.payment_details?.method || "",
    status: "Confirmed",
    company_id: Number(order.company_id || payload.company_id) || DEFAULT_COMPANY_ID,
    location_id: Number(order.location_id || payload.location_id) || DEFAULT_LOCATION_ID,
    qurbani_date: payload.qurbani_date || "",
    is_approved_by_admin: 1,
    source: "website_order",
    source_order_id: String(order._id),
    source_order_number: order.order_number
  });

  const year = new Date(order.order_date || order.created_at || Date.now()).getFullYear();
  const shareRows = charityPersons.length > 0
    ? charityPersons
    : items.flatMap(item => Array.from({ length: Number(item.quantity || item.qty || 1) }, () => ({
        item_id: item.item_id,
        name: getCustomerDisplayName(payload),
        mobile: payload.phone || payload.customer_phone || "",
        objective: item.name || ""
      })));

  for (let index = 0; index < shareRows.length; index += 1) {
    const person = shareRows[index];
    const item = itemPayloadById.get(Number(person.item_id)) || {};
    const itemRecord = itemById.get(Number(person.item_id));
    const quantity = Number(item.quantity || item.qty) || shareRows.filter(row => Number(row.item_id) === Number(person.item_id)).length || 1;
    const amount = Number(item.total || 0) > 0
      ? Number(item.total) / quantity
      : Number(item.price || itemRecord?.itemprice || 0);
    const nextShareId = await getNextId(db.qurbani_share);

    await db.qurbani_share.create({
      id: nextShareId,
      booking_id: booking._id,
      share_reg_no: `REG/${year}/${nextBookingId}/${index + 1}`,
      beneficiary_name: person.name || getCustomerDisplayName(payload),
      beneficiary_mobile: person.mobile || payload.phone || payload.customer_phone || "",
      objective: person.objective || item.name || itemRecord?.item_name || "",
      amount
    });
  }

  return booking;
};

// ==========================================
// 1. ITEM DEPARTMENT CONTROLLERS
// ==========================================

exports.getDepartmentDropdown = async (req, res) => {
  try {
    const list = await db.item_department.find({ status: 1 }).sort({ deptname: 1 });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentList = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause.deptname = { $regex: search, $options: "i" };
    }

    const count = await db.item_department.countDocuments(whereClause);
    const rows = await db.item_department.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ id: -1 });

    return res.status(200).json({
      success: true,
      total: count,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getDepartmentsByCompanyAndLocation = async (req, res) => {
  try {
    const { company_id, location_id } = req.params;
    const list = await db.item_department.find({
      company_id: Number(company_id),
      location_id: Number(location_id),
      status: 1
    }).sort({ id: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 2. ITEM LOCATION MASTER CONTROLLERS
// ==========================================

exports.getCharityItemList = async (req, res) => {
  try {
    const { comp_id } = req.params;
    const { page = 1, limit = 20, search } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = { company_id: Number(comp_id) };
    if (search) {
      whereClause.item_name = { $regex: search, $options: "i" };
    }

    const count = await db.item_location_master.countDocuments(whereClause);
    const rows = await db.item_location_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ id: -1 });

    return res.status(200).json({
      success: true,
      total: count,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getItemLocationList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, company_id } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (company_id) whereClause.company_id = Number(company_id);
    if (search) {
      whereClause.$or = [
        { item_name: { $regex: search, $options: "i" } },
        { item_code: { $regex: search, $options: "i" } }
      ];
    }

    const count = await db.item_location_master.countDocuments(whereClause);
    const rows = await db.item_location_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ id: -1 });

    return res.status(200).json({
      success: true,
      total: count,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 3. ITEM MASTER CONTROLLER (Global Search Alternative)
// ==========================================

exports.getItemList = async (req, res) => {
  try {
    const { page = 1, limit = 20, search } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause.$or = [
        { item_code: { $regex: search, $options: "i" } },
        { item_name: { $regex: search, $options: "i" } }
      ];
    }

    const count = await db.item_master.countDocuments(whereClause);
    const rows = await db.item_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ id: -1 });

    return res.status(200).json({
      success: true,
      total: count,
      data: rows
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 4. (REMOVED) BRAND & SIZE CONTROLLERS
// ==========================================

// ==========================================
// 5. FAMILY & SUB FAMILY CONTROLLERS
// ==========================================

exports.getFamilyList = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause.itemfamname = { $regex: search, $options: "i" };
    }

    const count = await db.family_master.countDocuments(whereClause);
    const rows = await db.family_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ itemfamname: 1 });

    return res.status(200).json({ success: true, total: count, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFamilyByIdList = async (req, res) => {
  try {
    const { id } = req.body;
    const list = await db.family_master.find({ itemdeptname: String(id), status: 1 }).sort({ id: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubFamilyList = async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.body;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereClause = {};
    if (search) {
      whereClause.itemsfamname = { $regex: search, $options: "i" };
    }

    const count = await db.sub_family_master.countDocuments(whereClause);
    const rows = await db.sub_family_master.find(whereClause)
      .skip(offset)
      .limit(parseInt(limit))
      .sort({ itemsfamname: 1 });

    return res.status(200).json({ success: true, total: count, data: rows });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSubFamilyByIdList = async (req, res) => {
  try {
    const { id } = req.body;
    const list = await db.sub_family_master.find({ itemfamcode: String(id), status: 1 }).sort({ id: -1 });
    return res.status(200).json({ success: true, data: list });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 6. COMPANY & LOCATION CONTROLLERS
// ==========================================

exports.getCompanyList = async (req, res) => {
  try {
    const companies = await db.company.find({ status: 1 }).sort({ compdesc: 1 });
    return res.status(200).json({ success: true, data: companies });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLocationList = async (req, res) => {
  try {
    const locations = await db.location.find({ status: 1 }).sort({ locname: 1 });
    return res.status(200).json({ success: true, data: locations });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 7. SHIPPING ADDRESS CONTROLLERS
// ==========================================

exports.listAddresses = async (req, res) => {
  try {
    const { customer_id } = req.params;
    const addresses = await db.shipping_address.find({ customer_id: Number(customer_id) })
      .sort({ is_default: -1, id: -1 });
    return res.status(200).json({ success: true, data: addresses });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.createAddress = async (req, res) => {
  try {
    const nextId = await getNextId(db.shipping_address);
    const newAddress = await db.shipping_address.create({
      ...req.body,
      id: nextId,
      status: "Active"
    });
    return res.status(201).json({ success: true, message: "Shipping address created", data: newAddress });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await db.shipping_address.findOne({ id: Number(id) });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    address.set(req.body);
    await address.save();

    return res.status(200).json({ success: true, message: "Address updated successfully", data: address });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const address = await db.shipping_address.findOne({ id: Number(id) });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    await address.deleteOne();
    return res.status(200).json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 8. E-COMMERCE ORDERS CONTROLLERS
// ==========================================

exports.ecommerceOrderStore = async (req, res) => {
  try {
    const {
      customer_id,
      discount = 0,
      net,
      vat = 0,
      excise = 0,
      total,
      order_type,
      items = [],
      company_id,
      location_id,
      payment_details = {},
      shipping_address = {},
      any_comment
    } = req.body;

    const totalQty = items.reduce((sum, it) => sum + Number(it.quantity || 0), 0);

    // Create main Order document
    const Order = await createOrderWithUniqueNumber({
      customer_id: Number(customer_id) || 1001,
      vendor_id: Number(customer_id) || 1001,
      customer_lpo: "online customer",
      order_date: new Date(),
      delivery_date: new Date(),
      payment_term_id: 1,
      total_qty: totalQty,
      open_qty: totalQty,
      total_discount_amount: discount,
      total_net: net,
      total_vat: vat,
      total_excise: excise,
      grand_total: total,
      status: "Order Placed",
      current_stage: "Order Placed",
      payment_type: payment_details.method || "card",
      order_type: order_type || "",
      company_id: Number(company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(location_id) || DEFAULT_LOCATION_ID,
      type: "Online Sales Order",
      any_comment: any_comment,
      order_request_json: JSON.stringify({
        items,
        charity_persons: req.body.charity_persons || []
      }),
      source_ref_number: req.body.order_id || null,
      customer_address_id: shipping_address?.id || null
    });

    // Create Order Details items
    for (let item of items) {
      await db.order_details.create({
        order_id: Order._id,
        item_id: Number(item.item_id),
        item_uom_id: Number(item.uom) || 1,
        item_qty: Number(item.quantity),
        open_qty: Number(item.quantity),
        item_price: Number(item.price),
        item_gross: Number(item.price),
        item_discount_amount: Number(item.discount) || 0,
        item_net: Number(item.net) || (item.price * item.quantity),
        item_vat: Number(item.vat) || 0,
        item_excise: Number(item.excise) || 0,
        item_grand_total: Number(item.total) || (item.price * item.quantity),
        order_status: "Pending",
        delivered_qty: 0
      });
    }

    const qurbaniBooking = await createQurbaniBookingFromOrder(Order, req.body);

    return res.status(201).json({
      success: true,
      message: "Order placed successfully",
      data: {
        id: Order.id,
        order_number: Order.order_number,
        grand_total: Order.grand_total,
        booking_id: qurbaniBooking.id
      }
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getOrdersByCustomerId = async (req, res) => {
  try {
    const { customer_id } = req.body;
    const customerIds = [];

    if (!Number.isNaN(Number(customer_id))) {
      customerIds.push(Number(customer_id));
    } else if (customer_id) {
      const customerInfo = await db.customer_info
        .findOne({ customer_code: String(customer_id) })
        .lean();
      const customerMaster = await db.customer_master
        .findOne({ customer_code: String(customer_id) })
        .lean();

      if (customerInfo?.id) customerIds.push(Number(customerInfo.id));
      if (customerInfo?.user_id) customerIds.push(Number(customerInfo.user_id));
      if (customerMaster?.id) customerIds.push(Number(customerMaster.id));
    }

    const uniqueCustomerIds = [...new Set(customerIds.filter(Number.isFinite))];

    if (uniqueCustomerIds.length === 0) {
      return res.status(200).json({ success: true, data: [], orders: [] });
    }

    const orders = await db.order.find({
      $or: [
        { customer_id: { $in: uniqueCustomerIds } },
        { vendor_id: { $in: uniqueCustomerIds } }
      ]
    }).sort({ created_at: -1 }).lean();

    // Map embedded order details
    for (let order of orders) {
      order.customer_details = await db.customer_info
        .findOne({
          $or: [
            { id: Number(order.customer_id) },
            { user_id: Number(order.customer_id) }
          ]
        })
        .lean();

      order.order_details = await db.order_details.find({ order_id: order._id }).lean();

      for (let item of order.order_details) {
        item.itemLocationModel = await db.item_location_master
          .findOne({ id: Number(item.item_id) })
          .lean();
      }
    }

    return res.status(200).json({ success: true, data: orders, orders });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ==========================================
// 9. E-COMMERCE CUSTOMER ACCOUNT & PROFILE
// ==========================================

exports.listCustomers = async (req, res) => {
  try {
    const customers = await db.customer_master.find().sort({ id: -1 });
    return res.status(200).json({ success: true, data: customers });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id, first_name, last_name, email, phone, billing_address, shipping_address } = req.body;
    if (!id) return res.status(400).json({ success: false, message: "Customer ID is required" });

    const customer = await db.customer_master.findOne({ id: Number(id) });
    if (!customer) return res.status(404).json({ success: false, message: "Customer not found" });

    customer.set({ first_name, last_name, email, phone, billing_address, shipping_address });
    await customer.save();

    return res.status(200).json({ success: true, message: "Customer profile updated successfully", data: customer });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const { customer_id, old_password, new_password } = req.body;
    if (!customer_id || !new_password) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const loginRecord = await db.customer_login.findOne({ customer_id: Number(customer_id) });
    if (!loginRecord) return res.status(404).json({ success: false, message: "Login record not found" });

    if (old_password) {
      const match = await bcrypt.compare(old_password, loginRecord.password);
      if (!match) return res.status(401).json({ success: false, message: "Incorrect old password" });
    }

    const hashedPassword = await bcrypt.hash(new_password, 8);
    loginRecord.password = hashedPassword;
    await loginRecord.save();

    return res.status(200).json({ success: true, message: "Password updated successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.loginEcommerceCustomer = async (req, res) => {
  try {
    const { email, phone, password } = req.body;
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    }
    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: "Credentials and password are required" });
    }

    const whereClause = email ? { email } : { phone };
    const userLogin = await db.customer_login.findOne(whereClause);

    if (!userLogin) {
      return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
    }

    const match = await bcrypt.compare(password, userLogin.password);
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid email/phone or password" });
    }

    const customer = await db.customer_master.findOne({ id: userLogin.customer_id });

    // Generate JWT
    const token = jwt.sign(
      { customer_id: userLogin.customer_id, customer_code: userLogin.customer_code, email: userLogin.email, role: "customer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Update last login timestamp
    userLogin.last_login = new Date();
    await userLogin.save();

    return res.status(200).json({
      success: true,
      message: "Login successful",
      token,
      customer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.onlineCustRegLogin = async (req, res) => {
  try {
    const { first_name, last_name, email, phone, password, billing_address } = req.body;
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    }

    if (!first_name || !email || !phone || !password) {
      return res.status(400).json({ success: false, message: "Required registration fields are missing" });
    }

    // Check if duplicate login email/phone
    const existing = await db.customer_login.findOne({ $or: [{ email }, { phone }] });
    if (existing) {
      return res.status(400).json({ success: false, message: "A customer account with this email/phone already exists" });
    }

    const customerCode = `CUST-${Date.now().toString().slice(-6)}`;
    const hashedPassword = await bcrypt.hash(password, 8);

    const nextCustId = await getNextId(db.customer_master);

    // Create customer master record
    const customer = await db.customer_master.create({
      id: nextCustId,
      customer_code: customerCode,
      first_name,
      last_name: last_name || "",
      email,
      phone,
      billing_address: billing_address || "",
      status: "Active"
    });

    // Create customer login record
    await db.customer_login.create({
      id: nextCustId,
      customer_id: customer.id,
      customer_code: customer.customer_code,
      email,
      phone,
      password: hashedPassword,
      last_login: new Date()
    });

    // Create system profile in customer_info table to keep ERP sync!
    await db.customer_info.create({
      id: nextCustId,
      user_id: customer.id,
      customer_code: customer.customer_code,
      trn_name: `${first_name} ${last_name || ""}`.trim(),
      customer_phone: phone,
      customer_address_1: billing_address || "",
      status: 1,
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID
    });

    // Auto login
    const token = jwt.sign(
      { customer_id: customer.id, customer_code: customer.customer_code, email: customer.email, role: "customer" },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      success: true,
      message: "Registration and login successful",
      token,
      customer
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
