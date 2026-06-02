"use strict";

const mongoose = require("mongoose");

const db = {
  mongoose,
  
  // Model mapping to match the original Sequelize structure perfectly
  user_master: require("./user_master"),
  role_master: require("./role_master"),
  item_master: require("./item_master"),
  item_location_master: require("./item_location_master"),
  creation_animal: require("./creation_animal"),
  item_department: require("./item_department"),
  family_master: require("./family_master"),
  sub_family_master: require("./sub_family_master"),
  company: require("./company"),
  location: require("./location"),
  currency_master: require("./currency_master"),
  item_main_price: require("./item_main_price"),
  batch: require("./batch"),
  charity_website_data: require("./charity_website_data"),
  customer_master: require("./customer_master"),
  customer_info: require("./customer_info"),
  customer_login: require("./customer_login"),
  shipping_address: require("./shipping_address"),
  order: require("./order"),
  order_details: require("./order_details"),
  booking_master: require("./booking_master"),
  qurbani_booking: require("./qurbani_booking"),
  qurbani_share: require("./qurbani_share"),
  department_mapping: require("./department_mapping"),
  qurbani_date_master: require("./qurbani_date_master"),
  review: require("./review"),
  
  // Sequelize aliases for maximum compatibility
  Sequelize: {
    Op: {
      like: "like",
      in: "in",
      or: "or",
      ne: "ne"
    }
  }
};

module.exports = db;
