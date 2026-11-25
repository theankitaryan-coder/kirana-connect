// Shared helpers for creating and reading orders (customer site + Order Book)
const ORDERS_KEY = "kc_orders_v1";
const STATUSES = ["New", "Packed", "Out for delivery", "Delivered"];

function newOrderId(now = new Date()) {
  const p = n => String(n).padStart(2, "0");
  const rand = Math.floor(Math.random() * 900 + 100);
  return "KC" + p(now.getDate()) + p(now.getMonth() + 1) + "-" + p(now.getHours()) + p(now.getMinutes()) + "-" + rand;
}

// Order <-> URL-safe text, so the whole order travels inside the WhatsApp link
function encodeOrder(order) {
  const json = JSON.stringify(order);
  return btoa(unescape(encodeURIComponent(json))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function decodeOrder(text) {
  let b64 = text.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return JSON.parse(decodeURIComponent(escape(atob(b64))));
}

function orderBookUrl(order) {
  const base = location.href.replace(/[^/]*([?#].*)?$/, "");
  return base + "orders.html#o=" + encodeOrder(order);
}

function orderMessage(order, link) {
  const lines = [
    "🛒 *New order " + order.id + "*",
    "",
    ...order.items.map(i => `• ${i.name} (${i.unit}) × ${i.qty} = ₹${i.price * i.qty}`),
    "",
    "*Total: ₹" + order.total + "*",
    "",
    "Name: " + order.customer.name,
    "Mobile: " + order.customer.phone,
    order.customer.mode + (order.customer.mode === "Home delivery" ? ": " + order.customer.address : ""),
  ];
  if (order.customer.note) lines.push("Note: " + order.customer.note);
  lines.push("", "Shop staff – add to Order Book: " + link);
  return lines.join("\n");
}

function loadOrders() {
  try { return JSON.parse(localStorage.getItem(ORDERS_KEY)) || []; } catch (e) { return []; }
}
function saveOrders(list) {
  try { localStorage.setItem(ORDERS_KEY, JSON.stringify(list)); } catch (e) { /* storage unavailable */ }
}
