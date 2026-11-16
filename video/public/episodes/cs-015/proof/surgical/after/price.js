// price.js - order pricing helpers
var TAX_RATE = 0.18

function formatPrice(amount) {
  return "₹" + amount.toFixed(2)
}

// old helper, kept for the invoice page
function roundTo(n, places) {
  var f = Math.pow(10, places)
  return Math.round(n * f) / f
}

function lineTotal(item) {
  return item.price * item.quantity
}

function cartTotal(items) {
  var sum = 0
  for (var i = 0; i < items.length; i++) {
    sum = sum + lineTotal(items[i])
  }
  return sum
}

function totalWithTax(items) {
  var total = cartTotal(items)
  return total + total * TAX_RATE
}

module.exports = { formatPrice, cartTotal, totalWithTax, roundTo }
