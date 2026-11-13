# Shop

The shop at `/shop` lists products straight from Stripe, with a product grid, a page per product (`/shop?item=...`) and a slide-in cart kept in the visitor's browser. Customers pay on Stripe's hosted checkout. Products, prices, stock and orders all live in the Stripe dashboard. There is no database to run.

```
Stripe dashboard (products, sizes, prices, stock, orders)
        │
        ▼
GET  /api/products   ──►  shop page + cart (shop.html, shop.js)
POST /api/checkout   ──►  Stripe Checkout (Stripe's page: card, address, shipping, tax, receipt)
POST /api/webhook    ◄──  Stripe: "order paid"  →  stock counted down, optional Discord ping
```

The API is a small Cloudflare Worker in `worker/`. Only `/api/*` requests run it; every other page is still a free static asset.

**The shop is switched off by default.** `SHOP_ENABLED` in `wrangler.jsonc` is `"false"`, so the build leaves `shop.html`, `order-complete.html`, `terms.html`, `shop.css` and `shop.js` out of the deploy (those URLs return the normal 404 page) and the API sells nothing, even if Stripe keys are set. The rest of the site deploys as usual. Paid-order webhooks keep working either way.

## Keeping secrets out of the repository

This repository is public. That is fine, because none of the code is secret. The keys are, and they live in only two places:

| Where | What | How |
|---|---|---|
| Your PC | test keys | `.dev.vars` (gitignored, copied from `.dev.vars.example`) |
| Cloudflare | live keys | `npx wrangler secret put NAME` (encrypted, never in a file) |

Safety nets:

- **Pre-commit hook.** `scripts/check-secrets.js` blocks any commit containing a Stripe key, webhook secret, Discord webhook URL or private key. Git hooks aren't cloned, so run `npm run setup-hooks` once on each new clone.
- **Build check.** `npm run build` runs the same scan over every tracked file and refuses to build if it finds a key.
- **GitHub push protection.** Check that it's on: repository Settings → Code security → Secret scanning → Push protection.

If a real key ever reaches GitHub, **roll it in Stripe immediately** (Developers → API keys → ⋯ → Roll key). Removing the commit is not enough; bots scrape public repositories within minutes.

## One-time setup

### 1. Stripe test mode first

Do all of this in **test mode / a sandbox** until you have placed a few fake orders end to end.

Create a **restricted key** (Developers → API keys → Create restricted key) instead of using the full secret key. If it ever leaks, it can only do what the shop needs:

| Resource | Permission |
|---|---|
| Products | Read |
| Prices | Write (stock is counted down on the price) |
| Checkout Sessions | Write |
| PaymentIntents | Write (marks an order as handled, so retries never count stock twice) |

### 2. Run it locally

```
copy .dev.vars.example .dev.vars        # then paste the rk_test_... key into it
npm ci
npm run setup-hooks
npm run dev:shop                        # http://localhost:8787/shop (builds and runs with the shop switched on)
```

To receive the "paid" webhook locally, install the [Stripe CLI](https://docs.stripe.com/stripe-cli) and run:

```
stripe listen --forward-to localhost:8787/api/webhook
```

Paste the `whsec_...` it prints into `.dev.vars` as `STRIPE_WEBHOOK_SECRET`, then restart `npm run dev:shop`. Pay with the test card `4242 4242 4242 4242`, any future date and any CVC.

### 3. Settings in `wrangler.jsonc`

These are public settings, not secrets, so they live in `wrangler.jsonc`:

- `SHOP_ENABLED`: `"true"` publishes the shop pages and opens the API. Leave `"false"` until you launch.
- `SHOP_SHIP_COUNTRIES`: two-letter codes you ship to, e.g. `"NO,SE,DK,DE"`. **Checkout stays closed while this is empty.**
- `SHOP_SHIPPING_RATES`: shipping rate IDs (`shr_...`) from Stripe (Product catalog → Shipping rates). The customer picks one at checkout.
- `SHOP_AUTOMATIC_TAX`: `"true"` once Stripe Tax is set up.
- `SHOP_ALLOW_PROMOTION_CODES`: `"true"` to show a discount-code box.
- `SHOP_MAX_QUANTITY`: default per-item limit per order.

### 4. Going live

1. In **live** mode, create the same restricted key, then store it in Cloudflare:
   ```
   npx wrangler secret put STRIPE_SECRET_KEY
   ```
2. In Stripe (live mode): Developers → Webhooks → Add endpoint
   - URL: `https://astrotaca.com/api/webhook`
   - Events: `checkout.session.completed` and `checkout.session.async_payment_succeeded`

   Copy its signing secret, then:
   ```
   npx wrangler secret put STRIPE_WEBHOOK_SECRET
   ```
3. Optional: `npx wrangler secret put ORDER_NOTIFY_WEBHOOK` with a Discord channel webhook URL for a short message on every paid order. It never includes the customer's name, email or address.
4. In Stripe settings, turn on **email receipts** for successful payments and **email notifications to yourself** for new payments. That way you hear about an order even if the webhook fails.
5. Open the shop to the public:
   - `wrangler.jsonc`: set `SHOP_ENABLED` to `"true"`.
   - `shop.html`: delete the `<meta name="robots" content="noindex">` line.
   - `sidebar.html`: add `<li><a href="/shop" class="nav-link">Shop</a></li>`.
   - `terms.html`: fill in every highlighted `terms-placeholder` (business name, organisation number, address, email, phone, VAT line, date), then delete its `noindex` line.
   - `build.js`: add `'shop'` and `'terms'` to `staticPaths` in `buildSitemap`.
   - `flatpanel.html`: swap the "Not available to order yet" status and the interest form for a link to `/shop`.
   - Run `npm run build`, commit and push. Cloudflare deploys it as usual; secrets are kept between deploys.

## Adding products

Everything is done in the Stripe dashboard. Changes appear on the site within about a minute.

**One Stripe product per thing a customer can buy.** For a flat panel in three sizes, make three products. That way Stripe's checkout page, the receipt and your order list all show exactly which size was bought.

Product catalog → Add product:

- **Name** (customers see this at checkout and on the receipt): `AstroTaca Flat Panel – 100–130 mm`
- **Description**: the first paragraph is the summary next to the price (and on the featured card); later paragraphs go under "About this product". Start a new paragraph with a line break.
- **Images**: up to 8. They become the product page gallery, with the first one on the card. For a size group, every size's images are combined in size order, and picking a size shows that size's first image.
- **Marketing feature list** (Stripe's own field on the product): shown as a "Highlights" list with check marks on the product page.
- **Price**: one-off, in your currency
- **Metadata** (under "More options"):

| Key | Example | Meaning |
|---|---|---|
| `shop` | `true` | **Required.** Only products with this are listed, so other Stripe products stay hidden. |
| `group` | `flat-panel` | Products with the same group become one card with a size picker. |
| `group_name` | `Motorized Flat Panel` | Card title for the group. |
| `variant` | `100–130 mm` | Label in the size picker. |
| `sort` | `2` | Order of cards and sizes (lowest first). |
| `category` | `Flat panels` | Small label above the name, and a filter button on the shop page once there are two or more categories. |
| `badge` | `New` | Small label on the card image and product page. "Sold out" takes its place on the card. |
| `page` | `/flatpanel` | "Full details, guides and compatibility" link. Must be a page on this site. |
| `max_per_order` | `2` | Limit for this item per order (default `SHOP_MAX_QUANTITY`). |
| `fit_min_mm`, `fit_max_mm` | `100`, `130` | Dew shield outside diameters this size fits. Turns on the "Which size do I need?" check, the Sizes table and "Fits dew shields 80–160 mm" on the card. |
| `scopes` | `RedCat 71, Askar FRA400` | Telescopes you have checked this size on. Shown as "Known to fit" in the Sizes table. Only list ones you have actually measured. |
| `specs` | `Weight: 420 g; Lit area: 120 mm` | Specifications table for this size, as `Label: value` pairs separated by `;`. |
| `ships` | `Usually ships within a week` | Shown next to the stock status and on the card. Be specific, and a little conservative. |
| `works_with` | `NINA, ASCOM, Windows app` | Software tags under the product name. |
| `in_box` | `Flat panel, USB-C cable, Quick start card` | "In the box" list. |

Product-wide fields (`ships`, `works_with`, `in_box`, `badge`, `page`) only need to be on one product of a size group. Size-specific ones (`fit_*`, `scopes`, `specs`, `variant`, `max_per_order`) go on each size.

**Stock (optional)**: open the product's **price** and add metadata `stock` = `5`. It counts down by itself when orders are paid. The product page shows "In stock", then "Only 3 left" near the end and "Sold out" at `0`. Leave it out for items you build to order: they show "Available", or just your `ships` text on the card.

### Shop-wide text

These live in `shop.html`, not Stripe:

- The intro line under "Shop".
- **Before you order**: short answers to the questions people ask before buying. Add warranty and returns there once you've decided them (an example is commented out).
- **`shop-policies`**: one-line promises shown under "Add to cart" on every product page, such as `<li>2-year warranty</li>`. Leave it empty until you actually offer them.

### What makes these pages convincing

From how Deep Sky Dad, Pegasus Astro, PrimaLuceLab, ZWO and GeminiAstro sell:

- Explain sizes by what they fit (dew shield outside diameter), and list telescopes you've actually checked.
- Name the software it works with, and say plainly what isn't supported or what it needs (power, cables).
- Use numbers instead of adjectives: "ships in 1–2 weeks", "2-year warranty", not "fast shipping" or "premium quality".
- Say what's in the box and link the manual and guides.
- Leave out reviews and star ratings until you have real ones. A few photos from customers do more.

Everyday changes:

- **Hide something**: archive the product, or set `shop` to `false`.
- **Change a price**: Stripe prices can't be edited. Add a new price to the product, then archive the old one.
- **Restock**: edit `stock` on the price.
- **Ship an order**: Stripe's dashboard (Payments) has the address and phone number. Stripe doesn't send shipping emails, so email the tracking number yourself.

## Limits worth knowing

- If two people buy the very last unit within the same second, both payments can succeed. Refund one from the dashboard; at small volumes this is rare.
- `shop.js` only redirects to `https://checkout.stripe.com/`. If you ever set up a custom checkout domain in Stripe, add it there.
- Shipping countries, VAT and returns rules depend on where you sell. Set these up in Stripe (shipping rates, Stripe Tax). The terms of sale are in `terms.html` (`/terms`), linked from "Before you order" and the cart.

## Tests

```
npm test                                        # Worker logic against a fake Stripe, no network
npm run dev                                     # site as it deploys today (shop switched off)
node check-deployment.js http://127.0.0.1:8787  # whole site; checks the shop pages are 404 while switched off
npm run dev:shop                                # same, with the shop switched on
node check-deployment.js http://127.0.0.1:8787  # whole site, including the shop pages and API
```
