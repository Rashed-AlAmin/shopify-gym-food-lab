# Shopify Theme Development — Fitness Food Lab

Live Store: https://fitness-food-lab.myshopify.com
Password: 123

> Custom Shopify theme built on Dawn (Online Store 2.0)
> demonstrating advanced Liquid, JavaScript, and Shopify
> APIs including Metafields, Cart Ajax API, and Draft Orders API.

---

## Task 1 — Dynamic Discount Label

**Live demo:** https://fitness-food-lab.myshopify.com/collections/fitness

### What it does
- Displays a dynamic discount label on product cards and cart drawer
- Label text and bundle price auto-calculated from product price — no hardcoding
- Label disappears automatically when quantity threshold is met in cart
- Fully reusable — add discount to any new product by filling two metafield values, zero code changes needed

### Implementation
- **Metafields used:**
  - `custom.discount_threshold` — quantity needed (e.g. 3)
  - `custom.percentage` — discount % (e.g. 10)
- Bundle price calculated server-side in Liquid using `product.price` and metafield values
- JS watches cart state via Shopify Ajax API `/cart.js`
- MutationObserver detects Dawn cart drawer re-renders
- Automatic discount applied via Shopify Discount API for actual price reduction at checkout

### Files
| File | Purpose |
|------|---------|
| `snippets/discount-label.liquid` | Reusable label component |
| `snippets/cart-drawer.liquid` | Cart drawer render |
| `sections/main-cart-items.liquid` | Cart page render |
| `sections/main-product.liquid` | Product page render |
| `snippets/card-product.liquid` | Product card render |
| `assets/discount-label.js` | Dynamic show/hide logic |

---

## Task 2 — Custom Flavour Selection Modal

**Live demo:** https://fitness-food-lab.myshopify.com/products/turkish-delight

### What it does
- Flavour selection modal opens on Turkish Delight product
- Max selectable flavours enforced per weight variant:
  - 250g → up to 3 flavours
  - 500g → up to 5 flavours
  - 1kg → up to 10 flavours
- Add to Cart and Buy Now buttons hidden until flavours are selected — prevents untagged cart items
- Selected flavours stored as cart line item properties
- Flavours displayed in cart drawer: "Flavours: Apricot, Watermelon, Pistachio"
- Changing weight variant resets selection automatically

### Implementation
- **Product Metafield:**
  - `custom.flavour_options` — List of text (6 flavours)
- **Variant Metafield:**
  - `custom.flavour_limit` — Integer per variant (3/5/10)
- Variant limits embedded in page via Liquid as `window.variantFlavourLimits` JSON object
- Flavours stored via Shopify Cart Ajax API `/cart/add.js` with `properties` object
- Modal built with vanilla JS — no dependencies

### Files
| File | Purpose |
|------|---------|
| `snippets/flavour-modal.liquid` | Modal HTML + variant data |
| `assets/flavour-modal.js` | Modal logic + cart API calls |
| `sections/main-product.liquid` | Modal render location |

---

## Task 3 — Custom Bundle Builder

**Live demo:** https://fitness-food-lab.myshopify.com/pages/build-your-kit

### What it does
- Full bundle builder page — customers build a kit step by step
- Men and Women gender tabs per bundle
- Step by step product selection from assigned collections
- Live pricing summary updates after each step:
  - RRP — sum of original product prices
  - Your Price — sum of bundle step prices
  - Kit Savings — the difference
- Selected product thumbnails shown in summary panel
- All bundle configuration done in Theme Customizer — no code changes needed:
  - Bundle image, title, description
  - Gender tabs (Men / Women)
  - Which collections are used at each step
  - Bundle price per step
  - Max products selectable per step
- Product image hover effect — white background disappears
- Partial bundles blocked — must complete all steps
- Coming Soon placeholder for future bundles

### Implementation
- **Theme Customizer Schema** — full bundle config via section blocks
- Bundle config passed to JS via `window.bundleConfig` Liquid object
- Products fetched from collections via Shopify Ajax API `/collections/handle/products.json`
- **Draft Orders API** backend for price override at checkout:
  - Each line item gets `applied_discount` = (original price - bundle price)
  - Shows crossed out original price + bundle price at checkout
  - Shows total savings at checkout
  - Tax exempt — bundle prices are tax inclusive
  - Free shipping applied via draft order
- Backend deployed on Render — always live, no local server needed

### Files
| File | Purpose |
|------|---------|
| `templates/page.bundle-builder.json` | Page template |
| `sections/bundle-builder.liquid` | Section with full Customizer schema |
| `assets/bundle-builder.js` | Step flow, pricing logic, Draft Orders call |
| `assets/bundle-builder.css` | All styles including hover effect |

### Backend
Separate Node.js/Express backend repo:
https://github.com/Rashed-AlAmin/bundle-backend-service

---

## Technical Stack
- Shopify Dawn theme (Online Store 2.0)
- Liquid templating
- Vanilla JavaScript (ES6+)
- Shopify Ajax Cart API
- Shopify Admin API (Draft Orders)
- Shopify Metafields + Variant Metafields
- Node.js + Express (backend)
- Shopify CLI 3.91.1

## Store Setup
- Collections: Fitness, Food, Jerseys, Shorts, Socks
- Fitness: Dumbbell, Jump Rope, Protein Powder
- Food: Turkish Delight (with 250g, 500g, 1kg variants)
- Kit Builder: Summer Classic bundle (Men/Women)