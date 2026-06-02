const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/ported.controller");

// Auth Middleware helper for customers (if needed on routes)
const jwt = require("jsonwebtoken");
const JWT_SECRET = process.env.JWT_SECRET;
const customerAuth = (req, res, next) => {
  try {
    if (!JWT_SECRET) return res.status(500).json({ success: false, message: "JWT secret is not configured." });
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ success: false, message: 'No token provided.' });
    const decoded = jwt.verify(token, JWT_SECRET);
    req.customer = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// 1. Item Departments
router.get("/item_department/dropdown-list", ctrl.getDepartmentDropdown);
router.post("/item_department/list", ctrl.getDepartmentList);
router.post("/item_department/list/", ctrl.getDepartmentList);
router.post("/item_department/list/:company_id/:location_id", ctrl.getDepartmentsByCompanyAndLocation);

// 2. Item Location Master & Charity List
router.post("/item_location_master/charity/list/:comp_id", ctrl.getCharityItemList);
router.post("/item_location_master/list", ctrl.getItemLocationList);

// 3. Item List (with paginated search support, acting as globalSearch)
router.post("/item/list", ctrl.getItemList);

// 5. Family Master & Sub Family Master
router.post("/family_master/list", ctrl.getFamilyList);
router.post("/family_master/by_id_list", ctrl.getFamilyByIdList);
router.post("/sub_family_master/list", ctrl.getSubFamilyList);
router.post("/sub_family_master/by_id_list", ctrl.getSubFamilyByIdList);

// 6. Company & Location Listings
router.post("/company/list", ctrl.getCompanyList);
router.post("/location/list", ctrl.getLocationList);

// 7. Shipping Address Management
router.get("/shipping_address/list/:customer_id", ctrl.listAddresses);
router.post("/shipping_address/create", ctrl.createAddress);
router.post("/shipping_address/update/:id", ctrl.updateAddress);
router.delete("/shipping_address/delete/:id", ctrl.deleteAddress);

// 8. Order & E-Commerce Orders
router.post("/order/ecommerce/order-add", ctrl.ecommerceOrderStore);
router.post("/order/ecommerce_orders/by-customer", ctrl.getOrdersByCustomerId);

// 9. Customer Accounts & Profile APIs
router.post("/customer/list", ctrl.listCustomers);
router.post("/customer/update", ctrl.updateCustomer);
router.post("/customer/customer_pass_update", ctrl.updatePassword);
router.post("/customer/customer_login", ctrl.loginEcommerceCustomer);
router.post("/customer/online_cust_reg_login", ctrl.onlineCustRegLogin);

module.exports = router;
