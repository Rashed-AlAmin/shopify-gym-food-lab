/*
  discount-label.js
  
  Minimal — Liquid handles show/hide server-side.
  JS only ensures the cart sections re-render after
  quantity changes on the product page, which Dawn
  doesn't always do automatically.
*/

document.addEventListener('click', (e) => {
  const btn = e.target.closest('button[name="plus"], button[name="minus"]');
  if (!btn) return;

  // Give Shopify 600ms to process the cart update
  // then trigger a cart:refresh so Dawn re-renders sections
  setTimeout(() => {
    document.dispatchEvent(new CustomEvent('cart:refresh'));
    
    // Also force re-fetch sections Dawn uses
    fetch('/cart?section_id=cart-drawer')
      .then(r => r.text())
      .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const newDrawer = doc.querySelector('#shopify-section-cart-drawer');
        const currentDrawer = document.querySelector('#shopify-section-cart-drawer');
        if (newDrawer && currentDrawer) {
          currentDrawer.innerHTML = newDrawer.innerHTML;
        }
      });
  }, 600);
});