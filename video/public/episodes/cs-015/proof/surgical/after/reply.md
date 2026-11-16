Fixed. The bug was in `lineTotal` in `price.js`: it returned `item.price` and ignored `item.quantity`. It now returns `item.price * item.quantity`. That's the only line I changed. `cartTotal` and `totalWithTax` both go through `lineTotal`, so both are fixed.

I checked it with node. A cart with 3 pens at ₹10 and 1 book at ₹50 now totals 80 (it was 60 before), and 94.40 with tax.

Two things to know:
- I assumed every item has a `quantity`, as you described. If an item has no `quantity`, its line total comes out as `NaN`. If some carts leave it out, I can make it default to 1.
- I left the rest of the file alone. The totals are plain floating-point numbers, so you may see tiny rounding errors. `roundTo` is exported, but nothing in this file calls it.
