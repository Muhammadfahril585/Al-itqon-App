document.addEventListener("DOMContentLoaded", loadKamar);

async function loadKamar() {
  const container = document.querySelector(".kamar-container");
  container.innerHTML = "⏳ Memuat kamar...";

  try {
    const res = await fetch("/api/kamar");
    const data = await res.json();

    container.innerHTML = "";

    data.forEach(kamar => {
      const card = document.createElement("div");
      card.className = "kamar-card";
      card.innerHTML = `
        <div class="kamar-icon">🛏️</div>
        <div class="kamar-nama">Kamar ${kamar.nama}</div>
        <div class="kamar-jumlah">${kamar.jumlah} santri</div>
      `;

      card.onclick = () => {
        location.href = `/kamar/${encodeURIComponent(kamar.nama)}`;
      };

      container.appendChild(card);
    });

  } catch (err) {
    container.innerHTML = "❌ Gagal memuat kamar";
  }
}
