// ===============================
// GLOBAL STATE
// ===============================
let jadwalSholat = null;
let lastLat = -5.2011;     // Default Gowa
let lastLon = 119.4938;
let currentHijriMonthOffset = 0; // 0 = bulan hijriah saat ini


// ===============================
// 1. WAHDAH HIJRI ENGINE
// ===============================
const WahdahHijri = {
  MONTH_NAMES: [
    "Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir",
    "Jumadil Awal", "Jumadil Akhir", "Rajab", "Syaaban",
    "Ramadan", "Syawal", "Dzulqaidah", "Dzulhijjah"
  ],

  REFERENCE_DATES: [{
    gregorian: new Date(2025, 8, 24),
    hijri: { day: 2, month: 4, year: 1447 }
  }],

  MONTH_LENGTHS_1447: [29, 30, 29, 30, 30, 30, 29, 30, 29, 30, 29, 30],

  getMonthLength(year, month) {
    if (year === 1447) return this.MONTH_LENGTHS_1447[month - 1];
    return (month % 2 === 1) ? 30 : 29;
  },

  getHijriDate(date) {
    let diffDays = Math.floor(
      (date.getTime() - this.REFERENCE_DATES[0].gregorian.getTime()) / 86400000
    );

    let { day, month, year } = this.REFERENCE_DATES[0].hijri;

    if (diffDays > 0) {
      for (let i = 0; i < diffDays; i++) {
        day++;
        if (day > this.getMonthLength(year, month)) {
          day = 1;
          month++;
          if (month > 12) {
            month = 1;
            year++;
          }
        }
      }
    } else if (diffDays < 0) {
      for (let i = 0; i > diffDays; i--) {
        day--;
        if (day < 1) {
          month--;
          if (month < 1) {
            month = 12;
            year--;
          }
          day = this.getMonthLength(year, month);
        }
      }
    }

    return {
      day,
      month,
      monthName: this.MONTH_NAMES[month - 1],
      year
    };
  }
};


// ===============================
// 2. HELPER
// ===============================
function getHijriDate(date) {
  const h = WahdahHijri.getHijriDate(date);
  return `${h.day} ${h.monthName} ${h.year} H`;
}

function formatShortTime(date) {
  if (!date) return "--:--";
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit'
  });
}


// ===============================
// 3. LOKASI & DASHBOARD
// ===============================
async function initLocation() {
  // 1. Set tampilan awal dengan koordinat default (Gowa)
  updateCoordDisplay(lastLat, lastLon); 
  jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
  displayJadwal();

  if (!navigator.geolocation) return;

  navigator.geolocation.getCurrentPosition(async (pos) => {
    // 2. Update variabel global dengan koordinat asli user
    lastLat = pos.coords.latitude;
    lastLon = pos.coords.longitude;

    // 3. Update tampilan teks koordinat secara real-time
    updateCoordDisplay(lastLat, lastLon);

    // 4. Hitung ulang jadwal berdasarkan lokasi baru
    jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
    displayJadwal();
    const tabJadwal = document.getElementById('tab-jadwal');
    if (tabJadwal && tabJadwal.style.display !== 'none') {
        renderMonthlyJadwal();
    }
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lastLat}&lon=${lastLon}`
      );
      const data = await res.json();
      const addr = data.address || {};
      const locName = addr.village || addr.suburb || addr.city || "Gowa";

      const locEl = document.getElementById('user-location');
      if (locEl) locEl.innerText = locName;

      const bulkLoc = document.getElementById('bulk-location-name');
      if (bulkLoc) bulkLoc.innerText = locName;

    } catch (e) {
      console.error("Gagal reverse geocode");
    }
  });
}

// Fungsi pembantu agar kode lebih rapi dan tidak berulang
function updateCoordDisplay(lat, lon) {
  const coordEl = document.getElementById('bulk-coords');
  if (coordEl) {
    coordEl.innerText = `Asia/Makassar • ${lat.toFixed(4)}°, ${lon.toFixed(4)}°`;
  }
}


function displayJadwal() {
  if (!jadwalSholat) return;

  ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(key => {
    const el = document.querySelector(`#sholat-${key} .time`);
    if (el) el.innerText = formatShortTime(jadwalSholat[key]);
  });
}


// ===============================
// 4. CLOCK & REALTIME
// ===============================
function updateClock() {
  const now = new Date();

  const clockEl = document.getElementById('live-clock');
  if (clockEl) clockEl.innerText = now.toLocaleTimeString('id-ID');

  const dateEl = document.getElementById('current-date');
  if (dateEl) {
    dateEl.innerText = now.toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  const hijriEl = document.getElementById('hijri-date');
  if (hijriEl) hijriEl.innerText = getHijriDate(now);

  if (!jadwalSholat) return;

  const prayers = [
    { name: 'Subuh', time: jadwalSholat.fajr },
    { name: 'Dzuhur', time: jadwalSholat.dhuhr },
    { name: 'Ashar', time: jadwalSholat.asr },
    { name: 'Maghrib', time: jadwalSholat.maghrib },
    { name: 'Isya', time: jadwalSholat.isha }
  ];

  for (let p of prayers) {
    if (now < p.time) {
      const diff = p.time - now;
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);

      const nextEl = document.getElementById('next-prayer-info');
      if (nextEl) {
        nextEl.innerHTML = `± ${h} jam ${m} menit lagi ke <b>${p.name}</b>`;
      }
      break;
    }
  }
}


// ===============================
// 5. TAB & JADWAL BULANAN
// ===============================
function switchTab(tabName) {
  // Sembunyikan semua konten tab
  document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
  // Hapus class active di semua nav
  document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'));

  const tab = document.getElementById(`tab-${tabName}`);
  const nav = document.getElementById(`nav-${tabName}`);

  if (tab) tab.style.display = 'block';
  if (nav) nav.classList.add('active');

  // Logika khusus per tab
  if (tabName === 'jadwal') {
    currentHijriMonthOffset = 0;
    renderMonthlyJadwal();
  } 
  else if (tabName === 'quran') {
    // Pastikan list surah muncul kembali jika sebelumnya sedang buka detail ayat
    document.getElementById("surah-list").style.display = "block";
    document.getElementById("ayat-container").style.display = "none";
    loadSurahList();
  }
}

function changeMonth(delta) {
  currentHijriMonthOffset += delta;
  renderMonthlyJadwal();
}

function renderMonthlyJadwal() {
  const tbody = document.getElementById('bulk-jadwal-body');
  if (!tbody) return;

  tbody.innerHTML = '';

  const today = new Date();
  const currentH = WahdahHijri.getHijriDate(today);

  let targetMonth = currentH.month + currentHijriMonthOffset;
  let targetYear = currentH.year;

  while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
  while (targetMonth < 1) { targetMonth += 12; targetYear--; }

  let startDate = new Date(today);
  startDate.setDate(today.getDate() - (currentH.day - 1));

  for (let i = 0; i < 400; i++) {
    const h = WahdahHijri.getHijriDate(startDate);
    if (h.month === targetMonth && h.year === targetYear && h.day === 1) break;
    startDate.setDate(startDate.getDate() + (currentHijriMonthOffset >= 0 ? 1 : -1));
  }

  const targetMonthName = WahdahHijri.MONTH_NAMES[targetMonth - 1];

  // ====== INI YANG DIPERBAIKI ======
  const titleEl = document.getElementById('judul-bulanan');
  if (titleEl) {
    titleEl.innerText = `Jadwal Shalat ${targetMonthName} ${targetYear} H`;
  }

  const hijriMonthEl = document.getElementById('hijri-month-name');
  if (hijriMonthEl) {
    hijriMonthEl.innerText = `${targetMonthName} ${targetYear} H`;
  }
  // ================================

  const totalDays = WahdahHijri.getMonthLength(targetYear, targetMonth);

  for (let i = 0; i < totalDays; i++) {
    const loopDate = new Date(startDate);
    loopDate.setDate(startDate.getDate() + i);

    const times = window.calculatePrayerTimes(lastLat, lastLon, loopDate);
    const isToday = loopDate.toDateString() === today.toDateString();

    tbody.innerHTML += `
      <tr class="${isToday ? 'today' : ''}">
        <td><b>${i + 1} ${targetMonthName}</b><br>
        <small>${loopDate.getDate()}/${loopDate.getMonth() + 1}</small></td>
        <td>${formatShortTime(times.fajr)}</td>
        <td>${formatShortTime(times.duha)}</td>
        <td>${formatShortTime(times.dhuhr)}</td>
        <td>${formatShortTime(times.asr)}</td>
        <td>${formatShortTime(times.maghrib)}</td>
        <td>${formatShortTime(times.isha)}</td>
      </tr>
    `;
  }
}
function buildExportContent() {
  const exportBox = document.getElementById("export-container-full");
  if (!exportBox) return;

  exportBox.innerHTML = "";

  // ===== Judul =====
  const title = document.createElement("h2");
  title.innerText = document.getElementById("judul-bulanan")?.innerText || "Jadwal Shalat";
  title.style.textAlign = "center";
  title.style.marginBottom = "12px";
  title.style.color = "#228B22";

  // ===== Lokasi =====
  const loc = document.createElement("div");
  loc.style.textAlign = "center";
  loc.style.fontSize = "12px";
  loc.style.color = "#555";
  loc.style.marginBottom = "12px";
  loc.innerText =
    `${document.getElementById("bulk-location-name")?.innerText || ""} · ` +
    `${document.getElementById("bulk-coords")?.innerText || ""}`;

  // ===== Clone Tabel =====
  const table = document.querySelector(".jadwal-table");
  if (!table) return;

  const clonedTable = table.cloneNode(true);
  clonedTable.style.width = "max-content";
  clonedTable.style.minWidth = "900px";
  clonedTable.style.borderCollapse = "collapse";

  exportBox.appendChild(title);
  exportBox.appendChild(loc);
  exportBox.appendChild(clonedTable);
}
async function exportImage() {
  buildExportContent();

  const target = document.getElementById("export-container-full");
  if (!target) return;

  await new Promise(r => setTimeout(r, 150));

  const canvas = await html2canvas(target, {
    scale: 2.5,
    backgroundColor: "#ffffff",
    width: target.scrollWidth,
    height: target.scrollHeight,
    scrollX: 0,
    scrollY: 0
  });

  const link = document.createElement("a");
  link.download = "jadwal-shalat.png";
  link.href = canvas.toDataURL("image/png", 0.95);
  link.click();
}
async function exportPDF() {
  buildExportContent();

  const target = document.getElementById("export-container-full");
  if (!target) return;

  await new Promise(r => setTimeout(r, 150));

  const canvas = await html2canvas(target, {
    scale: 1.8,
    backgroundColor: "#ffffff",
    width: target.scrollWidth,
    height: target.scrollHeight
  });

  const imgData = canvas.toDataURL("image/jpeg", 0.82);

  const { jsPDF } = window.jspdf;
  const pdf = new jsPDF("p", "mm", "a4");

  const pageWidth = 210;
  const imgWidth = 190;
  const imgHeight = canvas.height * imgWidth / canvas.width;

  let y = 15;
  if (imgHeight > 260) {
    pdf.addImage(imgData, "JPEG", 10, y, imgWidth, 260);
  } else {
    pdf.addImage(imgData, "JPEG", 10, y, imgWidth, imgHeight);
  }

  pdf.save("jadwal-shalat.pdf");
}
// ===============================
// 6. INIT
// ===============================
initLocation();
setInterval(updateClock, 1000);
updateClock();
// ================================
// AL-QUR'AN EQURAN.ID (NO API KEY)
// ================================

async function loadSurahList() {
  const list = document.getElementById("surah-list");
  
  // Jangan ambil data lagi jika sudah ada isinya (hemat kuota & cepat)
  if (list.innerHTML !== "") return; 

  list.innerHTML = "<p style='padding:20px; text-align:center;'>Memuat Al-Qur'an...</p>";

  try {
    const res = await fetch("https://equran.id/api/v2/surat");
    const json = await res.json();
    const data = json.data;

    list.innerHTML = ""; // Bersihkan pesan loading

    data.forEach(surah => {
      list.innerHTML += `
        <div class="surah-item" onclick="openSurah(${surah.nomor})" style="cursor:pointer; border-bottom:1px solid #eee; padding:10px; display:flex; justify-content:space-between; align-items:center;">
          <div class="surah-left" style="display:flex; gap:15px; align-items:center;">
            <div class="surah-number" style="font-weight:bold; color:#228B22;">${surah.nomor}</div>
            <div>
              <div class="surah-name" style="font-weight:bold;">${surah.namaLatin}</div>
              <div class="surah-meta" style="font-size:0.8em; color:#666;">
                ${surah.tempatTurun} • ${surah.jumlahAyat} Ayat
              </div>
            </div>
          </div>
          <div class="surah-arab" style="font-size:1.4em; font-family: 'Amiri', serif;">${surah.nama}</div>
        </div>
      `;
    });
  } catch (err) {
    list.innerHTML = "<p style='padding:20px; color:red;'>Gagal memuat data. Periksa koneksi internet Anda.</p>";
  }
}

async function openSurah(nomor) {
  document.getElementById("surah-list").style.display = "none";
  document.getElementById("ayat-container").style.display = "block";

  const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
  const json = await res.json();
  const surah = json.data;

  document.getElementById("judul-surah").innerText =
    `${surah.namaLatin} • ${surah.arti}`;

  const ayatList = document.getElementById("ayat-list");
  ayatList.innerHTML = "";

  surah.ayat.forEach(a => {
    ayatList.innerHTML += `
      <div class="ayat-card">
        <div class="ayat-arab">${a.teksArab}</div>
        <div class="ayat-terjemah">${a.teksIndonesia}</div>

        <div class="ayat-actions">
          <button onclick="playAudio('${a.audio['01']}')">▶️ Audio</button>
          <button onclick="copyAyat('${a.teksArab}')">📋 Salin</button>
        </div>
      </div>
    `;
  });
}

function backToSurah() {
  document.getElementById("ayat-container").style.display = "none";
  document.getElementById("surah-list").style.display = "block";
}

function playAudio(url) {
  const audio = new Audio(url);
  audio.play();
}

function copyAyat(text) {
  navigator.clipboard.writeText(text)
    .then(() => alert("Ayat berhasil disalin"));
}
