const db = require("../models");
const crypto = require("crypto");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID, DEFAULT_CUSTOMER_USER_ID } = require("../config/defaults");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

/**
 * LIST BOOKINGS
 */
exports.listBookings = async (req, res) => {
  try {
    const bookings = await db.booking_master.find().sort({ created_at: -1 }).lean();
    for (let booking of bookings) {
      booking.user = await db.user_master.findOne({ id: booking.user_id }, "firstname lastname email").lean();
    }
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * CREATE BOOKING
 */
exports.createBooking = async (req, res) => {
  try {
    const { 
      vehicle_type, 
      vehicle_number, 
      from_location, 
      to_location, 
      departure_time, 
      arrival_time, 
      class_type, 
      price, 
      user_id 
    } = req.body;
    
    const nextId = await getNextId(db.booking_master);
    const bookingData = {
      id: nextId,
      uuid: crypto.randomUUID(),
      user_id: user_id || DEFAULT_CUSTOMER_USER_ID,
      vehicle_type,
      vehicle_number,
      from_location,
      to_location,
      departure_time,
      arrival_time,
      class_type,
      price: Number(price) || 0,
      status: "Confirmed",
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID
    };

    const newBooking = await db.booking_master.create(bookingData);
    res.status(201).json({ success: true, message: "Booking created successfully", data: newBooking });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * UPDATE BOOKING
 */
exports.updateBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.booking_master.findOne({
      $or: [
        { id: isNaN(id) ? null : Number(id) },
        { _id: id }
      ].filter(x => x.id !== null || x._id !== null)
    });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    booking.set(req.body);
    await booking.save();
    res.status(200).json({ success: true, message: "Booking updated successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE BOOKING
 */
exports.deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await db.booking_master.findOne({
      $or: [
        { id: isNaN(id) ? null : Number(id) },
        { _id: id }
      ].filter(x => x.id !== null || x._id !== null)
    });
    if (!booking) return res.status(404).json({ success: false, message: "Booking not found" });

    await booking.deleteOne();
    res.status(200).json({ success: true, message: "Booking deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
