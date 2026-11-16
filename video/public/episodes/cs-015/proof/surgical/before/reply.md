Fixed. The bug was in `lineTotal` in `price.js`: it returned `item.price` and ignored `quantity`. It now returns `item.price * item.quantity`.

`cartTotal` and `totalWithTax` both go through `lineTotal`, so this one change fixes both. I checked it with node: 3 pens at ₹10 plus 1 cup at ₹5 now comes to 35 (it was 15 before), and an empty cart is still 0.

Not checked: items that have no `quantity` will now total to NaN rather than counting as 1. If any part of your code builds items without a quantity, tell me and I'll make it default to 1.
