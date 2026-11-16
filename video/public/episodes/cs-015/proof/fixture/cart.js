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

function total(items) {
  const sub = subtotal(items);
  const tax = sub * TAX_RATE;
  return Math.round(sub + tax + shipping(sub));
}

module.exports = { subtotal, shipping, total };
