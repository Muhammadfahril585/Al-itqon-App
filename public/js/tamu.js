// --- 2. Fungsi Deteksi Lokasi (AUTO REQUEST GPS) ---
async function initLocation() {

    // 1️⃣ Langsung set default dulu (agar UI tidak kosong)
    jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
    displayJadwal();
    document.getElementById('user-location').innerText = "Pattallassang, Gowa (Default)";
    document.getElementById('bulk-location-name').innerText = "Pattallassang, Gowa";

    // 2️⃣ LANGSUNG MINTA GPS (tanpa tombol, tanpa cek permission)
    if (!navigator.geolocation) {
        console.warn("Geolocation tidak didukung browser");
        return;
    }

    console.log("📍 Meminta izin lokasi (auto)");

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            lastLat = position.coords.latitude;
            lastLon = position.coords.longitude;

            // Hitung ulang jadwal berdasarkan GPS
            jadwalSholat = window.calculatePrayerTimes(lastLat, lastLon);
            displayJadwal();

            // Reverse geocoding
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

            } catch (e) {
                console.warn("Reverse geocoding gagal");
                document.getElementById('user-location').innerText =
                    "Lokasi Terdeteksi";
            }
        },

        (err) => {
            console.warn("❌ Akses lokasi ditolak:", err.message);
            // Tetap pakai default Gowa (tidak error)
        },

        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}
