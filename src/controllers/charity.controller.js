const db = require("../models");
const CharityData = db.charity_website_data;

/**
 * List all charity website data
 */
exports.list = async (req, res) => {
  try {
    const records = await CharityData.find().sort({ created_at: -1 });

    return res.status(200).json({
      success: true,
      message: "Charity data list fetched successfully",
      data: records
    });
  } catch (error) {
    console.error("Error in CharityData.list:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch charity data",
      error: error.message
    });
  }
};

/**
 * Get details by ID
 */
exports.details = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await CharityData.findOne({
      $or: [
        { id: Number(id) },
        { _id: mongoose.Types.ObjectId.isValid(id) ? id : null }
      ].filter(x => x.id !== null || x._id !== null)
    });

    // Simple robust query
    const query = isNaN(id) ? { _id: id } : { id: Number(id) };
    const doc = await CharityData.findOne(query);

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Record not found"
      });
    }

    return res.status(200).json({
      success: true,
      data: doc
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Something went wrong",
      error: error.message
    });
  }
};
