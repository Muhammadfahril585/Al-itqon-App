const express = require("express");
const router = express.Router();
const {
  getAllKamar,
  getSantriByKamar
} = require("../services/kamarService");

// API list kamar
router.get("/kamar", async (req, res) => {
  try {
    const data = await getAllKamar();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data kamar" });
  }
});

// API detail kamar
router.get("/kamar/:nama", async (req, res) => {
  try {
    const nama = decodeURIComponent(req.params.nama);
    const sheetName = `Kamar ${nama}`;

    const santri = await getSantriByKamar(sheetName);

    res.json({
      kamar: nama,
      jumlah: santri.length,
      santri
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil data kamar" });
  }
});

// halaman
router.get("/kamar", (req, res) => {
  res.sendFile("kamar-list.html", { root: "views" });
});

router.get("/kamar/:nama", (req, res) => {
  res.sendFile("kamar-detail.html", { root: "views" });
});

module.exports = router;
