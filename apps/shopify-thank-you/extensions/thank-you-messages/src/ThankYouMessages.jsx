import '@shopify/ui-extensions/preact';
import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

function ThankYouMessage() {
  const settings = shopify.settings?.current || {};
  const targetHandle = settings.product_handle || '';
  const minAmount = Number(settings.min_amount) || 0;
  const message = settings.message || '';
  const bannerTitle = settings.banner_title || '';
  const status = settings.banner_status || 'info';
  const debug = settings.show_debug;

  const [state, setState] = useState({ loading: true, visible: false, debugInfo: '' });

  useEffect(() => {
    checkProduct();

    async function checkProduct() {
      if (!targetHandle) {
        setState({ loading: false, visible: false, debugInfo: 'No product_handle configured' });
        return;
      }

      const lines = shopify.lines?.current || [];
      if (!lines.length) {
        setState({ loading: false, visible: false, debugInfo: 'No line items found' });
        return;
      }

      const productIds = [...new Set(lines.map((l) => l.merchandise?.product?.id).filter(Boolean))];

      if (!productIds.length) {
        setState({ loading: false, visible: false, debugInfo: 'No product IDs in line items' });
        return;
      }

      try {
        const { data, errors } = await shopify.query(
          `query ProductHandles($ids: [ID!]!) {
            nodes(ids: $ids) {
              ... on Product { id handle }
            }
          }`,
          { variables: { ids: productIds } },
        );

        if (errors?.length) {
          setState({
            loading: false,
            visible: false,
            debugInfo: `GraphQL errors: ${JSON.stringify(errors)}`,
          });
          return;
        }

        const products = (data?.nodes || []).filter(Boolean);
        const handleMap = new Map(products.map((p) => [p.id, p.handle]));
        const debugProducts = JSON.stringify(Object.fromEntries(handleMap));

        // Find line items whose product handle matches the configured target
        const matchingLines = lines.filter((l) => {
          const gid = l.merchandise?.product?.id;
          return gid && handleMap.get(gid) === targetHandle;
        });

        if (!matchingLines.length) {
          setState({
            loading: false,
            visible: false,
            debugInfo: `No match for "${targetHandle}" in ${debugProducts}`,
          });
          return;
        }

        // Check minimum amount threshold if configured
        if (minAmount > 0) {
          const total = matchingLines.reduce((sum, l) => {
            return sum + parseFloat(l.cost?.totalAmount?.amount || '0');
          }, 0);

          if (total < minAmount) {
            setState({
              loading: false,
              visible: false,
              debugInfo: `Total $${total.toFixed(2)} below min $${minAmount} for "${targetHandle}"`,
            });
            return;
          }
        }

        setState({
          loading: false,
          visible: true,
          debugInfo: `Matched "${targetHandle}" in ${debugProducts}`,
        });
      } catch (err) {
        setState({ loading: false, visible: false, debugInfo: `Error: ${err.message}` });
      }
    }
  }, []);

  if (state.loading) return null;

  if (debug && state.debugInfo) {
    return (
      <s-banner status="warning" title="Thank You Messages Debug">
        <s-text>{state.debugInfo}</s-text>
        {state.visible && message && <s-text emphasis="bold">Would show: {message}</s-text>}
      </s-banner>
    );
  }

  if (!state.visible || !message) return null;

  const validStatuses = ['info', 'success', 'warning', 'critical'];
  const bannerStatus = validStatuses.includes(status) ? status : 'info';

  return (
    <s-banner status={bannerStatus} title={bannerTitle || undefined}>
      <s-text>{message}</s-text>
    </s-banner>
  );
}

export default function main() {
  render(<ThankYouMessage />, document.body);
}
