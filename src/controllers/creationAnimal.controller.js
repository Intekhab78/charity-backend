const db = require("../models");
const { getNextId, findByNumericId } = require("./creationMaster.helpers");
const { DEFAULT_COMPANY_ID, DEFAULT_LOCATION_ID } = require("../config/defaults");

exports.list = async (req, res) => {
  try {
    const animals = await db.creation_animal.find({ status: { $ne: 0 } }).sort({ id: -1 }).lean();
    res.json({ success: true, data: animals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const nextId = await getNextId(db.creation_animal);
    const animal = await db.creation_animal.create({
      id: nextId,
      item_id: String(nextId),
      item_code: req.body.item_code || `A${nextId}`,
      item_name: req.body.item_name,
      item_description: req.body.item_description || "",
      itemprice: Number(req.body.itemprice) || 0,
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID,
      departname: req.body.departname || "",
      status: Number(req.body.status ?? 1)
    });
    res.status(201).json({ success: true, data: animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const animal = await findByNumericId(db.creation_animal, req.params.id);
    if (!animal) return res.status(404).json({ success: false, message: "Animal not found" });
    animal.set({
      item_code: req.body.item_code,
      item_name: req.body.item_name,
      item_description: req.body.item_description || "",
      itemprice: Number(req.body.itemprice) || 0,
      company_id: Number(req.body.company_id) || DEFAULT_COMPANY_ID,
      location_id: Number(req.body.location_id) || DEFAULT_LOCATION_ID,
      departname: req.body.departname || "",
      status: Number(req.body.status ?? 1)
    });
    await animal.save();
    res.json({ success: true, data: animal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.creation_animal.deleteOne({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
