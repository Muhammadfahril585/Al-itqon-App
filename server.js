require("dotenv").config();
const express = require("express");
const session = require("express-session");
const MongoStore = require("connect-mongo").default;
const path = require("path");


const app = express();
app.set("trust proxy", 1);
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

/* ===============================
   BASIC MIDDLEWARE
================================ */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* ===============================
   SESSION CONFIG
================================ */
if (!process.env.MONGO_URI) throw new Error("MONGO_URI belum diset");
if (!process.env.SESSION_SECRET) throw new Error("SESSION_SECRET belum diset");

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
      ttl: 60 * 60 * 24 * 7,
    }),
    cookie: {
      httpOnly: true,
      secure: true,       // Render = HTTPS
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24 * 7,
    },
  })
);

/* ===============================
   AUTH MIDDLEWARE
================================ */

// untuk HALAMAN (redirect)
function requireRole(role) {
  return (req, res, next) => {
    if (!req.session?.role) return res.redirect("/");
    if (req.session.role !== role) return res.status(403).send("Akses ditolak");
    next();
  };
}

// untuk API (JSON, NO redirect)
function requireRoleAPI(role) {
  return (req, res, next) => {
    if (!req.session?.role) {
      return res.status(401).json({ error: "Unauthorized" });
    }
    if (req.session.role !== role) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
}

/* ===============================
   API ROUTES (JSON ONLY)
================================ */
const raportRoutes = require("./routes/raport");
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});
const raportRoutes = require("./routes/kamar");
app.use("/api", (req, res, next) => {
  res.setHeader("Content-Type", "application/json");
  next();
});
app.use("/api", raportRoutes);
app.use("/api", kamarRoutes);
app.use('/assets', express.static('assets'));
/* ===============================
   STATIC FILES & VIEWS
================================ */
app.use(express.static(path.join(__dirname, "public")));

/* ===============================
   AUTH & VIEW ROUTES
================================ */

// LOGIN PAGE
app.get("/", (req, res) => {
  if (req.session.role === "admin") return res.redirect("/admin");
  if (req.session.role === "pembina") return res.redirect("/pembina");
  if (req.session.role === "tamu") return res.redirect("/tamu");
  res.sendFile(path.join(__dirname, "views", "login.html"));
});

// LOGIN PROCESS
app.post("/login", (req, res) => {
  const { role, id } = req.body;
  const ADMIN_ID = process.env.ADMIN_ID;
  const PEMBINA_ID = process.env.PEMBINA_ID;

  let valid = false;
  if (role === "tamu") valid = true;
  if (role === "admin" && id === ADMIN_ID) valid = true;
  if (role === "pembina" && id === PEMBINA_ID) valid = true;

  if (!valid) return res.status(401).send("Akses ditolak");

  req.session.regenerate(err => {
    if (err) return res.status(500).send("Session error");
    req.session.role = role;
    req.session.save(() => res.redirect(`/${role}`));
  });
});

// HALAMAN
app.get("/admin", requireRole("admin"), (req, res) =>
  res.sendFile(path.join(__dirname, "views", "admin.html"))
);
app.get("/pembina", requireRole("pembina"), (req, res) =>
  res.sendFile(path.join(__dirname, "views", "pembina.html"))
);
app.get("/tamu", requireRole("tamu"), (req, res) =>
  res.sendFile(path.join(__dirname, "views", "tamu.html"))
);
app.get("/raport", requireRole("tamu"), (req, res) =>
  res.sendFile(path.join(__dirname, "views", "raport.html"))
);
app.get('/kamar', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'kamar-list.html'));
});
app.get('/kamar/:nama', (req, res) => {
  res.sendFile(path.join(__dirname, 'views', 'kamar-detail.html'));
});

// LOGOUT
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("alitqon.sid");
    res.redirect("/");
  });
});

// HEALTH CHECK
app.get("/ping", (req, res) => {
  const diff = Date.now() - startTime;
  res.json({
    status: "OK",
    uptime_ms: diff,
    role: req.session?.role || null,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
