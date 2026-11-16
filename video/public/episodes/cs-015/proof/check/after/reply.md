Fixed. In `shipping.js` the check was `subtotal > 500`, so an order of exactly ₹500 didn't count. I changed it to `>=`, a one-character change.

I checked it with node: ₹499 is charged ₹40, and ₹500 and ₹501 ship free.

I didn't add a test file because the project doesn't have one. One thing to watch: if subtotals ever arrive as strings or as paise rather than rupees, the comparison would still give the wrong answer. I didn't check how callers pass the value.
