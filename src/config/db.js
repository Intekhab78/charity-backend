const mongoose = require("mongoose");
require("dotenv").config();

const connectDB = async () => {
  try {
    const connString = process.env.MONGODB_URI;
    if (!connString) {
      throw new Error("MONGODB_URI is not configured.");
    }
    console.log("Connecting to MongoDB...");
    
    await mongoose.connect(connString, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("SUCCESS: MongoDB database connected successfully.");
  } catch (error) {
    console.error("FATAL Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
