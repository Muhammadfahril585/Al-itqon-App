const express = require("express");
const { getSantriById } = require("../services/masterSantri");
const { getTahfidzRaport } = require("../services/raportTahfidz");

const router = express.Router();

router.get("/tahfidz/:id", async (req, res) => {
  try {
    const santri = await getSantriById(req.params.id);

    if (!santri) {
      return res.status(404).json({ error: "ID santri tidak ditemukan" });
    }

    const raport = await getTahfidzRaport(
      santri.spreadsheetId,
      santri.sheetName
    );

    res.json({
      santri,
      raport,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Gagal mengambil raport" });
  }
});

module.exports = router;
