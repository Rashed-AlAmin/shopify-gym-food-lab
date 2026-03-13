# Shopify Gym Food Lab — Theme Development

Live store: https://gym-food-lab.myshopify.com

## Task 1 — Dynamic Discount Label

**Feature:** Discount label appears on product cards and cart 
showing bundle pricing. Automatically hides when quantity 
threshold is met.

**Implementation:**
- Discount text and pricing calculated dynamically from 
  product Metafields (no hardcoding)
- `custom.discount_threshold` — quantity needed
- `custom.percentage` — discount percentage  
- Bundle price auto-calculated from product price in Liquid
- Reusable snippet — works for any product by just filling 
  metafield values, zero code changes needed
- Automatic discount applied via Shopify Discount API 
  server-side for actual price reduction at checkout

**Files touched:**
- `snippets/discount-label.liquid` — reusable component
- `snippets/cart-drawer.liquid` — cart drawer render
- `sections/main-cart-items.liquid` — cart page render
- `sections/main-product.liquid` — product page render
- `snippets/card-product.liquid` — product card render
- `assets/discount-label.js` — dynamic show/hide logic
- `assets/base.css` — label styling
- `layout/theme.liquid` — JS loading