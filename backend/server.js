// server.js
const express  = require("express");
const mongoose = require("mongoose");
const cors     = require("cors");
const http     = require("http");
require("dotenv").config();
require("./cron/reminderJob");

const app = express();
app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");
const therapistRoutes = require("./routes/therapist");
const adminRoutes = require("./routes/admin");
const userRoutes = require("./routes/user");
const searchRoutes = require("./routes/search");
const slotRoutes = require("./routes/slot");
const appointmentRoutes = require("./routes/appointment");
const paymentRoutes = require('./routes/payment');
const progressRoutes = require('./routes/progress');
const ratingRoutes = require('./routes/rating'); // New rating routes

app.use('/api/progress', progressRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/therapists", therapistRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/users", userRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/slot", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use('/uploads', express.static('uploads'));
app.use('/api/payment', paymentRoutes);
app.use('/api/ratings', ratingRoutes); // Add rating routes



mongoose
  .connect(process.env.MONGODB_URI)           // seçeneklere gerek yok
  .then(() => console.log("✅ MongoDB bağlı"))
  .catch(err => console.error("Mongo hata:", err));

/* ----------  HTTP + SOCKET.IO  ---------- */
const server = http.createServer(app);
require("./socket").initSocket(server);       // aynı server nesnesi

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀  API & Socket.IO running → http://localhost:${PORT}`);
});
