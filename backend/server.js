const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const giftRoutes = require("./routes/giftBoxes");
const authRoutes = require("./routes/auth"); // Eklenen auth route
const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(
    "mongodb+srv://egeeyiler:7XXjhlduX39cZzHv@database.cepqb1h.mongodb.net/?retryWrites=true&w=majority&appName=Database",
    {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }
  )
  .then(() => console.log("✅ MongoDB Bağlantısı Başarılı"))
  .catch((err) => console.log("MongoDB Bağlantı Hatası:", err));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ${PORT} portunda çalışıyor...`));
