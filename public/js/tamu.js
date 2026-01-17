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
    console.log("Mencoba memuat Qur'an...");
    document.getElementById("surah-list").style.display = "block";
    document.getElementById("ayat-container").style.display = "none";
    loadSurahList();
  }
  else if (tabName === 'dzikir') {
    window.scrollTo(0, 0);
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
  if (!list) {
    alert("Error: Elemen surah-list tidak ditemukan!");
    return;
  }

  // Jika sudah ada data, jangan ambil lagi
  if (list.children.length > 5) return; 

  list.innerHTML = "<p style='text-align:center; padding:20px;'>Sedang mengambil data Al-Qur'an...</p>";

  try {
    const res = await fetch("https://equran.id/api/v2/surat");
    
    if (!res.ok) throw new Error("Gagal menyambung ke server API");
    
    const json = await res.json();
    const data = json.data;

    if (!data || data.length === 0) {
      alert("Data Al-Qur'an kosong!");
      return;
    }

    list.innerHTML = ""; // Bersihkan loading

    data.forEach(surah => {
      const item = `
        <div class="surah-item" onclick="openSurah(${surah.nomor})" style="cursor:pointer;">
          <div class="surah-left">
            <div class="surah-number">${surah.nomor}</div>
            <div>
              <div class="surah-name">${surah.namaLatin}</div>
              <div class="surah-meta">${surah.tempatTurun} • ${surah.jumlahAyat} Ayat</div>
            </div>
          </div>
          <div class="surah-arab" style="font-family: 'Scheherazade New', serif;">${surah.nama}</div>
        </div>`;
      list.insertAdjacentHTML('beforeend', item);
    });

  } catch (error) {
    alert("Terjadi masalah: " + error.message);
    list.innerHTML = `<p style='text-align:center; color:red; padding:20px;'>
      Gagal memuat Al-Qur'an. <br>Pastikan internet aktif.
    </p>`;
  }
}

async function openSurah(nomor) {
  // 1. Tampilkan indikator loading sederhana
  const ayatList = document.getElementById("ayat-list");
  const ayatContainer = document.getElementById("ayat-container");
  const surahList = document.getElementById("surah-list");

  if (!ayatList || !ayatContainer || !surahList) {
    alert("Elemen HTML untuk ayat tidak ditemukan!");
    return;
  }

  // Sembunyikan list surah, tampilkan container ayat
  surahList.style.display = "none";
  ayatContainer.style.display = "block";
  ayatList.innerHTML = "<p style='text-align:center; padding:20px;'>Memuat ayat...</p>";

  try {
    const res = await fetch(`https://equran.id/api/v2/surat/${nomor}`);
    const json = await res.json();
    const surah = json.data;

    // Set Judul Surah
    document.getElementById("judul-surah").innerText = `${surah.namaLatin} • ${surah.arti}`;

    ayatList.innerHTML = ""; // Bersihkan pesan loading

    // Loop Ayat
    surah.ayat.forEach(a => {
      const item = `
        <div class="ayat-card" style="margin-bottom: 25px; padding: 15px; background: #fff; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <div class="ayat-arab" style="font-size: 28px; text-align: right; direction: rtl; line-height: 2; margin-bottom: 15px; font-family: 'Scheherazade New', serif; color: #333;">
            ${a.teksArab} 
            <span style="font-size: 16px; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border: 1px solid #0f766e; border-radius: 50%; color: #0f766e; margin-right: 10px; font-family: sans-serif;">
              ${a.nomorAyat}
            </span>
          </div>

          <div class="ayat-terjemah" style="font-size: 14px; color: #555; line-height: 1.6; font-style: italic; border-left: 3px solid #0f766e; padding-left: 10px; margin-bottom: 15px;">
            ${a.teksIndonesia}
          </div>

          <div class="ayat-actions" style="display: flex; gap: 10px; justify-content: flex-end;">
            <button onclick="playAudio('${a.audio['05']}')" style="background: #0f766e; color: white; border: none; padding: 8px 15px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              ▶️ Misyari Rasyid
            </button>
            <button onclick="copyAyat(\`${a.teksArab}\`)" style="background: #f1f1f1; color: #333; border: none; padding: 8px 15px; border-radius: 8px; font-size: 12px; display: flex; align-items: center; gap: 5px; cursor: pointer;">
              📋 Salin
            </button>
          </div>
        </div>
      `;
      ayatList.insertAdjacentHTML('beforeend', item);
    });

    // Scroll ke atas otomatis saat surah terbuka
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (error) {
    alert("Gagal memuat ayat: " + error.message);
    backToSurah(); 
  }
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
//Zikir
const daftarUrutan = {
  'pagi': [
    'pagi-1', 'pagi-2', 'pagi-3', 'pagi-4', 'pagi-5',
    'pagi-6', 'pagi-7', 'pagi-8', 'pagi-9', 'pagi-10',
    'pagi-11', 'pagi-12', 'pagi-13', 'pagi-14', 'pagi-15',
    'pagi-16', 'pagi-17', 'pagi-18', 'pagi-19', 'pagi-20',
    'pagi-21', 'pagi-22', 'pagi-23', 'pagi-24'
  ],
  'petang': [
    'petang-1', 'petang-2', 'petang-3', 'petang-4', 'petang-5',
    'petang-6', 'petang-7', 'petang-8', 'petang-9', 'petang-10',
    'petang-11', 'petang-12', 'petang-13', 'petang-14', 'petang-15',
    'petang-16', 'petang-17', 'petang-18', 'petang-19', 'petang-20',
    'petang-21', 'petang-22', 'petang-23', 'petang-24'
  ],
  'sholat': [
    'sholat-1', 'sholat-2', 'sholat-3', 'sholat-4', 'sholat-5',
    'sholat-6', 'sholat-7', 'sholat-8', 'sholat-9', 'sholat-10',
    'sholat-11', 'sholat-12', 'sholat-13', 'sholat-14', 'sholat-15',
    'sholat-16'
  ],
  'Sebab': [
    'Sebab-1', 'Sebab-2', 'Sebab-3', 'Sebab-4', 'Sebab-5',
    'Sebab-6', 'Sebab-7', 'Sebab-8', 'Sebab-9', 'Sebab-10',
    'Sebab-11', 'Sebab-12', 'Sebab-13', 'Sebab-14', 'Sebab-15',
    'Sebab-16', 'Sebab-17', 'Sebab-18', 'Sebab-19', 'Sebab-20',
    'Sebab-21', 'Sebab-22', 'Sebab-23', 'Sebab-24', 'Sebab-25',
    'Sebab-26', 'Sebab-27', 'Sebab-28', 'Sebab-29', 'Sebab-30',
    'Sebab-31', 'Sebab-32'
  ],
  'Walimah': ['Walimah-1', 'Walimah-2'],
  'Setiap': [
    'Setiap-1', 'Setiap-2', 'Setiap-3', 'Setiap-4', 'Setiap-5',
    'Setiap-6', 'Setiap-7'
  ],
  'Ruqyah': [
    'Ruqyah1', 'Ruqyah2', 'Ruqyah3', 'Ruqyah4', 'Ruqyah5',
    'Ruqyah6', 'Ruqyah7', 'Ruqyah8', 'Ruqyah9'
  ],
  'Ramadhan': ['Ramadhan-1', 'Ramadhan-2'],
  'Perjalanan': [
    'Perjalanan-1', 'Perjalanan-2', 'Perjalanan-3', 'Perjalanan-4',
    'Perjalanan-5', 'Perjalanan-6'
  ],
  'Musibah': [
    'Musibah-1', 'Musibah-2', 'Musibah-3', 'Musibah-4', 'Musibah-5',
    'Musibah-6', 'Musibah-7', 'Musibah-8'
  ],
  'Keluarga': [
    'Keluarga-1', 'Keluarga-2', 'Keluarga-3', 'Keluarga-4',
    'Keluarga-5', 'Keluarga-6'
  ],
  'Ilmu': ['Ilmu-1', 'Ilmu-2'],
  'Harian': [
    'Harian-1', 'Harian-2', 'Harian-3', 'Harian-4', 'Harian-5',
    'Harian-6', 'Harian-7', 'Harian-8', 'Harian-9', 'Harian-10',
    'Harian-11', 'Harian-12', 'Harian-13', 'Harian-14', 'Harian-15',
    'Harian-16', 'Harian-17', 'Harian-18', 'Harian-19', 'Harian-20',
    'Harian-21', 'Harian-22'
  ],
  'HajiUmroh': [
    'HajiUmroh-1', 'HajiUmroh-2', 'HajiUmroh-3', 'HajiUmroh-4',
    'HajiUmroh-5', 'HajiUmroh-6', 'HajiUmroh-7', 'HajiUmroh-8',
    'HajiUmroh-9', 'HajiUmroh-10', 'HajiUmroh-11', 'HajiUmroh-12',
    'HajiUmroh-13', 'HajiUmroh-14'
  ],
  'Fitri': ['Fitri-1', 'Fitri-2'],
  'Fenomena': [
    'Fenomena-1', 'Fenomena-2', 'Fenomena-3', 'Fenomena-4',
    'Fenomena-5', 'Fenomena-6', 'Fenomena-7'
  ],
  'DzikirSetelahSholat': [
    'DzikirSetelahSholat1', 'DzikirSetelahSholat2', 'DzikirSetelahSholat3',
    'DzikirSetelahSholat4', 'DzikirSetelahSholat5', 'DzikirSetelahSholat6',
    'DzikirSetelahSholat7', 'DzikirSetelahSholat8', 'DzikirSetelahSholat9',
    'DzikirSetelahSholat10', 'DzikirSetelahSholat11', 'DzikirSetelahSholat12'
  ],
  'Akhlak': [
    'Akhlak-1', 'Akhlak-2', 'Akhlak-3', 'Akhlak-4', 'Akhlak-5',
    'Akhlak-6', 'Akhlak-7', 'Akhlak-8', 'Akhlak-9', 'Akhlak-10'
  ],
  'Kematian': [
    '1Kematian', '2Kematian', '3Kematian', '4Kematian', '5Kematian',
    '6Kematian', '7Kematian', '8Kematian', '9Kematian'
  ]
};

// Variabel bantuan untuk melacak posisi saat ini
let currentCategory = '';
let currentIndex = 0;

async function openDzikirDetail(fileName, category = null) {
  // Jika category dikirim (saat klik menu utama), simpan category-nya
  if (category) {
    currentCategory = category;
    currentIndex = daftarUrutan[category].indexOf(fileName);
  }

  const detailView = document.getElementById('dzikir-detail-view');
  const contentArea = document.getElementById('dzikir-content-area');
  const titleArea = document.getElementById('dzikir-detail-title');

  // Sembunyikan menu-menu
  document.getElementById('dzikir-main-menu').style.display = 'none';
  if(document.getElementById('doa-submenu-view')) {
      document.getElementById('doa-submenu-view').style.display = 'none';
  }

  contentArea.innerHTML = "Memuat bacaan...";
  detailView.style.display = 'block';
  window.scrollTo(0, 0);

  try {
    const response = await fetch(`/doa/${fileName}.html`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const htmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, 'text/html');
    const content = doc.querySelector('.content');

    if (!content) throw new Error('Elemen .content tidak ditemukan');

    const titleEl = content.querySelector('#title');
    titleArea.innerText = titleEl ? titleEl.innerText : 'Dzikir';
    
    // Render Konten + Tombol Navigasi
    contentArea.innerHTML = content.innerHTML;
    renderNavigationButtons(contentArea);

    if (titleEl) {
      const internalTitle = contentArea.querySelector('#title');
      if (internalTitle) internalTitle.style.display = 'none';
    }

  } catch (err) {
    console.error(err);
    contentArea.innerHTML = `<p style="color:red;">Gagal memuat bacaan.</p>`;
  }
}

// FUNGSI BARU: Menampilkan tombol kanan kiri
function renderNavigationButtons(container) {
  if (!currentCategory || !daftarUrutan[currentCategory]) return;

  const list = daftarUrutan[currentCategory];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < list.length - 1;

  const navHtml = `
    <div class="dzikir-nav-container" style="display:flex; justify-content:space-between; margin-top:20px; padding:10px 0; border-top:1px solid #eee;">
      <button onclick="changeDoa(-1)" ${!hasPrev ? 'style="visibility:hidden"' : ''} class="btn-nav">← Sebelumnya</button>
      <span style="font-size:0.8rem; color:#888">${currentIndex + 1} / ${list.length}</span>
      <button onclick="changeDoa(1)" ${!hasNext ? 'style="visibility:hidden"' : ''} class="btn-nav">Berikutnya →</button>
    </div>
  `;
  container.insertAdjacentHTML('beforeend', navHtml);
}

// FUNGSI BARU: Berpindah doa
function changeDoa(direction) {
  currentIndex += direction;
  const nextFile = daftarUrutan[currentCategory][currentIndex];
  openDzikirDetail(nextFile); // Panggil ulang tanpa kirim parameter category agar tetap di kategori yang sama
}

function backFromDetail() {
  document.getElementById('dzikir-detail-view').style.display = 'none';

  const doaSubmenu = document.getElementById('doa-submenu-view');
  const mainMenu = document.getElementById('dzikir-main-menu');

  // Kalau sebelumnya dari submenu
  if (doaSubmenu && doaSubmenu.dataset.active === "true") {
    doaSubmenu.style.display = 'block';
  } else {
    mainMenu.style.display = 'grid';
  }
}
function openDoaSubmenu() {
  document.getElementById('dzikir-main-menu').style.display = 'none';

  const submenu = document.getElementById('doa-submenu-view');
  submenu.style.display = 'block';
  submenu.dataset.active = "true";
}
function backToDzikirMenu() {
  document.getElementById('doa-submenu-view').style.display = 'none';
  document.getElementById('dzikir-main-menu').style.display = 'grid';
}
