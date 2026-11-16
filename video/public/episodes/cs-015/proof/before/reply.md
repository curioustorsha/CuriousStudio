Added discount codes to `cart.js`. `total(items, code)` now takes an optional code, and there's a new `discount(subtotal, code)` you can call to show the saving on the page.

How it works:
- Codes live in a `DISCOUNT_CODES` table at the top. A code is either a percent off (`SAVE10` = 10%) or a flat amount off (`FLAT100` = Rs.100, never more than the subtotal).
- Codes ignore case and extra spaces, so " save10 " works.
- An unknown code throws `Invalid discount code: ...`, so the checkout page can catch it and show a message.
- No code means the same total as before, so existing callers don't change.

I picked these rules without checking with you. Tell me if any are wrong:
1. **The two codes are placeholders.** Send me the real codes and amounts and I'll swap them in. Don't ship `SAVE10` / `FLAT100` as they are.
2. **The discount comes off before tax**, so tax is charged on the lower amount.
3. **Free shipping uses the discounted amount.** A Rs.1,050 cart with `FLAT100` drops to Rs.950 and pays the Rs.49 shipping fee. If you want free shipping based on the price before the discount, that's a one-word change.
4. **One code per order.** No stacking, no expiry dates, no minimum order, no usage limits. If you need any of those, or the codes should come from a database or admin panel instead of the file, tell me and I'll add it.

There are no tests in the project, so I haven't run this.
