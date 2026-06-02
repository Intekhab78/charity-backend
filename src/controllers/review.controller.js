const db = require("../models");
const { getNextId } = require("./creationMaster.helpers");

exports.list = async (req, res) => {
  try {
    const reviews = await db.review.find({ status: { $ne: 0 } }).sort({ created_at: -1 }).lean();
    res.json({ success: true, data: reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.create = async (req, res) => {
  try {
    const nextId = await getNextId(db.review);
    const review = await db.review.create({
      id: nextId,
      name: req.body.name,
      role: req.body.role || "",
      rating: Number(req.body.rating) || 5,
      comment: req.body.comment,
      status: Number(req.body.status ?? 1)
    });

    res.status(201).json({ success: true, data: review });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await db.review.updateOne({ id: Number(req.params.id) }, { $set: { status: 0 } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
