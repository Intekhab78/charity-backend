const db = require("../models");
const { getNextId, findByNumericId } = require("./creationMaster.helpers");

exports.list = async (req, res) => {
  try {
    const batches = await db.batch.find().sort({ id: -1 }).lean();
    res.json({ success: true, data: batches });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const nextId = await getNextId(db.batch);
    const batch = await db.batch.create({
      id: nextId,
      item_id: String(req.body.item_id || ""),
      animal_code: req.body.animal_code || "",
      animal_name: req.body.animal_name || "",
      batch_number: req.body.batch_number || `B${nextId}`,
      qty: Number(req.body.qty) || 0,
      current_in_stock: Number(req.body.qty) || 0,
      location_id: Number(req.body.location_id) || 0,
      location_name: req.body.location_name || "",
      location_code: req.body.location_code || "",
      currency_id_inr: Number(req.body.currency_id_inr) || 0,
      currency_id_online: Number(req.body.currency_id_online) || 0,
      currency_code_online: req.body.currency_code_online || "",
      rate_inr: Number(req.body.rate_inr) || 0,
      rate_inronline: Number(req.body.rate_inronline) || 0,
      rate_usd: Number(req.body.rate_usd) || 0
    });
    res.status(201).json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const batch = await findByNumericId(db.batch, req.params.id);
    if (!batch) return res.status(404).json({ success: false, message: "Batch not found" });
    batch.set(req.body);
    batch.qty = Number(req.body.qty) || 0;
    batch.current_in_stock = Number(req.body.qty) || 0;
    batch.location_id = Number(req.body.location_id) || 0;
    batch.rate_inr = Number(req.body.rate_inr) || 0;
    batch.rate_inronline = Number(req.body.rate_inronline) || 0;
    batch.rate_usd = Number(req.body.rate_usd) || 0;
    await batch.save();
    res.json({ success: true, data: batch });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.batch.deleteOne({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
