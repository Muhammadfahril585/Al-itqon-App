require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo");
const path = require("path");
const app = express();

const startTime = Date.now();

// ===============================
// CONFIG
// ===============================
const PORT = process.env.PORT || 3000;

// ===============================
// MIDDLEWARE DASAR
// ===============================
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// ===============================
// SESSION (MONGO DB)
// ===============================
if (!process.env.MONGO_URI) {
  throw new Error("❌ MONGO_URI belum diset di environment!");
}

if (!process.env.SESSION_SECRET) {
  throw new Error("❌ SESSION_SECRET belum diset di environment!");
}
app.use(
  session({
    name: "alitqon.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,

    store: MongoStore.create({
      mongoUrl: process.env.MONGO_URI,
      dbName: process.env.MONGO_DB_NAME || "alitqon_app",
      collectionName: "web_sessions",

      // ⚠️ TTL HARUS NUMBER (detik)
      ttl: 60 * 60 * 24 * 7
    }),

    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7
    }
  })
);
// ===============================
// MIDDLEWARE AUTH
// ===============================
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session || !req.session.role) {
      return res.redirect("/");
    }

    if (req.session.role !== role) {
      return res.status(403).send("Akses ditolak");
    }

    next();
  };
}

// ===============================
// ROUTES
// ===============================

// LOGIN PAGE
app.get("/", (req, res) => {
  if (req.session.role === "admin") return res.redirect("/admin");
  if (req.session.role === "pembina") return res.redirect("/pembina");
  if (req.session.role === "tamu") return res.redirect("/tamu");

  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// PROSES LOGIN
app.post("/login", (req, res) => {
  const { role, id } = req.body;

  const ADMIN_ID = process.env.ADMIN_ID;
  const PEMBINA_ID = process.env.PEMBINA_ID;

  if (role === "tamu") {
    req.session.role = "tamu";
    return res.redirect("/tamu");
  }

  if (role === "admin" && id === ADMIN_ID) {
    req.session.role = "admin";
    return res.redirect("/admin");
  }

  if (role === "pembina" && id === PEMBINA_ID) {
    req.session.role = "pembina";
    return res.redirect("/pembina");
  }

  return res.status(401).send("Akses Ditolak: ID tidak valid");
});

// HALAMAN TERPROTEKSI
app.get("/admin", requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "admin.html"));
});

app.get("/pembina", requireRole("pembina"), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "pembina.html"));
});

app.get("/tamu", requireRole("tamu"), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "tamu.html"));
});

app.get("/raport", requireRole("admin"), (req, res) => {
  res.sendFile(path.join(__dirname, "views", "raport.html"));
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("alitqon.sid");
    res.redirect("/");
  });
});

// ===============================
// HEALTH CHECK
// ===============================
app.get("/ping", (req, res) => {
  const diff = Date.now() - startTime;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);

  res.json({
    status: "Al-Itqon App Aktif",
    uptime: `${days} hari, ${hours} jam, ${minutes} menit`,
    role: req.session?.role || null,
    timestamp: new Date().toLocaleString("id-ID", {
      timeZone: "Asia/Makassar"
    })
  });
});

// ===============================
// START SERVER
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di port ${PORT}`);
});
