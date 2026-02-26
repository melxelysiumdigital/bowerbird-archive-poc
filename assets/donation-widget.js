if (!customElements.get('donation-widget')) {
  customElements.define(
    'donation-widget',
    class DonationWidget extends HTMLElement {
      constructor() {
        super();
        this.selectedAmount = null;
        this.selectedVariantId = null;
        this.isCustom = false;
      }

      connectedCallback() {
        this.addEventListener('click', this.onClick.bind(this));
        this.addEventListener('input', this.onInput.bind(this));
      }

      // Use event delegation so it works after AJAX cart updates
      onClick(event) {
        const amountBtn = event.target.closest('.donation-widget__amount-btn');
        if (amountBtn) {
          this.onAmountClick(amountBtn);
          return;
        }

        const submitBtn = event.target.closest('.donation-widget__submit');
        if (submitBtn) {
          this.onSubmit();
        }
      }

      onInput(event) {
        if (event.target.closest('.donation-widget__input')) {
          this.onCustomInput();
        }
      }

      onAmountClick(btn) {
        const amount = btn.dataset.amount;

        this.querySelectorAll('.donation-widget__amount-btn').forEach((b) =>
          b.setAttribute('aria-pressed', 'false'),
        );
        btn.setAttribute('aria-pressed', 'true');

        this.selectedVariantId = btn.dataset.variantId;
        this.isCustom = amount === 'custom';

        const customInputWrapper = this.querySelector('.donation-widget__custom-input');
        const customInput = this.querySelector('.donation-widget__input');

        if (this.isCustom) {
          customInputWrapper.hidden = false;
          customInput.focus();
          this.selectedAmount = customInput.value ? parseFloat(customInput.value) : null;
        } else {
          customInputWrapper.hidden = true;
          this.selectedAmount = parseFloat(amount);
        }

        this.updateSubmitState();
        this.hideError();
      }

      onCustomInput() {
        const customInput = this.querySelector('.donation-widget__input');
        const val = parseFloat(customInput.value);
        this.selectedAmount = isNaN(val) || val < 1 ? null : val;
        this.updateSubmitState();
      }

      updateSubmitState() {
        const submitButton = this.querySelector('.donation-widget__submit');
        const enabled = this.selectedVariantId && this.selectedAmount && this.selectedAmount >= 1;
        submitButton.disabled = !enabled;
      }

      async onSubmit() {
        const submitButton = this.querySelector('.donation-widget__submit');
        if (!submitButton || submitButton.disabled) return;
        if (submitButton.getAttribute('aria-disabled') === 'true') return;

        this.hideError();
        this.setLoading(true);

        const body = {
          items: [
            {
              id: parseInt(this.selectedVariantId, 10),
              quantity: 1,
            },
          ],
        };

        if (this.isCustom) {
          body.items[0].properties = {
            _donation_amount: String(this.selectedAmount),
            'Donation Amount': '$' + this.selectedAmount,
          };
        }

        try {
          const response = await fetch(Theme.routes.cart_add_url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
            },
            body: JSON.stringify(body),
          });

          if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            this.showError(err.description || err.message || 'Could not add donation.');
            this.setLoading(false);
            return;
          }

          const data = await response.json();

          // Dispatch cart:update event so Horizon refreshes the cart drawer/page inline
          // After this, the widget may be removed from the DOM (donation now in cart)
          const event = new Event('cart:update', { bubbles: true });
          event.detail = {
            resource: data,
            sourceId: 'donation-widget',
            data: { source: 'donation-widget', itemCount: 1 },
          };
          document.dispatchEvent(event);
        } catch (e) {
          console.error('Donation widget error:', e);
          // Widget may have been removed from DOM by cart re-render — that's fine
          if (this.isConnected) {
            this.showError('Something went wrong. Please try again.');
            this.setLoading(false);
          }
        }
      }

      setLoading(loading) {
        const submitButton = this.querySelector('.donation-widget__submit');
        const submitText = this.querySelector('.donation-widget__submit-text');
        const spinner = this.querySelector('.donation-widget__spinner');
        if (!submitButton) return;
        submitButton.classList.toggle('loading', loading);
        submitButton.setAttribute('aria-disabled', String(loading));
        if (spinner) spinner.hidden = !loading;
        if (submitText) submitText.style.visibility = loading ? 'hidden' : '';
      }

      showError(message) {
        const errorEl = this.querySelector('.donation-widget__error');
        if (!errorEl) return;
        errorEl.textContent = message;
        errorEl.hidden = false;
      }

      hideError() {
        const errorEl = this.querySelector('.donation-widget__error');
        if (!errorEl) return;
        errorEl.textContent = '';
        errorEl.hidden = true;
      }
    },
  );
}
