const db = require("../models");
const crypto = require("crypto");
const mongoose = require("mongoose");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID, DEFAULT_ORGANISATION_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

const findBookingByIdOrUuid = async (id) => {
  const query = {};
  if (!isNaN(id)) {
    query.id = Number(id);
  } else if (mongoose.Types.ObjectId.isValid(id)) {
    query._id = id;
  } else {
    return null;
  }
  return await db.qurbani_booking.findOne(query);
};

const parseOrderRequestJson = (order) => {
  if (!order.order_request_json) return {};
  try {
    return JSON.parse(order.order_request_json);
  } catch (error) {
    return {};
  }
};

const getOrderCustomer = async (customerId) => {
  if (!Number.isFinite(Number(customerId))) return null;

  const id = Number(customerId);
  return await db.customer_info.findOne({
    $or: [{ id }, { user_id: id }]
  }).lean() || await db.customer_master.findOne({ id }).lean();
};

const getCustomerName = (customer) => {
  if (!customer) return "";
  return customer.trn_name ||
    [customer.first_name, customer.last_name].filter(Boolean).join(" ").trim() ||
    "";
};

const getCustomerPhone = (customer) => {
  return customer?.customer_phone || customer?.phone || "";
};

const buildOrderBooking = async (order) => {
  const request = parseOrderRequestJson(order);
  const charityPersons = Array.isArray(request.charity_persons) ? request.charity_persons : [];
  const orderDetails = await db.order_details.find({ order_id: order._id }).lean();
  const itemIds = [...new Set(orderDetails.map(item => Number(item.item_id)).filter(Number.isFinite))];
  const items = await db.item_location_master.find({ id: { $in: itemIds } }).lean();
  const itemById = new Map(items.map(item => [Number(item.id), item]));
  const customer = await getOrderCustomer(order.customer_id);

  const shares = charityPersons.length > 0
    ? charityPersons.map((person, index) => {
        const detail = orderDetails.find(item => Number(item.item_id) === Number(person.item_id));
        const item = itemById.get(Number(person.item_id));
        const quantity = Number(detail?.item_qty) || charityPersons.filter(p => Number(p.item_id) === Number(person.item_id)).length || 1;
        const amount = Number(detail?.item_grand_total || detail?.item_net || detail?.item_price || 0) / quantity;

        return {
          share_reg_no: `WEB/${order.order_number || order._id}/${index + 1}`,
          beneficiary_name: person.name || getCustomerName(customer),
          beneficiary_mobile: person.mobile || getCustomerPhone(customer),
          objective: person.objective || item?.item_name || "",
          amount
        };
      })
    : orderDetails.map((detail, index) => {
        const item = itemById.get(Number(detail.item_id));
        return {
          share_reg_no: `WEB/${order.order_number || order._id}/${index + 1}`,
          beneficiary_name: getCustomerName(customer),
          beneficiary_mobile: getCustomerPhone(customer),
          objective: item?.item_name || "",
          amount: Number(detail.item_grand_total || detail.item_net || detail.item_price || 0)
        };
      });

  return {
    _id: order._id,
    id: order.order_number || String(order._id),
    source: "website_order",
    is_online_order: true,
    customer_name: getCustomerName(customer),
    customer_phone: getCustomerPhone(customer),
    customer_email: customer?.customer_email || customer?.email || "",
    vendor_name: order.vendor_name || process.env.WEBSITE_VENDOR_NAME || "",
    total_shares: shares.length || Number(order.total_qty) || 0,
    share_code: [...new Set(shares.map(share => share.objective).filter(Boolean))].join(", "),
    booking_date: order.order_date || order.created_at,
    total_amount: Number(order.grand_total || order.total_net || 0),
    payment_mode: order.payment_type || "Online",
    status: order.status || order.current_stage || "Order Placed",
    qurbani_date: order.qurbani_date || "",
    is_approved_by_admin: order.approval_status === "Completed" ? 1 : 0,
    created_at: order.created_at,
    updated_at: order.updated_at,
    shares
  };
};

const migrateWebsiteOrdersInternal = async () => {
  const websiteOrders = await db.order.find({
    $or: [
      { order_type: "online_charity" },
      { order_request_json: /"charity_persons"/ }
    ]
  }).sort({ created_at: -1 }).lean();

  let created = 0;

  for (let order of websiteOrders) {
    const existing = await db.qurbani_booking.findOne({ source_order_id: String(order._id) }).lean();
    if (existing) continue;

    const orderBooking = await buildOrderBooking(order);
    const nextBookingId = await getNextId(db.qurbani_booking);
    const booking = await db.qurbani_booking.create({
      id: nextBookingId,
      customer_name: orderBooking.customer_name,
      customer_phone: orderBooking.customer_phone,
      customer_email: orderBooking.customer_email,
      vendor_name: orderBooking.vendor_name,
      total_shares: orderBooking.total_shares,
      share_code: orderBooking.share_code,
      booking_date: orderBooking.booking_date,
      total_amount: orderBooking.total_amount,
      payment_mode: orderBooking.payment_mode,
      status: "Confirmed",
      company_id: Number(order.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(order.location_id) || DEFAULT_LOCATION_ID,
      qurbani_date: orderBooking.qurbani_date,
      is_approved_by_admin: 1,
      source: "website_order",
      source_order_id: String(order._id),
      source_order_number: order.order_number
    });

    const year = new Date(orderBooking.booking_date || order.created_at || Date.now()).getFullYear();
    for (let index = 0; index < orderBooking.shares.length; index += 1) {
      const share = orderBooking.shares[index];
      const nextShareId = await getNextId(db.qurbani_share);

      await db.qurbani_share.create({
        id: nextShareId,
        booking_id: booking._id,
        share_reg_no: `REG/${year}/${nextBookingId}/${index + 1}`,
        beneficiary_name: share.beneficiary_name,
        beneficiary_mobile: share.beneficiary_mobile,
        objective: share.objective || "",
        amount: share.amount || 0
      });
    }

    created += 1;
  }

  return { checked: websiteOrders.length, created };
};

/**
 * LIST QURBANI BOOKINGS
 */
exports.listBookings = async (req, res) => {
  try {
    try {
      await migrateWebsiteOrdersInternal();
    } catch (migrationError) {
      console.error("Website order migration skipped:", migrationError.message);
    }

    const bookings = await db.qurbani_booking.find().sort({ created_at: -1 }).lean();
    for (let booking of bookings) {
      booking.shares = await db.qurbani_share.find({ booking_id: booking._id }).lean();
    }

    const linkedOrderIds = new Set(
      bookings
        .map(booking => booking.source_order_id)
        .filter(Boolean)
        .map(String)
    );
    const websiteOrders = await db.order.find({
      $or: [
        { order_type: "online_charity" },
        { order_request_json: /"charity_persons"/ }
      ]
    }).sort({ created_at: -1 }).lean();
    const orderBookings = [];
    for (let order of websiteOrders) {
      if (linkedOrderIds.has(String(order._id))) continue;
      orderBookings.push(await buildOrderBooking(order));
    }

    const mergedBookings = [...bookings, ...orderBookings].sort((a, b) => {
      const aDate = new Date(a.booking_date || a.created_at || 0).getTime();
      const bDate = new Date(b.booking_date || b.created_at || 0).getTime();
      return bDate - aDate;
    });

    res.status(200).json({ success: true, data: mergedBookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.migrateWebsiteOrders = async (req, res) => {
  try {
    const result = await migrateWebsiteOrdersInternal();
    res.status(200).json({
      success: true,
      message: "Website orders migrated to qurbani bookings.",
      data: result
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * LIST DYNAMIC SHARE CODES
 */
exports.listShareCodes = async (req, res) => {
  try {
    const items = await db.item_location_master.find({ status: { $ne: 0 } }).sort({ item_name: 1 }).lean();

    const shareCodes = [];
    for (let item of items) {
      const price = item.itemprice || 0;

      shareCodes.push({
        id: item.id,
        code: item.item_code,
        name: item.item_name,
        price: price,
        image: item.item_image || "",
        display: `${item.item_name} - Rs ${price}`
      });
    }

    res.status(200).json({ success: true, data: shareCodes });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.listDepartments = async (req, res) => {
  try {
    const filters = [];
    if (DEFAULT_COMPANY_ID !== null) filters.push({ company_id: DEFAULT_COMPANY_ID });
    if (DEFAULT_ORGANISATION_ID !== null) filters.push({ organisation_id: DEFAULT_ORGANISATION_ID });
    const query = filters.length > 0 ? { $or: filters } : {};
    const list = await db.item_department.find(query, "id itemdeptname").sort({ itemdeptname: 1 }).lean();

    const results = list.map(d => ({
      id: d.id,
      dept_name: d.itemdeptname
    }));

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getCompany = async (req, res) => {
  try {
    const query = DEFAULT_COMPANY_ID !== null ? { id: DEFAULT_COMPANY_ID } : {};
    const company = await db.company.findOne(query).sort({ id: 1 }).lean();
    if (company) {
      res.status(200).json({
        success: true,
        data: {
          id: company.id,
          company_name: company.compdesc || "Charity Organisation",
          email: company.email || "",
          phone: company.phone || "",
          address: company.address || "",
          city: company.city || "",
          country: company.country || ""
        }
      });
    } else {
      res.status(200).json({
        success: true,
        data: { company_name: 'Charity Organisation', address: '', phone: '', email: '' }
      });
    }
  } catch (error) {
    res.status(200).json({ 
      success: true, 
      data: { company_name: 'Charity Organisation', address: '', phone: '', email: '' } 
    });
  }
};

/**
 * GET AVAILABLE BOOKING YEARS
 */
exports.getAvailableYears = async (req, res) => {
  try {
    const bookings = await db.qurbani_booking.find({}, "booking_date").lean();
    const yearsSet = new Set();
    bookings.forEach(b => {
      if (b.booking_date) {
        yearsSet.add(new Date(b.booking_date).getFullYear());
      }
    });

    const years = Array.from(yearsSet).sort((a, b) => b - a);
    if (years.length === 0) {
      years.push(new Date().getFullYear());
    }

    res.status(200).json({ success: true, data: years });
  } catch (error) {
    console.error("Error fetching available years:", error);
    res.status(200).json({ success: true, data: [new Date().getFullYear()] });
  }
};

/**
 * CREATE QURBANI BOOKING
 */
exports.createBooking = async (req, res) => {
  try {
    const { 
      customer_name, customer_phone, customer_email, 
      total_shares, share_code, total_amount, 
      payment_mode, shares, vendor_name, qurbani_date,
      is_approved_by_admin
    } = req.body;
    
    const nextId = await getNextId(db.qurbani_booking);
    const booking = await db.qurbani_booking.create({
      id: nextId,
      uuid: crypto.randomUUID(),
      customer_name, customer_phone, customer_email,
      total_shares, share_code, total_amount, payment_mode,
      vendor_name, qurbani_date,
      is_approved_by_admin: is_approved_by_admin !== undefined ? Number(is_approved_by_admin) : 0,
      status: "Confirmed",
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID
    });

    const shareData = shares.map((s, index) => ({
      booking_id: booking._id,
      share_reg_no: s.share_reg_no || `REG/${new Date().getFullYear()}/${Math.floor(Math.random()*10000)}/${index+1}`,
      beneficiary_name: s.beneficiary_name,
      beneficiary_mobile: s.beneficiary_mobile,
      objective: s.objective || "",
      amount: s.amount
    }));

    for (let share of shareData) {
      const nextShareId = await getNextId(db.qurbani_share);
      await db.qurbani_share.create({ ...share, id: nextShareId });
    }

    res.status(201).json({ success: true, message: "Booking Created", data: booking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE QURBANI BOOKING
 */
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      customer_name, customer_phone, customer_email, 
      total_shares, share_code, total_amount, 
      payment_mode, shares, qurbani_date 
    } = req.body;

    const booking = await findBookingByIdOrUuid(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    booking.set({
      customer_name, customer_phone, customer_email,
      total_shares, share_code, total_amount, payment_mode,
      qurbani_date
    });
    await booking.save();

    // Delete old shares and recreate
    await db.qurbani_share.deleteMany({ booking_id: booking._id });

    const shareData = shares.map((s, index) => ({
      booking_id: booking._id,
      share_reg_no: s.share_reg_no || `REG/${new Date().getFullYear()}/${Math.floor(Math.random()*10000)}/${index+1}`,
      beneficiary_name: s.beneficiary_name,
      beneficiary_mobile: s.beneficiary_mobile,
      objective: s.objective || "",
      amount: s.amount
    }));

    for (let share of shareData) {
      const nextShareId = await getNextId(db.qurbani_share);
      await db.qurbani_share.create({ ...share, id: nextShareId });
    }

    res.status(200).json({ success: true, message: "Booking Updated" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE QURBANI BOOKING
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdOrUuid(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    await db.qurbani_share.deleteMany({ booking_id: booking._id });
    await booking.deleteOne();
    
    res.status(200).json({ success: true, message: "Booking Deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * APPROVE QURBANI BOOKING (Admin-only)
 */
exports.approveBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await findBookingByIdOrUuid(id);
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    booking.is_approved_by_admin = 1;
    await booking.save();

    res.status(200).json({ success: true, message: "Booking Approved successfully!" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markSharesQurbaniDone = async (req, res) => {
  try {
    const { shareIds = [], message } = req.body;
    const ids = Array.isArray(shareIds)
      ? shareIds.filter(id => mongoose.Types.ObjectId.isValid(id))
      : [];

    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: "No share IDs provided" });
    }

    const messageText = message || process.env.QURBANI_DONE_MESSAGE || "";
    const now = new Date();

    const result = await db.qurbani_share.updateMany(
      { _id: { $in: ids } },
      {
        $set: {
          qurbani_done: true,
          qurbani_done_at: now,
          message_status: "sent",
          message_text: messageText,
          message_sent_at: now
        }
      }
    );

    res.status(200).json({
      success: true,
      message: "Qurbani marked done and customer message recorded.",
      data: {
        updated: result.modifiedCount || result.nModified || 0,
        message_text: messageText
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET QURBANI COLLECTION SUMMARY
 */
exports.getCollectionSummary = async (req, res) => {
  try {
    const bookings = await db.qurbani_booking.find().lean();
    
    const summary = {};
    let totalAmount = 0;
    let totalShares = 0;
    
    bookings.forEach(b => {
      const code = b.share_code || "Unknown";
      if (!summary[code]) {
        summary[code] = { share_code: code, shares: 0, amount: 0, bookings: 0 };
      }
      summary[code].shares += b.total_shares || 0;
      summary[code].amount += b.total_amount || 0;
      summary[code].bookings += 1;
      
      totalAmount += b.total_amount || 0;
      totalShares += b.total_shares || 0;
    });
    
    const summaryList = Object.values(summary);
    
    res.status(200).json({
      success: true,
      data: {
        summary: summaryList,
        totalAmount,
        totalShares,
        totalBookings: bookings.length
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET QURBANI COMPARISON SUMMARY
 */
exports.getComparisonSummary = async (req, res) => {
  try {
    const bookings = await db.qurbani_booking.find().lean();
    
    const dayBreakdown = {};
    const yearBreakdown = {};
    
    bookings.forEach(b => {
      const day = b.qurbani_date || "";
      if (!dayBreakdown[day]) {
        dayBreakdown[day] = { day, shares: 0, amount: 0, bookings: 0 };
      }
      dayBreakdown[day].shares += b.total_shares || 0;
      dayBreakdown[day].amount += b.total_amount || 0;
      dayBreakdown[day].bookings += 1;
      
      if (b.booking_date) {
        const year = new Date(b.booking_date).getFullYear();
        if (!yearBreakdown[year]) {
          yearBreakdown[year] = { year, shares: 0, amount: 0, bookings: 0 };
        }
        yearBreakdown[year].shares += b.total_shares || 0;
        yearBreakdown[year].amount += b.total_amount || 0;
        yearBreakdown[year].bookings += 1;
      }
    });
    
    res.status(200).json({
      success: true,
      data: {
        days: Object.values(dayBreakdown),
        years: Object.values(yearBreakdown)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
