const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const rateLimit = require("express-rate-limit");
const itemController = require("../controllers/item.controller");
const charityController = require("../controllers/charity.controller");
const companyController = require("../controllers/company.controller");
const authController = require("../controllers/auth.controller");
const userController = require("../controllers/user.controller");
const customerController = require("../controllers/customer.controller");
const qurbaniController = require("../controllers/qurbani.controller");
const qurbanidateController = require("../controllers/qurbanidate.controller");
const departmentController = require("../controllers/department.controller");
const reviewController = require("../controllers/review.controller");
const db = require("../models");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Rate limiter — max 10 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again in 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname.replace(/\s+/g, '-'));
  },
});

// File filter — only allow images, max 5MB
const fileFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPEG, PNG, WebP, GIF) are allowed.'), false);
  }
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
// Admin Auth Middleware
const JWT_SECRET = process.env.JWT_SECRET;

const authRequired = (req, res, next) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

const adminOnly = (req, res, next) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.role?.toLowerCase().includes('admin')) {
      return res.status(403).json({ success: false, message: 'Admin access required.' });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// Auth
router.post("/auth/login", loginLimiter, authController.login);
router.get("/auth/me", authRequired, authController.getMe);
router.post("/auth/change-password", authRequired, authController.changePassword);
router.post("/auth/upload-avatar", authRequired, upload.single('avatar'), authController.uploadAvatar);

// Setup
router.get("/setup", async (req, res) => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;
    if (!adminEmail || !adminPassword) {
      return res.status(400).json({ success: false, message: "ADMIN_EMAIL and ADMIN_PASSWORD are required for setup." });
    }

    const getNextNumericId = async (model, field) => {
      const lastRecord = await model.findOne().sort({ [field]: -1 }).lean();
      return Number(lastRecord?.[field] || 0) + 1;
    };

    const adminRole = await db.role_master.findOneAndUpdate(
      { role_name: "Admin" },
      {
        $setOnInsert: {
          role_id: await getNextNumericId(db.role_master, "role_id"),
          role_name: "Admin",
          role_description: "System administrator"
        }
      },
      { new: true, upsert: true }
    );

    await db.role_master.findOneAndUpdate(
      { role_name: "Vendor" },
      {
        $setOnInsert: {
          role_id: await getNextNumericId(db.role_master, "role_id"),
          role_name: "Vendor",
          role_description: "Vendor user"
        }
      },
      { new: true, upsert: true }
    );

    const existingAdmin = await db.user_master.findOne({ email: adminEmail.toLowerCase() });
    if (!existingAdmin) {
      await db.user_master.create({
        id: await getNextNumericId(db.user_master, "id"),
        firstname: process.env.ADMIN_FIRST_NAME || "System",
        lastname: process.env.ADMIN_LAST_NAME || "Admin",
        email: adminEmail,
        password: adminPassword,
        role_id: adminRole.role_id,
        status: 1
      });
    } else {
      existingAdmin.role_id = adminRole.role_id;
      existingAdmin.status = 1;
      await existingAdmin.save();
    }

    res.json({
      success: true,
      message: "Setup complete",
      createdAdmin: !existingAdmin
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// Items (View: Public, Create/Update/Delete: Admin Only)
router.get("/charity-items", itemController.getCharityItemList);
router.post("/charity-items", adminOnly, upload.single("item_image"), itemController.createItem);
router.put("/charity-items/:id", adminOnly, upload.single("item_image"), itemController.updateItem);
router.delete("/charity-items/:id", adminOnly, itemController.deleteItem);

// Charity Data
router.get("/charity-data", charityController.list);

// Reviews
router.get("/reviews", reviewController.list);
router.post("/reviews", authRequired, reviewController.create);
router.delete("/reviews/:id", adminOnly, reviewController.remove);

// User/Vendor Management (FULL CRUD)
router.get("/users/vendors", userController.listVendors);
router.post("/users/vendors", adminOnly, upload.single("profile_image"), userController.createVendor);
router.put("/users/vendors/:id", adminOnly, upload.single("profile_image"), userController.updateVendor);
router.delete("/users/vendors/:id", adminOnly, userController.deleteVendor);

// Customer Management
router.get("/customers", customerController.listCustomers);
router.post("/customers", adminOnly, upload.single("profile_image"), customerController.createCustomer);
router.put("/customers/:id", adminOnly, upload.single("profile_image"), customerController.updateCustomer);
router.delete("/customers/:id", adminOnly, customerController.deleteCustomer);

// Qurbani Booking Management
router.get("/bookings", authRequired, qurbaniController.listBookings);
router.get("/bookings/years", authRequired, qurbaniController.getAvailableYears);
router.get("/bookings/collection-summary", authRequired, qurbaniController.getCollectionSummary);
router.get("/bookings/comparison-summary", authRequired, qurbaniController.getComparisonSummary);
router.get("/bookings/search", authRequired, qurbaniController.searchBookingByRegNo);
router.post("/bookings", authRequired, qurbaniController.createBooking);
router.put("/bookings/:id", authRequired, qurbaniController.updateBooking);
router.delete("/bookings/:id", adminOnly, qurbaniController.deleteBooking);
router.post("/bookings/:id/approve", adminOnly, qurbaniController.approveBooking);
router.post("/bookings/:id/reject", adminOnly, qurbaniController.rejectBooking);
router.post("/bookings/bulk-approve", adminOnly, qurbaniController.bulkApproveBookings);
router.post("/qurbani-shares/mark-done", authRequired, qurbaniController.markSharesQurbaniDone);
router.get("/share-codes", authRequired, qurbaniController.listShareCodes);
router.get("/departments", authRequired, qurbaniController.listDepartments);
router.get("/company", qurbaniController.getCompany);
router.put("/company", adminOnly, qurbaniController.updateCompany);

// Qurbani Date Master CRUD routes (Create/Update/Delete gated by adminOnly)
router.get("/qurbani-dates", qurbanidateController.list);
router.post("/qurbani-dates", adminOnly, qurbanidateController.create);
router.put("/qurbani-dates/:id", adminOnly, qurbanidateController.update);
router.delete("/qurbani-dates/:id", adminOnly, qurbanidateController.delete);

// Department Master CRUD routes (Create/Update/Delete gated by adminOnly)
router.get("/departments-master", departmentController.list);
router.post("/departments-master", adminOnly, upload.single("dept_image"), departmentController.create);
router.put("/departments-master/:id", adminOnly, upload.single("dept_image"), departmentController.update);
router.delete("/departments-master/:id", adminOnly, departmentController.delete);

// Creation Master
router.use("/creation", require("./creation.routes"));

router.get("/migrate-qurbani", qurbaniController.migrateWebsiteOrders);

// Ported ERP & Ecommerce Routes
router.use("/", require("./ported.routes"));

module.exports = router;
