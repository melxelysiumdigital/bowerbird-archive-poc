if (!customElements.get('donation-widget')) {
  customElements.define(
    'donation-widget',
    class DonationWidget extends HTMLElement {
      constructor() {
        super();

        this.amountButtons = this.querySelectorAll('.donation-widget__amount-btn');
        this.customInputWrapper = this.querySelector('.donation-widget__custom-input');
        this.customInput = this.querySelector('.donation-widget__input');
        this.submitButton = this.querySelector('.donation-widget__submit');
        this.submitText = this.querySelector('.donation-widget__submit-text');
        this.spinner = this.querySelector('.donation-widget__spinner');
        this.errorEl = this.querySelector('.donation-widget__error');

        this.selectedAmount = null;
        this.selectedVariantId = null;
        this.isCustom = false;

        this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');

        this.bindEvents();
      }

      bindEvents() {
        this.amountButtons.forEach((btn) => {
          btn.addEventListener('click', this.onAmountClick.bind(this));
        });

        this.customInput.addEventListener('input', this.onCustomInput.bind(this));
        this.submitButton.addEventListener('click', this.onSubmit.bind(this));
      }

      onAmountClick(event) {
        const btn = event.currentTarget;
        const amount = btn.dataset.amount;

        this.amountButtons.forEach((b) => b.setAttribute('aria-pressed', 'false'));
        btn.setAttribute('aria-pressed', 'true');

        this.selectedVariantId = btn.dataset.variantId;
        this.isCustom = amount === 'custom';

        if (this.isCustom) {
          this.customInputWrapper.hidden = false;
          this.customInput.focus();
          this.selectedAmount = this.customInput.value ? parseFloat(this.customInput.value) : null;
        } else {
          this.customInputWrapper.hidden = true;
          this.selectedAmount = parseFloat(amount);
        }

        this.updateSubmitState();
        this.hideError();
      }

      onCustomInput() {
        const val = parseFloat(this.customInput.value);
        this.selectedAmount = isNaN(val) || val < 1 ? null : val;
        this.updateSubmitState();
      }

      updateSubmitState() {
        const enabled = this.selectedVariantId && this.selectedAmount && this.selectedAmount >= 1;
        this.submitButton.disabled = !enabled;
      }

      onSubmit() {
        if (this.submitButton.disabled) return;
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

        this.hideError();
        this.setLoading(true);

        const body = {
          id: parseInt(this.selectedVariantId, 10),
          quantity: 1,
        };

        if (this.isCustom) {
          body.properties = {
            _donation_amount: String(this.selectedAmount),
            'Donation Amount': '$' + this.selectedAmount,
          };
        }

        const config = fetchConfig('javascript');
        config.headers['X-Requested-With'] = 'XMLHttpRequest';
        config.headers['Content-Type'] = 'application/json';

        if (this.cart) {
          const sections = this.cart.getSectionsToRender().map((s) => s.id);
          body.sections = sections;
          body.sections_url = window.location.pathname;
        }

        config.body = JSON.stringify({ items: [body] });

        fetch(window.routes.cart_add_url, config)
          .then((response) => response.json())
          .then((response) => {
            if (response.status) {
              this.showError(response.description || response.message || 'Could not add donation.');
              return;
            }

            publish(PUB_SUB_EVENTS.cartUpdate, {
              source: 'donation-widget',
              cartData: response,
            });

            if (this.cart) {
              this.cart.renderContents(response);
            }
          })
          .catch((e) => {
            console.error(e);
            this.showError('Something went wrong. Please try again.');
          })
          .finally(() => {
            this.setLoading(false);
          });
      }

      setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.setAttribute('aria-disabled', loading);
        this.spinner.classList.toggle('hidden', !loading);
      }

      showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.hidden = false;
      }

      hideError() {
        this.errorEl.textContent = '';
        this.errorEl.hidden = true;
      }
    }
  );
}
