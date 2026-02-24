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

        this.bindEvents();
      }

      bindEvents() {
        this.amountButtons.forEach((btn) => {
          btn.addEventListener('click', this.onAmountClick.bind(this));
        });

        if (this.customInput) {
          this.customInput.addEventListener('input', this.onCustomInput.bind(this));
        }
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

      async onSubmit() {
        if (this.submitButton.disabled) return;
        if (this.submitButton.getAttribute('aria-disabled') === 'true') return;

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

          const data = await response.json();

          if (data.status) {
            this.showError(data.description || data.message || 'Could not add donation.');
            return;
          }

          // Refresh the page to update cart state (works in both cart page and drawer contexts)
          window.location.reload();
        } catch (e) {
          console.error(e);
          this.showError('Something went wrong. Please try again.');
        } finally {
          this.setLoading(false);
        }
      }

      setLoading(loading) {
        this.submitButton.classList.toggle('loading', loading);
        this.submitButton.setAttribute('aria-disabled', String(loading));
        this.spinner.hidden = !loading;
        if (loading) this.submitText.style.visibility = 'hidden';
        else this.submitText.style.visibility = '';
      }

      showError(message) {
        this.errorEl.textContent = message;
        this.errorEl.hidden = false;
      }

      hideError() {
        this.errorEl.textContent = '';
        this.errorEl.hidden = true;
      }
    },
  );
}
