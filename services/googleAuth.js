const { google } = require("googleapis");

function getSheetsClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: "./secrets/credentials.json",
    scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"],
  });

  return google.sheets({ version: "v4", auth });
}

module.exports = { getSheetsClient };
