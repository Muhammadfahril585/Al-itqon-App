const express = require("express");
require('dotenv').config();
const path = require("path");
const startTime = Date.now();

const app = express();

// Render secara otomatis mengatur environment variable PORT.
// Jika tidak ada (lokal), dia akan menggunakan 3000.
const PORT = process.env.PORT || 3000;

// ===== middleware =====
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===== routes =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

app.post("/login", (req, res) => {
  const { role, id } = req.body;

  // Mengambil ID langsung dari Environment Variables Render
  const ADMIN_ID = process.env.ADMIN_ID;
  const PEMBINA_ID = process.env.PEMBINA_ID;

  if (role === "tamu") {
    return res.redirect("/tamu");
  }

  if (role === "admin" && id === ADMIN_ID) {
    return res.redirect("/admin");
  }

  if (role === "pembina" && id === PEMBINA_ID) {
    return res.redirect("/pembina");
  }

  // Pesan error jika ID salah atau belum di-set di Render
  return res.status(401).send("Akses Ditolak: ID tidak valid atau sistem belum dikonfigurasi.");
});

app.get("/tamu", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "tamu.html"));
});

app.get("/admin", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/pembina", (req, res) => {
  res.sendFile(path.join(__dirname, "views", "pembina.html"));
});

app.get('/raport', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'raport.html'));
});

// ===== health check (debug) =====
app.get("/ping", (req, res) => {
  const diff = Date.now() - startTime;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  res.json({
    status: "Al-Itqon App Sedang Aktif",
    uptime: `${days} hari, ${hours} jam, ${minutes} menit`,
    timestamp: new Date().toLocaleString("id-ID", { timeZone: "Asia/Makassar" })
  });
});

// ===== start server =====
app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`);
});
