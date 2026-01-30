const { getSheetsClient } = require("./googleAuth");

const sheets = getSheetsClient();

const SPREADSHEET_ID = "1Z3SmsLH0apL2wyBonBok5elr-NYEaOolSSDZTp83EmI";

async function getAllKamar() {
  const meta = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });

  const result = [];

  for (const s of meta.data.sheets) {
    const sheetName = s.properties.title;

    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:A`,                                                           });

    result.push({
      nama: sheetName.replace(/^Kamar\s+/i, ""),
      sheet: sheetName,
      jumlah: res.data.values ? res.data.values.length : 0,
    });
  }

  return result;
}

async function getSantriByKamar(sheetName) {
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A2:A`,
  });

  return (res.data.values || []).map(r => r[0]);
}

module.exports = {
  getAllKamar,
  getSantriByKamar,
};
