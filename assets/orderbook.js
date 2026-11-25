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

function orderCard(o) {
  const c = o.customer;
  return `<article class="order" data-id="${o.id}">
    <div class="top"><strong>${o.id}</strong><span class="badge ${badgeClass(o.status)}">${o.status}</span></div>
    <div class="meta">${new Date(o.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })} · ${c.name} · ${c.phone}</div>
    <div class="meta">${c.mode}${c.address ? ": " + c.address : ""}${c.note ? " · Note: " + c.note : ""}</div>
    <ul>${o.items.map(i => `<li>${i.name} (${i.unit}) × ${i.qty} – ${rupees(i.price * i.qty)}</li>`).join("")}</ul>
    <strong>Total ${rupees(o.total)}</strong>
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

function renderAll() { renderStats(); renderChips(); renderOrders(); }

document.getElementById("shopLine").textContent = STORE.name + " · staff view";
importFromLink();
renderAll();
window.addEventListener("hashchange", () => { importFromLink(); renderAll(); });
