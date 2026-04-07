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

/**
 * Check if request items were submitted alongside this checkout.
 * Reads from cookie set by the headless-redirect Liquid script.
 */
function checkForRequestItems() {
  const attributes = shopify.attributes?.current;
  if (attributes) {
    for (const attr of attributes) {
      if (attr.key === 'has_request_items' && attr.value === 'true') return true;
    }
  }
  return false;
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

  console.log('[TY-REDIRECT] Block render | origin:', headlessOrigin, '| returnUrl:', returnUrl, '| redirect:', redirectUrl);
  console.log('[TY-REDIRECT] attributes:', JSON.stringify(shopify.attributes?.current));
  console.log('[TY-REDIRECT] settings:', JSON.stringify(settings));

  const buttonText = settings.button_text || 'Continue to Your Order';

  const ordersUrl = `${returnUrl}/account/orders?tab=digitisation`;
  const hasRequestItems = checkForRequestItems();

  console.log('[TY-REDIRECT] hasRequestItems (cookie):', hasRequestItems);

  render(
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        <s-heading>Thank you for your order!</s-heading>
        <s-text>We've received your order and will begin processing it shortly.</s-text>

        {orderNumber && <s-text type="strong">Order #{orderNumber}</s-text>}

        <s-text>Click below to return to the collection and view your order details.</s-text>
        <s-button variant="primary" href={redirectUrl}>
          {buttonText}
        </s-button>

        {hasRequestItems && (
          <s-box padding="base" border="base" borderRadius="base">
            <s-stack gap="tight">
              <s-text type="strong">You also submitted copy quote requests</s-text>
              <s-text>
                Some items in your cart require custom quoting and have been submitted separately.
                Our team will review them and contact you directly with a quote.
              </s-text>
              <s-button variant="secondary" href={ordersUrl}>
                View Copy Quote Requests
              </s-button>
            </s-stack>
          </s-box>
        )}
      </s-stack>
    </s-box>,
    document.body,
  );
}

// Footer target — replaces "Continue shopping" with headless redirect
export function thankYouFooter() {
  const settings = shopify.settings?.current || {};
  const headlessOrigin = getHeadlessOrigin();

  const returnUrl = headlessOrigin || settings.return_url || 'http://localhost:3000';
  console.log('[TY-REDIRECT] Footer render | origin:', headlessOrigin, '| returnUrl:', returnUrl);

  const redirectUrl = `${returnUrl}?status=complete`;
  const buttonText = settings.button_text || 'Continue Shopping';

  render(
    <s-stack direction="inline" alignItems="center" justifyContent="center" padding="base">
      <s-link href={redirectUrl}>{buttonText}</s-link>
    </s-stack>,
    document.body,
  );
}
