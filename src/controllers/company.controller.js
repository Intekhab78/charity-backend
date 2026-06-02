const db = require("../models");

exports.getCompanies = async (req, res) => {
  try {
    const companies = await db.company.find({ status: 1 }, "id compdesc compcode");
    res.status(200).json({
      success: true,
      data: companies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
