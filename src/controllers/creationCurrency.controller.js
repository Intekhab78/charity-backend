const db = require("../models");
const { getNextId, findByNumericId } = require("./creationMaster.helpers");

exports.list = async (req, res) => {
  try {
    const currencies = await db.currency_master.find().sort({ id: -1 }).lean();
    res.json({ success: true, data: currencies });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const nextId = await getNextId(db.currency_master);
    const currency = await db.currency_master.create({
      id: nextId,
      currency_name: req.body.currency_name,
      currency_code: req.body.currency_code,
      symbol: req.body.symbol || "",
      rate_inr: Number(req.body.rate_inr) || 1,
      status: Number(req.body.status ?? 1)
    });
    res.status(201).json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const currency = await findByNumericId(db.currency_master, req.params.id);
    if (!currency) return res.status(404).json({ success: false, message: "Currency not found" });
    currency.set({
      currency_name: req.body.currency_name,
      currency_code: req.body.currency_code,
      symbol: req.body.symbol || "",
      rate_inr: Number(req.body.rate_inr) || 1,
      status: Number(req.body.status ?? 1)
    });
    await currency.save();
    res.json({ success: true, data: currency });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.currency_master.deleteOne({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
