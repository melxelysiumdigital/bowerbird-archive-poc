import '@shopify/ui-extensions/preact';
import { render } from 'preact';

/**
 * Extract headless_origin from shopify global (cart attributes or line item attributes).
 */
function getHeadlessOrigin() {
  const attributes = shopify.attributes?.current;
  if (attributes) {
    for (const attr of attributes) {
      if (attr.key === 'headless_origin' && attr.value) return attr.value;
    }
  }

  const lines = shopify.lines?.current;
  if (lines) {
    for (const line of lines) {
      if (line.attributes) {
        for (const attr of line.attributes) {
          if (attr.key === 'headless_origin' && attr.value) return attr.value;
        }
      }
    }
  }

  return null;
}

// Block target — renders where merchant places it in checkout editor
export default function main() {
  const settings = shopify.settings?.current || {};
  const headlessOrigin = getHeadlessOrigin();

  const confirmation = shopify.orderConfirmation?.current;
  const orderId = confirmation?.order?.id;
  const orderNumber = confirmation?.number;

  const returnUrl = headlessOrigin || settings.return_url || 'http://localhost:3000';
  const params = new URLSearchParams({ status: 'complete' });
  if (orderId) params.set('order_id', orderId);
  if (orderNumber) params.set('order_number', String(orderNumber));
  const redirectUrl = `${returnUrl}/thank-you?${params.toString()}`;

  console.log('[TY-REDIRECT] Block render | origin:', headlessOrigin, '| redirect:', redirectUrl);

  const buttonText = settings.button_text || 'Continue to Your Order';

  // Only show if customer came from headless storefront
  if (!headlessOrigin) {
    console.log('[TY-REDIRECT] No headless_origin, skipping block render');
    return;
  }

  render(
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        <s-heading>Thank you for your order!</s-heading>
        <s-text>We've received your order and will begin processing it shortly.</s-text>

        {orderNumber && <s-text emphasis="bold">Order #{orderNumber}</s-text>}

        <s-text>Click below to return to the collection and view your order details.</s-text>
        <s-button variant="primary" href={redirectUrl}>
          {buttonText}
        </s-button>
      </s-stack>
    </s-box>,
    document.body,
  );
}

// Footer target — replaces "Continue shopping" with headless redirect
export function thankYouFooter() {
  const settings = shopify.settings?.current || {};
  const headlessOrigin = getHeadlessOrigin();

  console.log('[TY-REDIRECT] Footer render | origin:', headlessOrigin);

  // Only override if customer came from headless storefront
  if (!headlessOrigin) {
    console.log('[TY-REDIRECT] No headless_origin, skipping footer render');
    return;
  }

  const redirectUrl = `${headlessOrigin}?status=complete`;
  const buttonText = settings.button_text || 'Continue Shopping';

  render(
    <s-stack direction="inline" blockAlignment="center" inlineAlignment="center" padding="base">
      <s-link href={redirectUrl}>{buttonText}</s-link>
    </s-stack>,
    document.body,
  );
}
