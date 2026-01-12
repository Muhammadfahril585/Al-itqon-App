const express = require("express");
require('dotenv').config();
const path = require("path");
const startTime = Date.now(); 

const app = express();

// ⚠️ PENTING: Pterodactyl WAJIB pakai PORT dari environment
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

  const ADMIN_ID = process.env.ADMIN_ID || "admin123";
  const PEMBINA_ID = process.env.PEMBINA_ID || "pembina123";

  if (role === "tamu") {
    return res.redirect("/tamu");
}
  if (role === "admin" && id === ADMIN_ID) {
    return res.redirect("/admin");
  }

  if (role === "pembina" && id === PEMBINA_ID) {
    return res.redirect("/pembina");
  }

  return res.status(401).send("ID tidak valid");
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
  console.log("Server jalan di port", PORT);
});
