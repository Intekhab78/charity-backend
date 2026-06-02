const db = require("../models");
const { getNextId, findByNumericId } = require("./creationMaster.helpers");

exports.list = async (req, res) => {
  try {
    const locations = await db.location.find().sort({ id: -1 }).lean();
    const firstCurrency = await db.currency_master.findOne({ status: { $ne: 0 } }).sort({ id: 1 }).lean();
    const defaultCurrencyCode = firstCurrency?.currency_code || firstCurrency?.currency_name || process.env.DEFAULT_CURRENCY_CODE || "";

    const filledLocations = await Promise.all(locations.map(async (location) => {
      const locdesclong = location.locdesclong || location.locdesc || location.compdesc || location.locname || "";
      const ccurrency = location.ccurrency || location.cacurrency || defaultCurrencyCode;
      const needsUpdate = locdesclong !== location.locdesclong || ccurrency !== location.ccurrency;

      if (needsUpdate && location.id) {
        await db.location.updateOne(
          { id: location.id },
          { $set: { locdesclong, ccurrency } }
        );
      }

      return { ...location, locdesclong, ccurrency };
    }));

    res.json({ success: true, data: filledLocations });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const nextId = await getNextId(db.location);
    const location = await db.location.create({
      id: nextId,
      loccode: req.body.loccode || `L${nextId}`,
      locname: req.body.locname,
      locdesclong: req.body.locdesclong || "",
      ccurrency: req.body.ccurrency || "",
      cacurrency: req.body.cacurrency || "",
      status: Number(req.body.status ?? 1)
    });
    res.status(201).json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.update = async (req, res) => {
  try {
    const location = await findByNumericId(db.location, req.params.id);
    if (!location) return res.status(404).json({ success: false, message: "Location not found" });
    location.set({
      loccode: req.body.loccode,
      locname: req.body.locname,
      locdesclong: req.body.locdesclong || "",
      ccurrency: req.body.ccurrency || "",
      cacurrency: req.body.cacurrency || "",
      status: Number(req.body.status ?? 1)
    });
    await location.save();
    res.json({ success: true, data: location });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.location.deleteOne({ id: Number(req.params.id) });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
