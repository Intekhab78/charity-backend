const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const fs = require("fs");
const db = require("./models");
const routes = require("./routes");

const connectDB = require("./config/db");

dotenv.config();

const app = express();
const port = process.env.PORT || 5620;

const envAllowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const allowedOrigins = [...new Set(envAllowedOrigins)];
const allowAllOrigins = process.env.CORS_ALLOW_ALL === "true";

const path = require("path");
const uploadsDir = path.join(__dirname, "../uploads");

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowAllOrigins || allowedOrigins.length === 0) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error(`CORS policy: origin ${origin} not allowed`));
  },
  credentials: true,
}));
app.use(express.json());
app.get("/uploads/:filename", (req, res) => {
  const requestedFile = path.basename(req.params.filename || "");
  const requestedPath = path.join(uploadsDir, requestedFile);

  if (requestedFile && fs.existsSync(requestedPath)) {
    return res.sendFile(requestedPath);
  }

  const placeholderSvg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500">
      <rect width="800" height="500" fill="#f3f4f6"/>
      <rect x="40" y="40" width="720" height="420" rx="24" fill="#e5e7eb"/>
      <text x="400" y="240" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" fill="#6b7280">
        Image not found
      </text>
      <text x="400" y="285" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#9ca3af">
        ${requestedFile || "Missing file"}
      </text>
    </svg>
  `.trim();

  res.status(200).type("image/svg+xml").send(placeholderSvg);
});
app.use("/uploads", express.static(uploadsDir));


// Base welcome route for status/hosting checks
app.get("/", (req, res) => {
  res.status(200).json({
    status: "active",
    message: "Charity ERP Backend API is fully operational and running!",
    timestamp: new Date()
  });
});

// API routes
app.use("/api", routes);

// Connect to MongoDB & Start Server
connectDB().then(() => {
  app.listen(port, () => {
    console.log(`🚀 New Backend running at http://localhost:${port}`);
  });
}).catch(err => {
  console.error("❌ Failed to launch new backend due to connection error:", err);
});
// Nodemon refresh trigger
