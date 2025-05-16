const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();
require('dotenv').config();
require('./cron/reminderJob');

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
app.use('/uploads', express.static('uploads'));

mongoose
  .connect(
    "mongodb+srv://ozguryavuz:dQL31cl06tdmdSbQ@database.cepqb1h.mongodb.net/?retryWrites=true&w=majority&appName=Database",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Bağlantısı Başarılı"))
  .catch((err) => console.log("MongoDB Bağlantı Hatası:", err));


const PORT = process.env.PORT || 5001;
app.listen(PORT, () => console.log(`🚀 Server ${PORT} portunda çalışıyor...`));