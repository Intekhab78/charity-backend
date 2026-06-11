const db = require("../models");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// ─── Login ──────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const JWT_SECRET = process.env.JWT_SECRET;
    const { email, password } = req.body;

    if (!JWT_SECRET) {
      return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    }
    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    const user = await db.user_master.findOne({ email: email.toLowerCase().trim() }).lean();
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Support both bcrypt-hashed passwords and legacy plain-text passwords
    let isMatch = false;
    const isHashed = user.password && user.password.startsWith("$2");
    if (isHashed) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      // Legacy plain-text comparison — migrate on success
      isMatch = password === user.password;
      if (isMatch) {
        // Migrate to hashed password silently
        const hashed = await bcrypt.hash(password, 10);
        await db.user_master.updateOne({ _id: user._id }, { $set: { password: hashed } });
      }
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    if (user.status === 0) {
      return res.status(403).json({ success: false, message: "Account is disabled. Contact admin." });
    }

    const roleRecord = await db.role_master.findOne({ role_id: user.role_id }).lean();
    const roleName = roleRecord?.role_name || "Vendor";

    const token = jwt.sign(
      { id: user.id, _id: user._id, email: user.email, role: roleName },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        _id: user._id,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
        email: user.email,
        role: roleName,
        profile_image: user.profile_image || null
      }
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

// ─── Get Current User (auth/me) ───────────────────────────────────────────
exports.getMe = async (req, res) => {
  try {
    const user = await db.user_master.findOne(
      { $or: [{ id: req.user.id }, { _id: req.user._id }] },
      "id firstname lastname email mobile profile_image role_id created_at"
    ).lean();

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    const roleRecord = await db.role_master.findOne({ role_id: user.role_id }).lean();

    res.status(200).json({
      success: true,
      data: {
        id: user.id,
        name: `${user.firstname || ""} ${user.lastname || ""}`.trim(),
        email: user.email,
        mobile: user.mobile || "",
        profile_image: user.profile_image || null,
        role: roleRecord?.role_name || "Vendor",
        joined: user.created_at
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Change Password ──────────────────────────────────────────────────────
exports.changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "Both current and new password are required." });
    }
    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters." });
    }

    const user = await db.user_master.findOne({
      $or: [{ id: req.user.id }, { _id: req.user._id }]
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    // Verify current password
    const isHashed = user.password && user.password.startsWith("$2");
    const isMatch = isHashed
      ? await bcrypt.compare(current_password, user.password)
      : current_password === user.password;

    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = await bcrypt.hash(new_password, 10);
    await user.save();

    res.status(200).json({ success: true, message: "Password changed successfully." });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ─── Upload Avatar ────────────────────────────────────────────────────────
exports.uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided." });
    }

    const user = await db.user_master.findOne({
      $or: [{ id: req.user.id }, { _id: req.user._id }]
    });

    if (!user) return res.status(404).json({ success: false, message: "User not found." });

    user.profile_image = req.file.filename;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profile_image: req.file.filename
    });
  } catch (error) {
    console.error("Upload Avatar Error:", error);
    res.status(500).json({ success: false, message: "Server error while uploading photo." });
  }
};