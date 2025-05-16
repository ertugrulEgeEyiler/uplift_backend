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

/* ----------  ROUTES  ---------- */
app.use("/api/auth",        require("./routes/auth"));
app.use("/api/therapists",  require("./routes/therapist"));
app.use("/api/admin",       require("./routes/admin"));
app.use("/api/users",       require("./routes/user"));
app.use("/api/search",      require("./routes/search"));
app.use("/api/slot",        require("./routes/slot"));
app.use("/api/appointments",require("./routes/appointment"));
app.use("/api/payment",     require("./routes/payment"));
app.use("/api/progress",    require("./routes/progress"));
app.use("/api/ratings",     require("./routes/rating"));
app.use("/api/chat",        require("./routes/chat"));
app.use("/uploads", express.static("uploads"));

/* ----------  DB  ---------- */
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
