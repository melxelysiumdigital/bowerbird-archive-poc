import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/ThankYouRedirect.jsx' {
  const shopify:
    | import('@shopify/ui-extensions/purchase.thank-you.block.render').Api
    | import('@shopify/ui-extensions/purchase.thank-you.footer.render-after').Api;
  const globalThis: { shopify: typeof shopify };
}
