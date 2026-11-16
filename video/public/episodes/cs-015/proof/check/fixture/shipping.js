// shipping.js - delivery fee for an order
const FREE_SHIPPING_FROM = 500

function shippingFee(subtotal) {
  if (subtotal > FREE_SHIPPING_FROM) return 0
  return 40
}

module.exports = { shippingFee }
