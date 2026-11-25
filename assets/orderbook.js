// Kirana Connect – Order Book for shop staff
let orders = loadOrders();
let filter = "All";

function rupees(n) { return "₹" + n.toLocaleString("en-IN"); }
function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3500);
}

/* ---------- Import an order from the WhatsApp link (KC-15) ---------- */
function importFromLink() {
  const m = location.hash.match(/[#&]o=([^&]+)/);
  if (!m) return;
  try {
    const o = decodeOrder(m[1]);
    if (orders.some(x => x.id === o.id)) {
      toast("Order " + o.id + " is already in the Order Book");
    } else {
      o.status = "New";
      o.addedAt = new Date().toISOString();
      orders.push(o);
      saveOrders(orders);
      toast("Order " + o.id + " added to the Order Book");
    }
  } catch (e) {
    toast("This order link could not be read");
  }
  history.replaceState(null, "", location.pathname);   // remove the order from the address bar
}

/* ---------- Today's orders with status filter (KC-16) ---------- */
function isToday(iso) { return new Date(iso).toDateString() === new Date().toDateString(); }
function badgeClass(s) { return "b-" + s.split(" ")[0]; }

function renderStats() {
  const today = orders.filter(o => isToday(o.createdAt));
  const value = today.reduce((s, o) => s + o.total, 0);
  document.getElementById("stats").innerHTML =
    `<div class="stat">Today's orders<b>${today.length}</b></div>` +
    `<div class="stat">Today's value<b>${rupees(value)}</b></div>` +
    STATUSES.map(s => `<div class="stat">${s}<b>${orders.filter(o => o.status === s).length}</b></div>`).join("");
}

function renderChips() {
  const box = document.getElementById("statusChips");
  box.innerHTML = "";
  ["All", ...STATUSES].forEach(s => {
    const b = document.createElement("button");
    b.className = "chip" + (s === filter ? " active" : "");
    b.textContent = s;
    b.onclick = () => { filter = s; renderChips(); renderOrders(); };
    box.appendChild(b);
  });
}

/* ---------- Status buttons (KC-17), delivery person (KC-18), WhatsApp update (KC-19) ---------- */
const STATUS_TEXT = {
  "New": "we have received your order",
  "Packed": "your order is packed and ready",
  "Out for delivery": "your order is out for delivery",
  "Delivered": "your order has been delivered. Thank you for shopping with us"
};
function statusMessage(o) {
  let msg = `Namaste ${o.customer.name}, ${STORE.name} here. Order ${o.id} (₹${o.total}): ${STATUS_TEXT[o.status]}.`;
  if (o.status === "Out for delivery" && o.deliveryBy) msg += ` ${o.deliveryBy} is bringing it to you.`;
  return msg;
}
function statusWaUrl(o) {
  return "https://wa.me/91" + o.customer.phone + "?text=" + encodeURIComponent(statusMessage(o));
}
function updateOrder(id, change) {
  const o = orders.find(x => x.id === id);
  if (!o) return;
  Object.assign(o, change);
  saveOrders(orders);
  renderAll();
}

function orderCard(o) {
  const c = o.customer;
  const statusBtns = STATUSES.map(s =>
    `<button class="sbtn${s === o.status ? " on" : ""}" data-status="${s}" data-id="${o.id}">${s}</button>`).join("");
  const staffOpts = ["", ...STORE.deliveryStaff].map(n =>
    `<option value="${n}"${n === (o.deliveryBy || "") ? " selected" : ""}>${n || "Choose delivery person"}</option>`).join("");
  return `<article class="order" data-id="${o.id}">
    <div class="top"><strong>${o.id}</strong><span class="badge ${badgeClass(o.status)}">${o.status}</span></div>
    <div class="meta">${new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · ${c.name} · ${c.phone}</div>
    <div class="meta">${c.mode}${c.address ? ": " + c.address : ""}${c.note ? " · Note: " + c.note : ""}</div>
    <ul>${o.items.map(i => `<li>${i.name} (${i.unit}) × ${i.qty} – ${rupees(i.price * i.qty)}</li>`).join("")}</ul>
    <strong>Total ${rupees(o.total)}</strong>
    <div class="ob-actions">
      <div class="sbtns">${statusBtns}</div>
      ${c.mode === "Home delivery" ? `<label class="dp">Delivery by <select data-assign="${o.id}">${staffOpts}</select></label>` : ""}
      ${o.deliveryBy ? `<div class="meta">Delivery person: <b>${o.deliveryBy}</b></div>` : ""}
      <a class="btn btn-wa" href="${statusWaUrl(o)}" target="_blank" rel="noopener">Send status to customer on WhatsApp</a>
    </div>
  </article>`;
}

function renderOrders() {
  const list = orders
    .filter(o => filter === "All" || o.status === filter)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  document.getElementById("orderList").innerHTML = list.length
    ? list.map(orderCard).join("")
    : `<p class="empty">No ${filter === "All" ? "" : filter.toLowerCase() + " "}orders yet.</p>`;
}

document.addEventListener("click", e => {
  const b = e.target.closest("[data-status]");
  if (b) { updateOrder(b.dataset.id, { status: b.dataset.status }); toast("Order " + b.dataset.id + " marked " + b.dataset.status); }
});
document.addEventListener("change", e => {
  if (e.target.dataset.assign) {
    updateOrder(e.target.dataset.assign, { deliveryBy: e.target.value });
    if (e.target.value) toast(e.target.value + " will deliver this order");
  }
});

function renderAll() { renderStats(); renderChips(); renderOrders(); }

document.getElementById("shopLine").textContent = STORE.name + " · staff view";
importFromLink();
renderAll();
window.addEventListener("hashchange", () => { importFromLink(); renderAll(); });
