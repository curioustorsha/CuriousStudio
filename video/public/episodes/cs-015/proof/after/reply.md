Before I write this, a few things about discount codes aren't clear from the request, and they change both the totals and the code:

1. **What kind of discount?** A percentage off (e.g. `SAVE10` = 10% off), a flat amount off (e.g. `FLAT100` = Rs.100 off), or both?
2. **Where do the codes come from?** A short hard-coded list in `cart.js` is fine for now, or do they come from somewhere else (a database or API) that I should read from?
3. **Before or after tax?** I'd apply the discount to the subtotal, before the 18% tax. That's the usual way, and the customer pays less tax too.
4. **Free shipping threshold.** Should the Rs.999 free-shipping check use the subtotal before or after the discount? Example: a Rs.1,050 cart with Rs.100 off comes to Rs.950. Does it still ship free?
5. **One code or several?** I'd allow one code per order.
6. **Unknown or invalid code.** Should `total()` throw an error, or just ignore the code and charge full price?

If you don't have strong views, here's what I'd build. `total(items, code)` takes an optional code, looked up in a small `DISCOUNT_CODES` map in `cart.js` (percent or flat). It comes off the subtotal before tax and never takes it below 0. Free shipping is checked on the discounted amount. One code per order, and an unknown code throws, so the checkout page can show "invalid code". It's about 15 lines and adds no new dependencies. I'd also add a few quick checks: no code, a percent code, a flat code, a flat code bigger than the cart, and a bad code.

Just say "go with your defaults" or tell me which answers you'd like changed. I haven't touched `cart.js` yet.
