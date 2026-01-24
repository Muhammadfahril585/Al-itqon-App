/***********************************************************
 * STATE APLIKASI
 ***********************************************************/
let selectedRaportType = ""; // 'tahfidz' | 'sekolah'

/***********************************************************
 * KONTROL MODAL & MENU
 ***********************************************************/

// Fungsi saat tombol menu diklik
function openRaport(type) {
  selectedRaportType = type;
  document.getElementById("input-id-santri").value = "";
  document.getElementById("id-verification-modal").style.display = "flex";
}

// Fungsi menutup modal
function closeModal() {
  document.getElementById("id-verification-modal").style.display = "none";
}

// Fungsi tombol "Cek Raport" di dalam modal
function verifyID() {
  const id = document.getElementById("input-id-santri").value.trim();

  if (!id) {
    alert("Mohon masukkan ID santri.");
    return;
  }

  closeModal();
  loadRaportByID(id);
}

/***********************************************************
 * AMBIL DATA DARI SERVER (INTEGRASI GOOGLE SHEETS)
 ***********************************************************/
async function loadRaportByID(id) {
  const container = document.getElementById("raport-result");
  const wrapper = document.getElementById("raport-result-wrapper");
  const mainMenu = document.getElementById("main-menu");

  mainMenu.style.display = "none";
  wrapper.style.display = "block";

  container.innerHTML = `
    <div class="raport-card" style="text-align:center;">
      <p>⏳ Sedang mengambil data dari Google Sheets...</p>
    </div>
  `;

  try {
    const response = await fetch(`/api/tahfidz/${id}`, {
      credentials: "same-origin" // ⬅️ PENTING untuk session
    });

    // ❗ Kalau server redirect (biasanya ke "/")
    if (response.redirected) {
      throw new Error("Session berakhir, silakan login ulang.");
    }

    const contentType = response.headers.get("content-type") || "";

    // ❗ Kalau bukan JSON
    if (!contentType.includes("application/json")) {
      throw new Error("Response bukan JSON (kemungkinan redirect / error auth)");
    }

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.error || "Data tidak ditemukan");
    }

    const { santri, raport } = result;

    if (selectedRaportType === "tahfidz") {
      renderTahfidz(container, santri, raport);
    } else {
      container.innerHTML = `
        <div class="raport-card" style="text-align:center;">
          <h2>${santri.nama}</h2>
          <p>Fitur Raport Sekolah masih dalam pengembangan.</p>
          <button onclick="goBack()" class="btn-back">Kembali</button>
        </div>
      `;
    }

  } catch (error) {
    console.error("Fetch Error:", error);
    alert(error.message);
    goBack();
  }
}

/***********************************************************
 * FUNGSI RENDER (TAMPILAN DATA)
 ***********************************************************/
function renderTahfidz(container, santri, raport) {
  const getVal = (idx) => raport[idx]?.values?.[0]?.[0] || "-";

  const colGroupHtml = `
    <colgroup>
      <col style="width: 60px;"><col style="width: 129px;"><col style="width: 73px;">
      <col style="width: 73px;"><col style="width: 73px;"><col style="width: 73px;">
      <col style="width: 73px;"><col style="width: 100px;"><col style="width: 100px;">
      <col style="width: 110px;">
    </colgroup>`;

  // --- HALAMAN 1: SAMPUL ---
  const coverHtml = `
    <div class="raport-page-cover">
      <div class="cover-header">
        <h2>LAPORAN PENCAPAIAN HAFALAN SANTRI</h2>
        <h2>PONDOK PESANTREN TAHFIDZUL QUR'AN</h2>
        <h2>AL-ITQON GOWA</h2>
        <div class="logo-wrapper">
          <img src="${window.LOGO_BASE64 || ''}" alt="Logo" class="logo-besar">
        </div>        

        <div class="identitas-santri-cover">
          <p>NAMA SANTRI</p>
          <div class="line-name"><b>${santri.nama || '-'}</b></div>
          
          <p>NOMOR INDUK</p>
          <div class="line-nis"><b>${santri.nis || '-'}</b></div>
        </div>

        <div class="footer-yayasan">
          <h3>YAYASAN INSAN RABBANI GOWA</h3>
          <h3>KABUPATEN GOWA, SUL-SEL</h3>
        </div>
      </div>
    </div>
  `;
  // --- HALAMAN 2: PETUNJUK PENGGUNAAN (TAMBAHAN BARU) ---
  const petunjukHtml = `
    <div class="raport-page-petunjuk">
      <div class="petunjuk-content">
        <h2 class="title-petunjuk">PETUNJUK PENGGUNAAN</h2>
        <ol class="list-petunjuk">
          <li>Buku Laporan Pencapaian Hafalan ini digunakan selama Santri mengikuti proses Menghafal di PPTQ Al-Itqon Gowa.</li>
          <li>Apabila Santri pindah Pondok, buku Laporan Pencapaian Hafalan dibawa oleh Santri yang bersangkutan sebagai bukti pencapaian hafalan.</li>
          <li>Apabila buku Laporan Pencapaian Hafalan Santri hilang, dapat diganti dengan buku Laporan Pencapaian Hafalan Pengganti dan diisi dengan nilai-nilai yang dikutip dari Buku Induk Pondok/Madrasah asal Santri dan disahkan oleh Pimpinan yang bersangkutan.</li>
          <li>Buku Laporan Pencapaian Hafalan Santri ini harus dilengkapi dengan pas foto terbaru ukuran 3 x 4 cm, dan pengisiannya dilakukan oleh Pembina.</li>
          <li>Pengisian laporan penilaian hasil menghafal dilakukan oleh Pembina berdasarkan data penilaian hasil menghafal dari Ustadz/Muhaffidz.</li>
          <li>Pengisian laporan hasil menghafal Santri ini mengacu pada panduan penyusunan penilaian hasil menghafal Pondok.</li>
        </ol>

        <h2 class="title-petunjuk" style="margin-top: 50px;">KETERANGAN NILAI KUALITATIF</h2>
        <table class="table-kualitatif">
          <thead>
            <tr>
              <th rowspan="2">PREDIKAT</th>
              <th>NILAI KOMPETENSI</th>
            </tr>
            <tr>
              <th>PENGETAHUAN</th>
            </tr>
          </thead>
          <tbody>
            <tr><td>A</td><td>AMAT BAIK (85-100)</td></tr>
            <tr><td>B</td><td>BAIK (70-84)</td></tr>
            <tr><td>C</td><td>CUKUP (55-69)</td></tr>
            <tr><td>K</td><td>KURANG (< 55)</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  `;
  // --- HALAMAN 3: TABEL NILAI ---
  const buatHalamanNilai = (semNum, bln, offset) => {
    const colGroup = `<colgroup><col style="width: 50px;"><col style="width: 150px;"><col span="8" style="width: auto;"></colgroup>`;
    
    // Identitas Semester (Khusus Smt 2 mengambil nama dari indeks 50/offset+4)
    const displayNama = santri.nama || '-';
    const displayNis  = santri.nis  || '-';

    return `
    <div class="raport-card">
      <div class="raport-header-text">
        <h2 style="text-decoration: underline;">LAPORAN PENCAPAIAN HAFALAN SANTRI</h2>
        <h3>SEMESTER ${semNum} - PPTQ AL-ITQON GOWA</h3>
      </div>

     <table class="info-table">
      <colgroup>
       <col style="width:120px">
       <col style="width:240px">
       <col style="width:70px">
       <col style="width:90px">
      </colgroup>
        <tr>
          <td>Nama santri:</td><td><b>${displayNama}</b></td>
          <td>Kelas:</td><td>${santri.kelas || '-'}</td>
        </tr>
        <tr>
          <td>NIS:</td><td>${displayNis}</td>
          <td>Semester:</td><td>${semNum}</td>
        </tr>
      </table>

      <div class="section-label">TAHFIDZ</div>
      <table class="table-raport">
        <thead>
          <tr>
            <th rowspan="2">NO</th><th rowspan="2">Target Hafalan</th><th colspan="5">Bulan</th>
            <th rowspan="2">Total Smt</th><th rowspan="2">Total Seluruh</th><th rowspan="2">KET</th>
          </tr>
          <tr>${bln.map(b => `<th>${b}</th>`).join('')}</tr>
        </thead>
        <tbody>
          <tr>
            <td>1</td><td>${getVal(offset + 0)}</td>
            <td>${getVal(offset + 1)}</td><td>${getVal(offset + 2)}</td><td>${getVal(offset + 3)}</td>
            <td>${getVal(offset + 4)}</td><td>${getVal(offset + 5)}</td>
            <td>${getVal(offset + 6)}</td><td>${getVal(offset + 7)}</td><td>${getVal(offset + 8)}</td>
          </tr>
        </tbody>
      </table>

      <div style="height:10px"></div>

      <table class="table-raport">
        <thead>
          <tr><th colspan="2">Hifdzul Quran</th><th>Nilai Akhir</th><th colspan="2">Jumlah Hafalan</th><th colspan="2">Juz Diuji</th><th colspan="3">Keterangan</th></tr>
        </thead>
        <tbody>
          <tr><td>2</td><td>Hifzh</td><td>${getVal(offset + 9)}</td><td colspan="2" rowspan="2">${getVal(offset + 11)}</td><td colspan="2" rowspan="2">${getVal(offset + 12)}</td><td colspan="3" rowspan="2">${getVal(offset + 13)}</td></tr>
          <tr><td>3</td><td>Tajwid</td><td>${getVal(offset + 10)}</td></tr>
        </tbody>
      </table>

      <div class="section-label" style="margin-top:15px">KEPRIBADIAN</div>
      <table class="table-raport">
        <thead><tr><th>No</th><th colspan="2">Aspek</th><th>Nilai</th><th colspan="2">Predikat</th><th colspan="4">Deskripsi</th></tr></thead>
        <tbody>
          ${["Adab", "Ibadah", "Bahasa", "Bersih", "Rapi"].map((aspek, i) => {
            const b = (offset + 14) + (i * 3);
            return `<tr><td>${i+1}</td><td colspan="2">${aspek}</td><td>${getVal(b)}</td><td colspan="2">${getVal(b+1)}</td><td colspan="4">${getVal(b+2)}</td></tr>`;
          }).join('')}
        </tbody>
      </table>

      <div class="section-label" style="margin-top:15px">PENGEMBANGAN DIRI</div>
      <table class="table-raport">
        <tbody>
          <tr><td>6</td><td colspan="3">Muhadharah</td><td colspan="6">${getVal(offset + 31)}</td></tr>
          <tr><td>7</td><td colspan="3">Pembacaan Kitab</td><td colspan="6">${getVal(offset + 32)}</td></tr>
        </tbody>
      </table>

            <div class="section-label" style="margin-top:15px; text-align:left; padding-left:10px;">Catatan</div>
      <div class="catatan-style">${getVal(offset + 29)}</div>

      <div style="margin-top:20px; font-size:13px; text-align:right; padding-right: 20px;">
        ${getVal(offset + 30)}
      </div>

      <table style="width:100%; margin-top:30px; text-align:center; font-size:13px; border:none;">
        <tr>
          <td style="width:33%; border:none;">Orang Tua/Wali</td>
          <td style="width:33%; border:none;">Mengetahui<br>Pimpinan Pondok</td>
          <td style="width:33%; border:none;">Muhafidz</td>
        </tr>
        <tr>
          <td style="height:80px; border:none;"></td>
          <td style="border:none;"></td>
          <td style="border:none;"></td>
        </tr>
        <tr>
          <td style="border:none;">( ............................ )</td>
          <td style="border:none;"><b>${getVal(offset + 34)}</b></td>
          <td style="border:none;"><b>${getVal(offset + 35)}</b></td>
        </tr>
      </table>

      ${semNum === 2 ? `<div style="text-align:center; margin-top:20px;"><button onclick="goBack()" class="btn-back">Tutup Raport</button></div>` : ''}
    </div>`;
  };

  // --- KOMBINASI HALAMAN ---
  const sem1 = buatHalamanNilai(1, ["Januari", "Februari", "Maret", "April", "Mei"], 0);
  const sem2 = buatHalamanNilai(2, ["Juli", "Agustus", "September", "Oktober", "November"], 36);
// --- HALAMAN TERAKHIR: CATATAN STATIS ---
  const halamanCatatanHtml = `
    <div class="raport-page-catatan">
      <div class="box-catatan-statis">
        <h3 class="title-catatan">CATATAN TENTANG PENGEMBANGAN DIRI</h3>
        <div class="garis-titik-container">
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
        </div>
      </div>

      <div class="box-catatan-statis" style="margin-top: 40px;">
        <h3 class="title-catatan">CATATAN</h3>
        <div class="garis-titik-container">
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
          <div class="garis-titik"></div>
        </div>
      </div>

      <div class="footer-ttd-statis">
        <div class="tgl-statis">Gowa, ......................... 2025</div>
        <table class="table-ttd-statis">
          <tr>
            <td>Orang Tua/Wali</td>
            <td>Mengetahui,<br>Pimpinan Pondok</td>
            <td>Muhaffidz</td>
          </tr>
          <tr>
            <td style="height: 100px;">( ............................ )</td>
            <td><b>Mansur Taswin Lc</b></td>
            <td>( ............................ )</td>
          </tr>
        </table>
      </div>
      
      <div style="text-align:center; margin-top:30px; no-print">
        <button onclick="goBack()" class="btn-back">Tutup Raport</button>
      </div>
    </div>
  `;
  container.innerHTML = coverHtml + petunjukHtml + sem1 + sem2 + halamanCatatanHtml;
}

// Fungsi kembali ke menu utama
function goBack() {
  // Sembunyikan hasil dan pembungkusnya
  document.getElementById("raport-result-wrapper").style.display = "none";
  // Munculkan kembali menu utama
  document.getElementById("main-menu").style.display = "grid";
  // Scroll ke posisi paling atas agar tidak bingung
  window.scrollTo(0, 0);
}

