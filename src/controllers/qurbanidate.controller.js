const db = require("../models");
const crypto = require("crypto");

const getNextId = async (model) => {
  const lastRecord = await model.findOne().sort({ id: -1 });
  return lastRecord && typeof lastRecord.id === "number" ? lastRecord.id + 1 : 1001;
};

// List all Qurbani Dates
exports.list = async (req, res) => {
  try {
    const list = await db.qurbani_date_master.find().sort({ qurbani_date: 1 }).lean();
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Create a new Qurbani Date (Admin-only)
exports.create = async (req, res) => {
  try {
    const { qurbani_date, actual_date, description, status } = req.body;
    if (!qurbani_date) {
      return res.status(400).json({ success: false, message: "Qurbani Date is required" });
    }

    const nextId = await getNextId(db.qurbani_date_master);
    const newRecord = await db.qurbani_date_master.create({
      id: nextId,
      uuid: crypto.randomUUID(),
      qurbani_date,
      actual_date: actual_date || "",
      description: description || "",
      status: status !== undefined ? Number(status) : 1
    });

    res.status(201).json({ success: true, message: "Qurbani Date created successfully", data: newRecord });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update Qurbani Date (Admin-only)
exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const { qurbani_date, actual_date, description, status } = req.body;

    const record = await db.qurbani_date_master.findOne({ id: Number(id) });
    if (!record) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }

    if (qurbani_date) record.qurbani_date = qurbani_date;
    if (actual_date !== undefined) record.actual_date = actual_date;
    if (description !== undefined) record.description = description;
    if (status !== undefined) record.status = Number(status);

    await record.save();
    res.status(200).json({ success: true, message: "Qurbani Date updated successfully", data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete Qurbani Date (Admin-only)
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.qurbani_date_master.deleteOne({ id: Number(id) });
    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: "Record not found" });
    }
    res.status(200).json({ success: true, message: "Qurbani Date deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
