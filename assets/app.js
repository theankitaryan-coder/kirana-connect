// Kirana Connect – customer website
const state = { category: "All" };

function rupees(n) { return "₹" + n.toLocaleString("en-IN"); }

function renderShop() {
  document.title = "Kirana Connect – " + STORE.name;
  document.getElementById("shopName").textContent = STORE.name;
  document.getElementById("shopTagline").textContent = STORE.tagline;
  document.getElementById("shopAddress").textContent = STORE.address;
  document.getElementById("shopTimings").textContent = STORE.timings;
  document.getElementById("callBtn").href = "tel:" + STORE.phone;
}

function categories() {
  return ["All", ...new Set(PRODUCTS.map(p => p.category))];
}

function renderChips() {
  const box = document.getElementById("categoryChips");
  box.innerHTML = "";
  categories().forEach(c => {
    const b = document.createElement("button");
    b.className = "chip" + (c === state.category ? " active" : "");
    b.textContent = c;
    b.onclick = () => { state.category = c; renderChips(); renderProducts(); };
    box.appendChild(b);
  });
}

function visibleProducts() {
  return PRODUCTS.filter(p => state.category === "All" || p.category === state.category);
}

function renderProducts() {
  const list = visibleProducts();
  document.getElementById("productCount").textContent =
    list.length + " product" + (list.length === 1 ? "" : "s") + (state.category === "All" ? "" : " in " + state.category);
  const grid = document.getElementById("productGrid");
  grid.innerHTML = list.map(p => `
    <article class="card">
      <div class="icon">${p.icon}</div>
      <h3>${p.name}</h3>
      <span class="hi">${p.hindi}</span>
      <span class="unit">${p.unit}</span>
      <span class="price">${rupees(p.price)}</span>
    </article>`).join("");
}

renderShop();
renderChips();
renderProducts();
