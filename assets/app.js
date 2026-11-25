// Kirana Connect – customer website
const state = { category: "All", query: "" };
const CART_KEY = "kc_cart_v1";
let cart = loadCart();           // { productId: quantity }

function rupees(n) { return "₹" + n.toLocaleString("en-IN"); }
function byId(id) { return PRODUCTS.find(p => p.id === id); }

/* ---------- Store header (KC-7) ---------- */
function renderShop() {
  document.title = "Kirana Connect – " + STORE.name;
  document.getElementById("shopName").textContent = STORE.name;
  document.getElementById("shopTagline").textContent = STORE.tagline;
  document.getElementById("shopAddress").textContent = STORE.address;
  document.getElementById("shopTimings").textContent = STORE.timings;
  document.getElementById("callBtn").href = "tel:" + STORE.phone;
}

/* ---------- Category filter (KC-9) ---------- */
function categories() { return ["All", ...new Set(PRODUCTS.map(p => p.category))]; }
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

/* ---------- Search (KC-10) ---------- */
function matchesSearch(p) {
  const q = state.query.trim().toLowerCase();
  if (!q) return true;
  return (p.name + " " + p.hindi + " " + p.category + " " + (p.tags || "")).toLowerCase().includes(q);
}
function visibleProducts() {
  return PRODUCTS.filter(p => (state.category === "All" || p.category === state.category) && matchesSearch(p));
}

/* ---------- Catalogue (KC-8) ---------- */
function renderProducts() {
  const list = visibleProducts();
  const where = state.category === "All" ? "" : " in " + state.category;
  document.getElementById("productCount").textContent = list.length
    ? list.length + " product" + (list.length === 1 ? "" : "s") + where
    : "No products found" + (state.query ? " for “" + state.query + "”" : "");
  document.getElementById("productGrid").innerHTML = list.map(p => {
    const q = cart[p.id] || 0;
    const control = q
      ? `<div class="qty"><button data-dec="${p.id}" aria-label="Less">−</button><span>${q}</span><button data-inc="${p.id}" aria-label="More">+</button></div>`
      : `<button class="add" data-inc="${p.id}">Add</button>`;
    return `
    <article class="card">
      <div class="icon">${p.icon}</div>
      <h3>${p.name}</h3>
      <span class="hi">${p.hindi}</span>
      <span class="unit">${p.unit}</span>
      <span class="price">${rupees(p.price)}</span>
      <div class="actions">${control}</div>
    </article>`;
  }).join("");
}

/* ---------- Cart (KC-11) and total + saved cart (KC-12) ---------- */
function loadCart() {
  try { return JSON.parse(localStorage.getItem(CART_KEY)) || {}; } catch (e) { return {}; }
}
function saveCart() {
  try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* storage unavailable */ }
}
function changeQty(id, delta) {
  const q = (cart[id] || 0) + delta;
  if (q <= 0) delete cart[id]; else cart[id] = q;
  saveCart();
  renderProducts();
  renderCart();
}
function cartItems() {
  return Object.entries(cart).map(([id, qty]) => ({ p: byId(id), qty })).filter(x => x.p);
}
function cartTotal() { return cartItems().reduce((s, x) => s + x.p.price * x.qty, 0); }
function cartCount() { return cartItems().reduce((s, x) => s + x.qty, 0); }

function renderCart() {
  const items = cartItems();
  const bar = document.getElementById("cartBar");
  bar.classList.toggle("hidden", items.length === 0);
  document.getElementById("cartSummary").textContent =
    cartCount() + " item" + (cartCount() === 1 ? "" : "s") + " · " + rupees(cartTotal());
  document.getElementById("cartLines").innerHTML = items.length
    ? items.map(({ p, qty }) => `
      <div class="line">
        <div>${p.icon} ${p.name}<br><small>${p.unit} · ${rupees(p.price)} each</small></div>
        <div class="qty"><button data-dec="${p.id}">−</button><span>${qty}</span><button data-inc="${p.id}">+</button></div>
        <div><strong>${rupees(p.price * qty)}</strong><br><button class="rm" data-rm="${p.id}">Remove</button></div>
      </div>`).join("")
    : `<p class="empty">Your cart is empty.</p>`;
  document.getElementById("cartTotal").textContent = rupees(cartTotal());
}

/* ---------- Checkout form (KC-13) ---------- */
function readForm(form) {
  const d = Object.fromEntries(new FormData(form).entries());
  Object.keys(d).forEach(k => d[k] = String(d[k]).trim());
  return d;
}
function validate(d) {
  if (!cartItems().length) return "Add at least one item to your cart.";
  if (d.name.length < 2) return "Please enter your name.";
  if (!/^[6-9]\d{9}$/.test(d.phone)) return "Please enter a valid 10-digit mobile number.";
  if (d.mode === "Home delivery" && d.address.length < 8) return "Please enter your full delivery address.";
  return "";
}

/* ---------- Events ---------- */
document.addEventListener("click", e => {
  const t = e.target;
  if (t.dataset.inc) changeQty(t.dataset.inc, 1);
  if (t.dataset.dec) changeQty(t.dataset.dec, -1);
  if (t.dataset.rm) changeQty(t.dataset.rm, -(cart[t.dataset.rm] || 0));
});
document.getElementById("searchBox").addEventListener("input", e => { state.query = e.target.value; renderProducts(); });
document.getElementById("openCart").onclick = () => document.getElementById("cartDrawer").classList.add("open");
document.getElementById("closeCart").onclick = () => document.getElementById("cartDrawer").classList.remove("open");
document.getElementById("checkoutForm").addEventListener("change", e => {
  if (e.target.name === "mode") document.getElementById("addrWrap").hidden = e.target.value !== "Home delivery";
});
document.getElementById("checkoutForm").addEventListener("submit", e => {
  e.preventDefault();
  const d = readForm(e.target);
  const err = validate(d);
  document.getElementById("formError").textContent = err;
  if (err) return;
  placeOrder(d);
});

/* ---------- Send order on WhatsApp (KC-14) ---------- */
function placeOrder(d) {
  const order = {
    id: newOrderId(),
    createdAt: new Date().toISOString(),
    items: cartItems().map(({ p, qty }) => ({ id: p.id, name: p.name, unit: p.unit, price: p.price, qty })),
    total: cartTotal(),
    customer: { name: d.name, phone: d.phone, mode: d.mode, address: d.mode === "Home delivery" ? d.address : "", note: d.note || "" },
    status: "New"
  };
  const text = orderMessage(order, orderBookUrl(order));
  const waUrl = "https://wa.me/" + STORE.whatsapp + "?text=" + encodeURIComponent(text);
  const ok = document.getElementById("formOk");
  ok.hidden = false;
  ok.innerHTML = `<div class="success">
      <span>Order ID</span><span class="oid">${order.id}</span>
      <span>Tap below to send this order to ${STORE.name} on WhatsApp. No call needed.</span>
      <a class="btn btn-wa" id="waBtn" href="${waUrl}" target="_blank" rel="noopener">Send order on WhatsApp</a>
    </div>`;
  document.getElementById("waBtn").addEventListener("click", () => {
    cart = {}; saveCart(); renderProducts(); renderCart();
  });
}

renderShop();
renderChips();
renderProducts();
renderCart();
