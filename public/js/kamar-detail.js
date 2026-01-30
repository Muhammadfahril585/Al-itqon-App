document.addEventListener("DOMContentLoaded", loadDetail);

async function loadDetail() {
  const nama = decodeURIComponent(location.pathname.split("/").pop());

  const judul = document.getElementById("judul-kamar");
  const jumlah = document.getElementById("jumlah-santri");
  const container = document.getElementById("santri-container");

  judul.textContent = `🛏️ Kamar ${nama}`;
  container.innerHTML = "⏳ Memuat santri...";

  try {
    const res = await fetch(`/api/kamar/${encodeURIComponent(nama)}`);
    const data = await res.json();

    jumlah.textContent = `${data.jumlah} santri`;

    container.innerHTML = "";
    data.santri.forEach(nama => {
  const div = document.createElement("div");
  div.className = "santri-item";
  div.innerHTML = `
    <span class="santri-icon">👤</span>
    <span class="santri-nama">${nama}</span>
  `;
  container.appendChild(div);
});

  } catch {
    container.innerHTML = "❌ Gagal memuat santri";
  }
}
