// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
require("dotenv").config();
require("./cron/reminderJob");

const app = express();
const server = http.createServer(app);

// ---------- MIDDLEWARE ----------
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads")); // Static dosyalar için

// ---------- ROUTES ----------
app.use("/api/auth",         require("./routes/auth"));
app.use("/api/therapists",   require("./routes/therapist"));
app.use("/api/admin",        require("./routes/admin"));
app.use("/api/users",        require("./routes/user"));
app.use("/api/search",       require("./routes/search"));
app.use("/api/slot",         require("./routes/slot"));
app.use("/api/appointments", require("./routes/appointment"));
app.use("/api/payment",      require("./routes/payment"));
app.use("/api/progress",     require("./routes/progress"));
app.use("/api/ratings",      require("./routes/rating"));
app.use("/api/chat",         require("./routes/chat")); // chat route varsa

// ---------- MONGODB ----------
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ MongoDB bağlantısı başarılı"))
  .catch((err) => console.error("❌ MongoDB bağlantı hatası:", err));

// ---------- SOCKET.IO ----------
require("./socket").initSocket(server); // Socket init burada yapılır

// ---------- SERVER LISTEN ----------
const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`🚀 Server ve Socket.IO çalışıyor: http://localhost:${PORT}`);
});
