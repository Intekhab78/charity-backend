require("dotenv").config();

module.exports = {
  development: {
    username: process.env.DB_USER || "root",
    password: process.env.DB_PASS || "root",
    database: process.env.DB_NAME || "islamic_book",
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    dialect: "mysql",
    logging: false,
  },
};
