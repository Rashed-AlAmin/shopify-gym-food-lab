class FlavourModal {
  constructor() {
    this.modal = document.getElementById('flavour-modal');
    if (!this.modal) return;

    this.maxCount = 3;
    this.selectedFlavours = [];
    this.currentVariantId = null;
    this.flavoursApplied = false;

    this.init();
  }

  init() {
    this.bindVariantChange();
    this.bindModalControls();
    this.bindCheckboxes();
    this.bindApply();
    this.hideButtons();
  }

  hideButtons() {
    const submitBtn = document.querySelector('.product-form__submit');
    const buyNowWrap = document.querySelector('.shopify-payment-button');

    if (submitBtn) {
      submitBtn.style.opacity = '0.3';
      submitBtn.style.pointerEvents = 'none';
      submitBtn.title = 'Please select flavours first';
      this.submitBtn = submitBtn;
    }

    if (buyNowWrap) {
      buyNowWrap.style.opacity = '0.3';
      buyNowWrap.style.pointerEvents = 'none';
      this.buyNowWrap = buyNowWrap;
    }
  }

  enableButtons() {
    if (this.submitBtn) {
      this.submitBtn.style.opacity = '';
      this.submitBtn.style.pointerEvents = '';
      this.submitBtn.title = '';
    }
    if (this.buyNowWrap) {
      this.buyNowWrap.style.opacity = '';
      this.buyNowWrap.style.pointerEvents = '';
    }
  }

  bindVariantChange() {
    const variantInput = document.querySelector('input[name="id"], select[name="id"]');

    if (variantInput) {
      this.onVariantChange(parseInt(variantInput.value));
      variantInput.addEventListener('change', (e) => {
        this.onVariantChange(parseInt(e.target.value));
      });
    }

    document.addEventListener('change', (e) => {
      if (e.target.closest('variant-radios, variant-selects')) {
        const input = document.querySelector('input[name="id"]');
        if (input) this.onVariantChange(parseInt(input.value));
      }
    });

    document.addEventListener('variant:change', (e) => {
      this.onVariantChange(e.detail?.variant?.id);
    });
  }

  onVariantChange(variantId) {
    if (!variantId) return;
    this.currentVariantId = variantId;

    const limits = window.variantFlavourLimits || {};
    this.maxCount = limits[variantId] || 3;

    document.getElementById('flavour-max-count').textContent = this.maxCount;
    document.getElementById('flavour-max-count-2').textContent = this.maxCount;

    const wrap = document.getElementById('flavour-trigger-wrap');
    if (wrap) wrap.style.display = 'block';

    this.resetSelections();
  }

  bindModalControls() {
    document.getElementById('flavour-trigger-btn')
      ?.addEventListener('click', () => this.openModal());

    document.getElementById('flavour-modal-close')
      ?.addEventListener('click', () => this.closeModal());

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.closeModal();
    });
  }

  bindCheckboxes() {
    document.querySelectorAll('.flavour-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => this.onCheckboxChange());
    });
  }

  onCheckboxChange() {
    const checked = document.querySelectorAll('.flavour-checkbox:checked');
    this.selectedFlavours = Array.from(checked).map(c => c.value);

    document.querySelectorAll('.flavour-checkbox').forEach(cb => {
      if (!cb.checked) {
        cb.disabled = checked.length >= this.maxCount;
        cb.closest('.flavour-option')?.classList.toggle(
          'flavour-option--disabled',
          checked.length >= this.maxCount
        );
      }
    });

    document.getElementById('flavour-selected-count').textContent = checked.length;

    const applyBtn = document.getElementById('flavour-apply-btn');
    if (applyBtn) applyBtn.disabled = checked.length === 0;

    document.querySelectorAll('.flavour-option').forEach(label => {
      const cb = label.querySelector('.flavour-checkbox');
      label.classList.toggle('flavour-option--selected', cb.checked);
    });
  }

  bindApply() {
    document.getElementById('flavour-apply-btn')
      ?.addEventListener('click', () => this.applyFlavours());
  }

  async applyFlavours() {
    if (this.selectedFlavours.length === 0) return;

    const flavourString = this.selectedFlavours.join(', ');
    const applyBtn = document.getElementById('flavour-apply-btn');

    // Disable button to prevent double clicks
    if (applyBtn) {
      applyBtn.disabled = true;
      applyBtn.textContent = 'Adding...';
    }

    try {
      // Check current cart state
      const cart = await fetch('/cart.js').then(r => r.json());
      const existingItem = cart.items.find(
        i => i.variant_id === this.currentVariantId
      );

      if (existingItem) {
        /*
          Item already in cart — update its properties.
          Using line number (1-based index) is most reliable.
          This REPLACES the item properties, no duplicate created.
        */
        const lineIndex = cart.items.indexOf(existingItem) + 1;
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            line: lineIndex,
            properties: { 'Flavours': flavourString }
          })
        });
      } else {
        /*
          Item not in cart yet — add it fresh with properties.
        */
        await fetch('/cart/add.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: this.currentVariantId,
            quantity: 1,
            properties: { 'Flavours': flavourString }
          })
        });
      }

      // Update trigger button label
      const triggerLabel = document.getElementById('flavour-trigger-label');
      if (triggerLabel) triggerLabel.textContent = `— ${flavourString}`;

      this.flavoursApplied = true;
      this.closeModal();

      // Hide Add to Cart — item already added via Apply
      // Show it only as "Update" option if needed
      this.enableButtons();

      // Open Dawn's cart drawer the correct way
      await this.openCartDrawer();

    } catch (err) {
      console.error('Flavour apply failed:', err);
    } finally {
      if (applyBtn) {
        applyBtn.disabled = false;
        applyBtn.textContent = 'Apply Flavours';
      }
    }
  }

 async openCartDrawer() {
  // Wait 1 second for cart to save, then reload
  // Page reload ensures cart drawer shows latest data
  await new Promise(resolve => setTimeout(resolve, 1000));
  window.location.reload();
}

  openModal() {
    this.modal.setAttribute('aria-hidden', 'false');
    this.modal.classList.add('flavour-modal-overlay--open');
    if (window.innerWidth < 768) {
      document.body.style.overflow = 'hidden';
    }
  }

  closeModal() {
    this.modal.setAttribute('aria-hidden', 'true');
    this.modal.classList.remove('flavour-modal-overlay--open');
    document.body.style.overflow = '';
  }

  resetSelections() {
    document.querySelectorAll('.flavour-checkbox').forEach(cb => {
      cb.checked = false;
      cb.disabled = false;
      cb.closest('.flavour-option')?.classList.remove(
        'flavour-option--selected',
        'flavour-option--disabled'
      );
    });

    this.selectedFlavours = [];
    this.flavoursApplied = false;

    const triggerLabel = document.getElementById('flavour-trigger-label');
    if (triggerLabel) triggerLabel.textContent = '';

    document.getElementById('flavour-selected-count').textContent = '0';
    const applyBtn = document.getElementById('flavour-apply-btn');
    if (applyBtn) applyBtn.disabled = true;

    this.hideButtons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FlavourModal();
});