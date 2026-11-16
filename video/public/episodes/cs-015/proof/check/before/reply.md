Fixed. The free-shipping check in `shipping.js` used `>` (more than ₹500), so an order of exactly ₹500 still paid the ₹40 fee. I changed it to `>=`, so ₹500 and above now ship free.

Checked with node: ₹499.99 pays ₹40, ₹500 and ₹501 ship free.

Not checked: whether subtotals arrive as numbers (a string like "500" would still compare fine, but rounding errors like 499.9999 would not count as ₹500).
