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
    this.injectFlavourInput();
  }

 injectFlavourInput() {
  /*
    We intercept Dawn's fetch to /cart/add.js and inject
    the flavour property into the request body.
  */
  const originalFetch = window.fetch;
  window.fetch = async (url, options, ...args) => {
    if (
      typeof url === 'string' &&
      url.includes('/cart/add') &&
      options?.body &&
      this.flavoursApplied &&
      this.selectedFlavours.length > 0
    ) {
      try {
        const body = JSON.parse(options.body);
        body.properties = body.properties || {};
        body.properties['Flavours'] = this.selectedFlavours.join(', ');
        options = { ...options, body: JSON.stringify(body) };
      } catch (e) {
        // Body wasn't JSON, leave it alone
      }
    }
    return originalFetch(url, options, ...args);
  };
}

  hideButtons() {
    /*
      Hide Add to Cart and Buy Now until flavours are applied.
      Uses a wrapper approach so we don't break Dawn's JS.
    */
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
    /*
      Enable Add to Cart and Buy Now after flavours applied.
    */
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

    // Reset when variant changes — must reselect flavours
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

    const allCheckboxes = document.querySelectorAll('.flavour-checkbox');
    allCheckboxes.forEach(cb => {
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

  applyFlavours() {
  if (this.selectedFlavours.length === 0) return;

  const flavourString = this.selectedFlavours.join(', ');

  // Update trigger button label
  const triggerLabel = document.getElementById('flavour-trigger-label');
  if (triggerLabel) triggerLabel.textContent = `— ${flavourString}`;

  this.flavoursApplied = true;
  this.closeModal();
  this.enableButtons();
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

    // Clear hidden input
    // const input = document.getElementById('flavour-property-input');
    // if (input) input.value = '';

    // Clear trigger label
    const triggerLabel = document.getElementById('flavour-trigger-label');
    if (triggerLabel) triggerLabel.textContent = '';

    document.getElementById('flavour-selected-count').textContent = '0';
    const applyBtn = document.getElementById('flavour-apply-btn');
    if (applyBtn) applyBtn.disabled = true;

    // Hide buttons again since flavours reset
    this.hideButtons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  new FlavourModal();
});