let jadwalSholat = null;
let lastLat = -5.2011; // Default Gowa
let lastLon = 119.4938;
let currentHijriMonthOffset = 0; // 0 = bulan saat ini

// --- 1. WAHDAH HIJRI ENGINE (SINKRON MARKAZ SUNNAH) ---
const WahdahHijri = {
    MONTH_NAMES: ["Muharram", "Safar", "Rabiul Awal", "Rabiul Akhir", "Jumadil Awal", "Jumadil Akhir", "Rajab", "Syaaban", "Ramadan", "Syawal", "Dzulqaidah", "Dzulhijjah"],
    REFERENCE_DATES: [{ gregorian: new Date(2025, 8, 24), hijri: { day: 2, month: 4, year: 1447 } }],
    MONTH_LENGTHS_1447: [29, 30, 29, 30, 30, 30, 29, 30, 29, 30, 29, 30],

    getMonthLength(year, month) {
        if (year === 1447) return this.MONTH_LENGTHS_1447[month - 1];
        return (month % 2 === 1) ? 30 : 29;
    },

    getHijriDate(date) {
        let e = date.getTime();
        let a = this.REFERENCE_DATES[0];
        let r = Math.floor((e - a.gregorian.getTime()) / 864e5);
        let h = a.hijri.day, s = a.hijri.month, n = a.hijri.year;

        if (r > 0) {
            for (let t = 0; t < r; t++) {
                h++;
                if (h > this.getMonthLength(n, s)) { h = 1; s++; if (s > 12) { s = 1; n++; } }
            }
        } else if (r < 0) {
            for (let t = 0; t > r; t--) {
                h--;
                if (h < 1) { s--; if (s < 1) { s = 12; n--; } h = this.getMonthLength(n, s); }
            }
        }
        return { day: h, month: s, monthName: this.MONTH_NAMES[s - 1], year: n };
    }
};

// --- 2. FUNGSI DISPLAY & HELPER ---
function getHijriDate(date) {
    const h = WahdahHijri.getHijriDate(date);
    return `${h.day} ${h.monthName} ${h.year} H`;
}

function formatShortTime(date) {
    if (!date) return "--:--";
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
}

// --- 3. LOKASI & DASHBOARD ---
async function initLocation() {
    jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
    displayJadwal();

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(async (position) => {
            lastLat = position.coords.latitude;
            lastLon = position.coords.longitude;
            jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
            displayJadwal();
            try {
                const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lastLat}&lon=${lastLon}`);
                const data = await res.json();
                const addr = data.address;
                const locName = addr.village || addr.suburb || addr.city || "Gowa";
                document.getElementById('user-location').innerText = locName;
                if(document.getElementById('bulk-location-name')) document.getElementById('bulk-location-name').innerText = locName;
            } catch (e) { console.error("Gagal reverse geocode"); }
        });
    }
}

function displayJadwal() {
    if (!jadwalSholat) return;
    ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'].forEach(key => {
        const el = document.querySelector(`#sholat-${key} .time`);
        if (el) el.innerText = formatShortTime(jadwalSholat[key]);
    });
}

// --- 4. CLOCK & REALTIME ---
function updateClock() {
    const now = new Date();
    document.getElementById('live-clock').innerText = now.toLocaleTimeString('id-ID');
    document.getElementById('current-date').innerText = now.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    document.getElementById('hijri-date').innerText = getHijriDate(now);
    
    if (!jadwalSholat) return;
    const prayerEntries = [
        { name: 'Subuh', time: jadwalSholat.fajr, key: 'fajr' },
        { name: 'Dzuhur', time: jadwalSholat.dhuhr, key: 'dhuhr' },
        { name: 'Ashar', time: jadwalSholat.asr, key: 'asr' },
        { name: 'Maghrib', time: jadwalSholat.maghrib, key: 'maghrib' },
        { name: 'Isya', time: jadwalSholat.isha, key: 'isha' }
    ];

    let nextFound = false;
    prayerEntries.forEach(p => {
        const el = document.getElementById(`sholat-${p.key}`);
        if(el) el.classList.remove('active');
        if (!nextFound && now < p.time) {
            updateNextInfo(p.name, p.time, now);
            nextFound = true;
        }
    });
}

function updateNextInfo(name, targetTime, now) {
    const diffMs = targetTime - now;
    const h = Math.floor(diffMs / 3600000);
    const m = Math.floor((diffMs % 3600000) / 60000);
    document.getElementById('next-prayer-info').innerHTML = `± ${h} jam ${m} menit lagi ke <b>${name}</b>`;
}

// --- 5. TAB & NAVIGASI BULANAN ---
function switchTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => t.style.display = 'none');
    document.querySelectorAll('.nav').forEach(n => n.classList.remove('active'));
    document.getElementById(`tab-${tabName}`).style.display = 'block';
    document.getElementById(`nav-${tabName}`).classList.add('active');
    if (tabName === 'jadwal') {
        currentHijriMonthOffset = 0; 
        renderMonthlyJadwal();
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
    
    // Hitung Target Bulan berdasarkan Offset
    let targetMonth = currentH.month + currentHijriMonthOffset;
    let targetYear = currentH.year;
    while (targetMonth > 12) { targetMonth -= 12; targetYear++; }
    while (targetMonth < 1) { targetMonth += 12; targetYear--; }

    // Cari Tanggal 1 Masehi untuk bulan target
    let startDate = new Date(today);
    startDate.setDate(today.getDate() - (currentH.day - 1)); // Ke tgl 1 bulan ini dulu
    
    // Geser startDate sampai menemukan tgl 1 bulan target
    for (let i = 0; i < 400; i++) {
        let checkH = WahdahHijri.getHijriDate(startDate);
        if (checkH.month === targetMonth && checkH.year === targetYear && checkH.day === 1) break;
        (currentHijriMonthOffset >= 0) ? startDate.setDate(startDate.getDate() + 1) : startDate.setDate(startDate.getDate() - 1);
    }

    const targetMonthName = WahdahHijri.MONTH_NAMES[targetMonth - 1];
    document.getElementById('bulk-month-title').innerText = `Jadwal Shalat ${targetMonthName} ${targetYear} H`;
    document.getElementById('hijri-month-name').innerText = `${targetMonthName} ${targetYear}H`;

    const totalDays = WahdahHijri.getMonthLength(targetYear, targetMonth);
    for (let i = 0; i < totalDays; i++) {
        let loopDate = new Date(startDate);
        loopDate.setDate(startDate.getDate() + i);
        const times = window.calculatePrayerTimes(lastLat, lastLon, loopDate);
        const isToday = loopDate.toDateString() === today.toDateString();

        tbody.innerHTML += `
            <tr class="${isToday ? 'today' : ''}">
                <td><b>${i + 1} ${targetMonthName}</b><br><small>${loopDate.getDate()}/${loopDate.getMonth()+1}</small></td>
                <td>${formatShortTime(times.fajr)}</td>
                <td>${formatShortTime(times.duha)}</td>
                <td>${formatShortTime(times.dhuhr)}</td>
                <td>${formatShortTime(times.asr)}</td>
                <td>${formatShortTime(times.maghrib)}</td>
                <td>${formatShortTime(times.isha)}</td>
            </tr>`;
    }
}

// --- 6. INIT ---
initLocation();
if(document.getElementById('bulk-coords')) {
    document.getElementById('bulk-coords').innerText = `${lastLat.toFixed(4)}°, ${lastLon.toFixed(4)}°`;
}
setInterval(updateClock, 1000);
updateClock();
