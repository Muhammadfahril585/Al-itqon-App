window.calculatePrayerTimes = function (lat, lon, date = new Date()) {
  const location = {
    latitude: lat,
    longitude: lon,
    timezone: "Asia/Makassar"
  };

  const config = {
    fajr_angle: 17.5,
    isha_angle: 18,
    mazhab: "shafi",
    ihtiyat_fajr: 0,
    ihtiyat_dhuhr: 4,
    ihtiyat_asr: 0,
    ihtiyat_maghrib: 2,
    ihtiyat_isha: 0
  };

  return WahdahCalculatorRaw.calculatePrayerTimes(location, date, config);
};
