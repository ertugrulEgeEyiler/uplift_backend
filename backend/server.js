const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const authRoutes = require("./routes/auth");

app.use("/api/auth", authRoutes);



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


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server ${PORT} portunda çalışıyor...`));
