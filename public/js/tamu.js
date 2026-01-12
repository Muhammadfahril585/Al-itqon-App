let jadwalSholat = null;
let lastLat = -5.2011; // Default Gowa
let lastLon = 119.4938;

// --- 1. Fungsi Hijriah (Akurat untuk Rajab 1447) ---
function getHijriDate(date) {
    const months = ["Muharram", "Safar", "Rabi'ul Awwal", "Rabi'ul Akhir", "Jumadil Ula", "Jumadil Akhira", "Rajab", "Sya'ban", "Ramadhan", "Syawwal", "Dzulqa'dah", "Dzulhijjah"];
    const adjustment = 1; 

    let d = date.getDate();
    let m = date.getMonth() + 1;
    let y = date.getFullYear();

    if (m < 3) { y -= 1; m += 12; }
    let a = Math.floor(y / 100);
    let b = 2 - a + Math.floor(a / 4);
    let jd = Math.floor(365.25 * (y + 4716)) + Math.floor(30.6001 * (m + 1)) + d + b - 1524;
    
    let jd_hijri = jd - 1948440 + 10631 + adjustment; 
    let n = Math.floor((jd_hijri - 1) / 10631);
    jd_hijri = jd_hijri - 10631 * n + 354;
    
    let j = (Math.floor((10985 - jd_hijri) / 5316)) * (Math.floor((50 * jd_hijri) / 17719)) + (Math.floor(jd_hijri / 5670)) * (Math.floor((43 * jd_hijri) / 15238));
    jd_hijri = jd_hijri - (Math.floor((30 - j) / 15)) * (Math.floor((17719 * j) / 50)) - (Math.floor(j / 16)) * (Math.floor((15238 * j) / 43)) + 29;
    
    let month = Math.floor((24 * jd_hijri) / 709);
    let day = jd_hijri - Math.floor((709 * month) / 24);
    let year = 30 * n + j - 30;

    return `${day} ${months[month - 1]} ${year} H`;
}

// --- 2. Fungsi Deteksi Lokasi ---
async function initLocation() {
    // Default dulu (biar UI langsung tampil)
    jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
    displayJadwal();
    document.getElementById('user-location').innerText =
        "Pattallassang, Gowa (Default)";
    document.getElementById('bulk-location-name').innerText =
        "Pattallassang, Gowa";

    // LANGSUNG minta GPS saat halaman dibuka
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            lastLat = position.coords.latitude;
            lastLon = position.coords.longitude;

            jadwalSholat =
                window.calculatePrayerTimes(lastLat, lastLon);
            displayJadwal();

            try {
                const res = await fetch(
                    `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lastLat}&lon=${lastLon}`
                );
                const data = await res.json();
                const addr = data.address || {};

                const daerah =
                    addr.village ||
                    addr.suburb ||
                    addr.city_district ||
                    addr.town ||
                    "Lokasi Anda";

                const regensi =
                    addr.regency ||
                    addr.city ||
                    addr.state ||
                    "Indonesia";

                document.getElementById('user-location').innerText =
                    `${daerah}, ${regensi}`;
                document.getElementById('bulk-location-name').innerText =
                    `${daerah}, ${regensi}`;

            } catch {
                document.getElementById('user-location').innerText =
                    "Lokasi Terdeteksi";
            }
        },
        () => {
            console.log("Lokasi ditolak, pakai default Gowa");
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// --- 3. Tampilkan Jadwal di Dashboard ---
function displayJadwal() {
    if (!jadwalSholat) return;
    const keys = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];
    keys.forEach(key => {
        const el = document.querySelector(`#sholat-${key} .time`);
        if (el) {
            el.innerText = formatShortTime(jadwalSholat[key]);
        }
    });
}

// --- 4. Loop Jam & Tanggal ---
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('id-ID', { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit',
    timeZone: 'Asia/Makassar' // Tambahkan ini
});
    const optMasehi = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('current-date').innerText = now.toLocaleDateString('id-ID', optMasehi);
    document.getElementById('hijri-date').innerText = getHijriDate(now);

    if (!jadwalSholat) return;

    const prayerEntries = [
        { name: 'Subuh', key: 'fajr', time: jadwalSholat.fajr },
        { name: 'Dzuhur', key: 'dhuhr', time: jadwalSholat.dhuhr },
        { name: 'Ashar', key: 'asr', time: jadwalSholat.asr },
        { name: 'Maghrib', key: 'maghrib', time: jadwalSholat.maghrib },
        { name: 'Isya', key: 'isha', time: jadwalSholat.isha }
    ];

    let foundActive = false;
    prayerEntries.forEach((current, i) => {
        const next = prayerEntries[i + 1];
        const el = document.getElementById(`sholat-${current.key}`);
        if (el) el.classList.remove('active');

        if (!foundActive) {
            if (now < current.time) {
                updateNextInfo(current.name, current.time, now);
                foundActive = true;
            } else if (next && now >= current.time && now < next.time) {
                if (el) el.classList.add('active');
                updateNextInfo(next.name, next.time, now);
                foundActive = true;
            } else if (!next && now >= current.time) {
                if (el) el.classList.add('active');
                document.getElementById('next-prayer-info').innerText = "Waktu Isya telah masuk";
                foundActive = true;
            }
        }
    });
}

function updateNextInfo(name, targetTime, now) {
    const diffMs = targetTime - now;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    document.getElementById('next-prayer-info').innerHTML = `± ${h} jam ${m} menit lagi menuju waktu <b>${name}</b>`;
}

// --- 5. Logika Navigasi Tab ---
function switchTab(tabName) {
    // Sembunyikan semua tab
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    // Hapus status active dari semua nav
    document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'));
    
    // Tampilkan tab yang dipilih
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    // Set nav yang diklik jadi active
    document.getElementById(`nav-${tabName}`).classList.add('active');

    if (tabName === 'jadwal') {
        renderMonthlyJadwal();
    }
}

// --- 6. Logika Jadwal Bulanan ---
function renderMonthlyJadwal() {
    const tbody = document.getElementById('bulk-jadwal-body');
    tbody.innerHTML = '<tr><td colspan="7">Memuat jadwal...</td></tr>';
    
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    
    document.getElementById('bulk-coords').innerText = `${lastLat.toFixed(4)}°, ${lastLon.toFixed(4)}°`;

    let html = '';
    for (let d = 1; d <= 31; d++) {
        const date = new Date(year, month, d);
        if (date.getMonth() !== month) break;

        const times = window.calculatePrayerTimes(lastLat, lastLon, date);
        const hijriStr = getHijriDate(date);
        const tglHijri = hijriStr.split(' ')[0];
        const blnHijri = hijriStr.split(' ')[1];
        const isToday = date.toDateString() === now.toDateString();

        html += `
            <tr class="${isToday ? 'today' : ''}">
                <td><b>${tglHijri} ${blnHijri}</b><br><small>${d}/${month + 1}</small></td>
                <td>${formatShortTime(times.fajr)}</td>
                <td>${formatShortTime(times.duha)}</td>
                <td>${formatShortTime(times.dhuhr)}</td>
                <td>${formatShortTime(times.asr)}</td>
                <td>${formatShortTime(times.maghrib)}</td>
                <td>${formatShortTime(times.isha)}</td>
            </tr>`;
    }
    tbody.innerHTML = html;
}

function formatShortTime(date) {
    if (!date) return "--:--";
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// Inisialisasi awal
document.addEventListener('DOMContentLoaded', () => {
    // 1. Jalankan jam dulu agar UI tidak statis
    updateClock();
    setInterval(updateClock, 1000);

    // 2. Baru jalankan lokasi
    initLocation();
});
