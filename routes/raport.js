const express = require("express");
const { getSantriById } = require("../services/masterSantri");
const { getTahfidzRaport } = require("../services/raportTahfidz");

const router = express.Router();

// middleware API auth
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

router.get(
  "/tahfidz/:id",
  requireRoleAPI("tamu"),
  async (req, res) => {
    try {
      const santri = await getSantriById(req.params.id);
      if (!santri) {
        return res.status(404).json({ error: "ID santri tidak ditemukan" });
      }

      const raport = await getTahfidzRaport(
        santri.spreadsheetId,
        santri.sheetName
      );

      return res.json({
        santri,
        raport,
      });

    } catch (err) {
      console.error("Raport error:", err);
      return res.status(500).json({ error: "Gagal mengambil raport" });
    }
  }
);

module.exports = router;
