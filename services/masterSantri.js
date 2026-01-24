const { getSheetsClient } = require("./googleAuth");

const MASTER_SPREADSHEET_ID = "1bte5MObHIU_TIhw-4XLaqZMuYR8HZLM7yvEUSkwlMjs";
const RANGE = "Sheet1!A2:F";

async function getSantriById(idSantri) {
  const sheets = getSheetsClient();

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: MASTER_SPREADSHEET_ID,
    range: RANGE,
  });

  const rows = res.data.values || [];

  const santri = rows.find(r => r[0] === idSantri);

  if (!santri) return null;

  return {
    id: santri[0],
    nama: santri[1],
    nis: santri[2],
    spreadsheetId: santri[3],
    sheetName: santri[4],
    status: santri[5],
  };
}

module.exports = { getSantriById };
