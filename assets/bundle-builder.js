/*
  bundle-builder.js
  
  Handles:
  - Bundle selection and gender choice
  - Step by step product fetching from collections via Storefront API
  - Live pricing summary (RRP / Your Price / Kit Savings)
  - Confirm selection and next step flow
  - Final checkout via Draft Orders API
*/

class BundleBuilder {
  constructor() {
    this.config = window.bundleConfig;
    if (!this.config) return;

    this.currentBundle = null;
    this.currentGender = null;
    this.currentStep = 0;
    this.selectedProducts = [];
    this.currentProducts = [];
    this.currentPage = 0;
    this.productsPerPage = 2;

    this.init();
  }

  init() {
    // Listen for bundle + gender selection on landing page
    document.querySelectorAll('.bundle-card__gender-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const bundleIndex = parseInt(e.target.dataset.bundle);
        const gender = e.target.dataset.gender;
        this.startBundle(bundleIndex, gender);
      });
    });
  }

  startBundle(bundleIndex, gender) {
    this.currentBundle = this.config.bundles[bundleIndex];
    this.currentGender = gender;
    this.currentStep = 0;
    this.selectedProducts = [];

    // Hide bundle list, show flow
    document.getElementById('bundle-list').style.display = 'none';
    document.getElementById('bundle-flow').style.display = 'block';

    // Set title
    document.getElementById('flow-title').textContent =
      this.currentBundle.title.toUpperCase() +
      ' | ' + this.currentBundle.description.toUpperCase();

    this.renderStepTabs();
    this.loadStep(0);
  }

  renderStepTabs() {
    const container = document.getElementById('flow-steps');
    container.innerHTML = '';

    this.currentBundle.steps.forEach((step, i) => {
      const tab = document.createElement('span');
      tab.className = 'bundle-step-tab' + (i === 0 ? ' active' : '');
      tab.textContent = step.label;
      tab.dataset.step = i;
      container.appendChild(tab);

      if (i < this.currentBundle.steps.length - 1) {
        const sep = document.createElement('span');
        sep.className = 'bundle-step-sep';
        sep.textContent = ' | ';
        container.appendChild(sep);
      }
    });
  }

  async loadStep(stepIndex) {
    this.currentStep = stepIndex;
    this.currentPage = 0;

    // Update active tab
    document.querySelectorAll('.bundle-step-tab').forEach((tab, i) => {
      tab.classList.toggle('active', i === stepIndex);
    });

    const step = this.currentBundle.steps[stepIndex];
    const collectionHandle = this.currentGender === 'men'
      ? step.collection
      : step.collection_women;

    if (!collectionHandle) {
      this.showError('No collection assigned for this step.');
      return;
    }

    // Fetch products from collection via Ajax API
    const products = await this.fetchCollectionProducts(collectionHandle);
    this.currentProducts = products;

    this.renderProductGrid();
    this.renderDetail(null);
  }

  async fetchCollectionProducts(handle) {
    try {
      const response = await fetch(`/collections/${handle}/products.json?limit=20`);
      const data = await response.json();
      return data.products || [];
    } catch (e) {
      console.error('Failed to fetch products:', e);
      return [];
    }
  }

  renderProductGrid() {
    const grid = document.getElementById('products-grid');
    grid.innerHTML = '';

    const start = this.currentPage * this.productsPerPage;
    const end = start + this.productsPerPage;
    const visible = this.currentProducts.slice(start, end);

    visible.forEach((product, i) => {
      const card = document.createElement('div');
      card.className = 'bundle-product-card';
      card.dataset.productIndex = start + i;

      const img = product.images[0]?.src || '';
      card.innerHTML = `
        <div class="bundle-product-card__img-wrap">
          <img src="${img}" alt="${product.title}" 
               class="bundle-product-card__img">
        </div>
      `;

      card.addEventListener('click', () => {
        document.querySelectorAll('.bundle-product-card')
          .forEach(c => c.classList.remove('selected'));
        card.classList.add('selected');
        this.renderDetail(product);
      });

      grid.appendChild(card);
    });

    // Nav arrows
    document.getElementById('products-prev').style.display =
      this.currentPage > 0 ? 'block' : 'none';
    document.getElementById('products-next').style.display =
      end < this.currentProducts.length ? 'block' : 'none';

    // Bind nav
    document.getElementById('products-next').onclick = () => {
      this.currentPage++;
      this.renderProductGrid();
    };
    document.getElementById('products-prev').onclick = () => {
      this.currentPage--;
      this.renderProductGrid();
    };
  }

  renderDetail(product) {
    const container = document.getElementById('product-detail');
    const step = this.currentBundle.steps[this.currentStep];
    const isLastStep = this.currentStep === this.currentBundle.steps.length - 1;

    if (!product) {
      container.innerHTML = `<p class="bundle-product-detail__empty">
        Select a product to see details</p>`;
      return;
    }

    // Variants for size selection
    const variants = product.variants || [];
    const sizesHTML = variants.map(v => `
      <button class="bundle-size-btn" data-variant-id="${v.id}" 
              data-variant-title="${v.title}">
        ${v.title}
      </button>
    `).join('');

    const btnLabel = isLastStep ? 'GO TO CHECKOUT' : 'GO TO NEXT STEP';
    const confirmLabel = isLastStep ? 'GO TO CHECKOUT' : 'CONFIRM SELECTION';

    container.innerHTML = `
      <h3 class="bundle-product-detail__title">${product.title}</h3>
      <p class="bundle-product-detail__desc">
        ${product.body_html?.replace(/<[^>]*>/g, '').slice(0, 120) || ''}
      </p>
      <div class="bundle-product-detail__sizes">
        <p class="bundle-size-label">WHAT'S MY SIZE?</p>
        <div class="bundle-sizes">${sizesHTML}</div>
      </div>
      <button class="bundle-confirm-btn" id="confirm-btn" disabled>
        ${confirmLabel}
      </button>
      <button class="bundle-back-btn" id="back-btn">GO BACK</button>
    `;

    // Size selection
    let selectedVariantId = null;
    let selectedVariantTitle = null;

    container.querySelectorAll('.bundle-size-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.bundle-size-btn')
          .forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedVariantId = btn.dataset.variantId;
        selectedVariantTitle = btn.dataset.variantTitle;
        document.getElementById('confirm-btn').disabled = false;
      });
    });

    // Confirm
    document.getElementById('confirm-btn').addEventListener('click', () => {
      if (!selectedVariantId) return;

      this.selectedProducts[this.currentStep] = {
        product,
        variantId: selectedVariantId,
        variantTitle: selectedVariantTitle,
        bundlePrice: step.bundle_price
      };

      this.updateSummary();

      if (isLastStep) {
        this.goToCheckout();
      } else {
        this.loadStep(this.currentStep + 1);
      }
    });

    // Back
    document.getElementById('back-btn').addEventListener('click', () => {
      if (this.currentStep > 0) {
        this.loadStep(this.currentStep - 1);
      } else {
        // Back to bundle list
        document.getElementById('bundle-list').style.display = 'block';
        document.getElementById('bundle-flow').style.display = 'none';
      }
    });
  }

  updateSummary() {
    let rrp = 0;
    let yourPrice = 0;

    this.selectedProducts.forEach((sel, i) => {
      if (!sel) return;
      const variant = sel.product.variants.find(
        v => v.id == sel.variantId
      );
      rrp += variant ? parseFloat(variant.price) : 0;
      yourPrice += sel.bundlePrice;
    });

    const savings = rrp - yourPrice;

    document.getElementById('summary-rrp').textContent =
      '৳' + rrp.toLocaleString();
    document.getElementById('summary-price').textContent =
      '৳' + yourPrice.toLocaleString();
    document.getElementById('summary-savings').textContent =
      '৳' + savings.toLocaleString();

    // Render thumbnails of selected items
    const thumbContainer = document.getElementById('summary-items');
    thumbContainer.innerHTML = '';
    this.selectedProducts.forEach(sel => {
      if (!sel) return;
      const img = sel.product.images[0]?.src || '';
      const thumb = document.createElement('img');
      thumb.src = img;
      thumb.className = 'bundle-summary__thumb';
      thumb.alt = sel.product.title;
      thumbContainer.appendChild(thumb);
    });
  }

  async goToCheckout() {
    /*
      Part 4 — Backend pricing via Draft Orders API.
      We send selected products + bundle prices to our
      backend endpoint which creates a Draft Order with
      overridden line item prices, then redirects to
      the draft order checkout URL.
    */
    const lineItems = this.selectedProducts.map(sel => ({
      variant_id: parseInt(sel.variantId),
      quantity: 1,
      price: sel.bundlePrice.toString()
    }));

    try {
      const response = await fetch('/apps/bundle-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ line_items: lineItems })
      });

      const data = await response.json();

      if (data.checkout_url) {
        window.location.href = data.checkout_url;
      } else {
        // Fallback — add to cart normally if backend not available
        await this.addToCartFallback();
      }
    } catch (e) {
      // Backend not available — use cart fallback
      await this.addToCartFallback();
    }
  }

  async addToCartFallback() {
    /*
      Fallback when Draft Orders backend isn't available.
      Adds items to cart normally — prices won't be
      overridden but the bundle flow still works for demo.
    */
    const items = this.selectedProducts.map(sel => ({
      id: parseInt(sel.variantId),
      quantity: 1,
      properties: {
        'Bundle Price': '৳' + sel.bundlePrice,
        'Bundle': this.currentBundle.title
      }
    }));

    await fetch('/cart/add.js', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items })
    });

    window.location.href = '/cart';
  }

  showError(msg) {
    document.getElementById('products-grid').innerHTML =
      `<p style="color:red;">${msg}</p>`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new BundleBuilder();
});