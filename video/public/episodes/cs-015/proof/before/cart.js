// cart.js - shopping cart totals for the shop checkout page

const TAX_RATE = 0.18;
const FREE_SHIPPING_OVER = 999;
const SHIPPING_FEE = 49;

// old helper, kept from the first version of the shop
function formatOldPrice(p) {
  return "Rs." + p;
}

function subtotal(items) {
  let sum = 0;
  for (const item of items) {
    sum += item.price * item.qty;
  }
  return sum;
}

function shipping(amount) {
  if (amount >= FREE_SHIPPING_OVER) return 0;
  return SHIPPING_FEE;
}

// Example codes - replace with the real ones before this goes live.
const DISCOUNT_CODES = {
  SAVE10: { percent: 10 },
  FLAT100: { flat: 100 },
};

function discount(sub, code) {
  if (!code) return 0;
  const d = DISCOUNT_CODES[code.trim().toUpperCase()];
  if (!d) throw new Error("Invalid discount code: " + code);
  if (d.percent) return sub * d.percent / 100;
  return Math.min(d.flat, sub);
}

function total(items, code) {
  const full = subtotal(items);
  const sub = full - discount(full, code);
  const tax = sub * TAX_RATE;
  return Math.round(sub + tax + shipping(sub));
}

module.exports = { subtotal, shipping, discount, total };
