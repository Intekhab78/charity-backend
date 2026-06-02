const express = require("express");
const jwt = require("jsonwebtoken");
const animalController = require("../controllers/creationAnimal.controller");
const batchController = require("../controllers/creationBatch.controller");
const locationController = require("../controllers/creationLocation.controller");
const currencyController = require("../controllers/creationCurrency.controller");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

const adminOnly = (req, res, next) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) return res.status(401).json({ success: false, message: "No token provided." });
    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded.role?.toLowerCase().includes("admin")) {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: "Invalid or expired token." });
  }
};

router.get("/animals", animalController.list);
router.post("/animals", adminOnly, animalController.create);
router.put("/animals/:id", adminOnly, animalController.update);
router.delete("/animals/:id", adminOnly, animalController.remove);

router.get("/batches", batchController.list);
router.post("/batches", adminOnly, batchController.create);
router.put("/batches/:id", adminOnly, batchController.update);
router.delete("/batches/:id", adminOnly, batchController.remove);

router.get("/locations", locationController.list);
router.post("/locations", adminOnly, locationController.create);
router.put("/locations/:id", adminOnly, locationController.update);
router.delete("/locations/:id", adminOnly, locationController.remove);

router.get("/currencies", currencyController.list);
router.post("/currencies", adminOnly, currencyController.create);
router.put("/currencies/:id", adminOnly, currencyController.update);
router.delete("/currencies/:id", adminOnly, currencyController.remove);

module.exports = router;
