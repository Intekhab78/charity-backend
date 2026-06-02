const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    }

    const user = await db.user_master.findOne({ email }).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid credentials" });
    }

    // Populate role
    const roleRecord = await db.role_master.findOne({ role_id: user.role_id }).lean();
    const roleName = roleRecord?.role_name || "Vendor";

    const token = jwt.sign(
      { id: user.id, email: user.email, role: roleName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
        email: user.email,
        role: roleName
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};
