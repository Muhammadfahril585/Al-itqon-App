const { getSheetsClient } = require("./googleAuth");
const MAP = require("../config/raportMap");

async function getTahfidzRaport(spreadsheetId, sheetName) {
  const sheets = getSheetsClient();
  const ranges = [];
  const s1 = MAP.tahfidz.s1;
  const s2 = MAP.tahfidz.s2;

  [s1, s2].forEach(sem => {
    if (!sem) return; // Pengaman jika salah satu semester undefined

    // 1. Tahfidz Utama
    ranges.push(`${sheetName}!${sem.target}`);
    ranges.push(`${sheetName}!${sem.januari || sem.juli}`);
    ranges.push(`${sheetName}!${sem.februari || sem.agustus}`);
    ranges.push(`${sheetName}!${sem.maret || sem.september}`);
    ranges.push(`${sheetName}!${sem.april || sem.oktober}`);
    ranges.push(`${sheetName}!${sem.mei || sem.november}`);
    ranges.push(`${sheetName}!${sem.total_semester}`);
    ranges.push(`${sheetName}!${sem.total_keseluruhan}`);
    ranges.push(`${sheetName}!${sem.keterangan}`);

    // 2. Hifdzul Quran
    ranges.push(`${sheetName}!${sem.hifdz}`);
    ranges.push(`${sheetName}!${sem.tajwid}`);
    ranges.push(`${sheetName}!${sem.jumlah_hafalan}`);
    ranges.push(`${sheetName}!${sem.juz_diuji}`);
    ranges.push(`${sheetName}!${sem.ket_quran}`);

    // 3. Kepribadian
    if (sem.kepribadian) {
      sem.kepribadian.forEach(item => {
        ranges.push(`${sheetName}!${item.nilai}`);
        ranges.push(`${sheetName}!${item.predikat}`);
        ranges.push(`${sheetName}!${item.deskripsi}`);
      });
    }

    // 4. Catatan & Tanggal
    ranges.push(`${sheetName}!${sem.catatan}`);
    ranges.push(`${sheetName}!${sem.tanggal}`);

    // 5. Pengembangan Diri
    if (sem.pengembangan_diri) {
      sem.pengembangan_diri.forEach(item => {
        ranges.push(`${sheetName}!${item.nilai}`);
      });
    }

    // 6. Tanda tangan
    ranges.push(`${sheetName}!${sem.ttd.orang_tua}`);
    ranges.push(`${sheetName}!${sem.ttd.pimpinan}`);
    ranges.push(`${sheetName}!${sem.ttd.muhafidz}`);
  });

  const res = await sheets.spreadsheets.values.batchGet({ spreadsheetId, ranges });
  return res.data.valueRanges;
}

module.exports = { getTahfidzRaport };












