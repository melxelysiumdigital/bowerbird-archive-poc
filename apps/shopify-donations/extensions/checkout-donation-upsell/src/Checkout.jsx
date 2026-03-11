import { render } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import {
  useCartLines,
  useApplyCartLinesChange,
  useTotalAmount,
} from '@shopify/ui-extensions/checkout/preact';

const PRODUCT_HANDLE = 'donation';

export default function extension() {
  render(<DonationBlock />, document.body);
}

function DonationBlock() {
  const [variants, setVariants] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    shopify
      .query(
        `query DonationProduct($handle: String!) {
          product(handle: $handle) {
            variants(first: 20) {
              nodes { id title price { amount currencyCode } }
            }
          }
        }`,
        { variables: { handle: PRODUCT_HANDLE } },
      )
      .then(({ data, errors }) => {
        if (errors?.length) {
          setError('Could not load donation options.');
          return;
        }
        if (data?.product?.variants?.nodes) {
          setVariants(data.product.variants.nodes);
        }
      })
      .catch(() => setError('Could not load donation options.'));
  }, []);

  if (variants.length === 0 && !error) return null;

  const presetVariants = variants.filter((v) => parseFloat(v.price.amount) > 0);
  const zeroVariant = variants.find((v) => parseFloat(v.price.amount) === 0);
  const allVariantIds = variants.map((v) => v.id);

  return (
    <s-stack direction="block" gap="base">
      {error && <s-banner status="critical">{error}</s-banner>}
      <DonationForm
        presetVariants={presetVariants}
        zeroVariant={zeroVariant}
        allVariantIds={allVariantIds}
        onError={setError}
      />
      <RoundUpDonation zeroVariant={zeroVariant} allVariantIds={allVariantIds} />
    </s-stack>
  );
}

function DonationForm({ presetVariants, zeroVariant, allVariantIds, onError }) {
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();

  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);

  const donationInCart = cartLines.some((line) => allVariantIds.includes(line.merchandise.id));

  if (added || donationInCart) {
    return <s-banner status="success">Thank you for your donation!</s-banner>;
  }

  const canAdd = isCustom ? parseFloat(customAmount) >= 1 : !!selectedVariantId;

  async function handleAdd() {
    const variantId = isCustom ? zeroVariant?.id : selectedVariantId;
    if (!variantId) return;

    if (isCustom) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 1) {
        onError('Please enter an amount of at least $1.');
        return;
      }
    }

    setLoading(true);
    onError('');

    const attributes = isCustom
      ? [
          { key: '_donation_amount', value: customAmount },
          { key: 'Donation Amount', value: `$${customAmount}` },
        ]
      : [];

    const result = await applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: variantId,
      quantity: 1,
      ...(attributes.length > 0 && { attributes }),
    });

    setLoading(false);

    if (result.type === 'error') {
      onError('Could not add donation. Please try again.');
    } else {
      setAdded(true);
    }
  }

  return (
    <>
      <s-heading level={3}>Add a donation</s-heading>
      <s-text>Support the Bowerbird Archive with a donation.</s-text>

      <s-stack direction="inline" gap="base">
        {presetVariants.map((variant) => (
          <s-button
            key={variant.id}
            kind={selectedVariantId === variant.id && !isCustom ? 'primary' : 'secondary'}
            onClick={() => {
              setSelectedVariantId(variant.id);
              setIsCustom(false);
              setCustomAmount('');
              onError('');
            }}
          >
            ${parseFloat(variant.price.amount).toFixed(0)}
          </s-button>
        ))}
        {zeroVariant && (
          <s-button
            kind={isCustom ? 'primary' : 'secondary'}
            onClick={() => {
              setIsCustom(true);
              setSelectedVariantId(null);
              onError('');
            }}
          >
            Custom
          </s-button>
        )}
      </s-stack>

      {isCustom && (
        <s-text-field
          type="number"
          label="Custom amount ($)"
          value={customAmount}
          onInput={(e) => setCustomAmount(e.target.value)}
        />
      )}

      <s-button
        kind="primary"
        onClick={handleAdd}
        loading={loading || undefined}
        disabled={!canAdd || undefined}
      >
        Add donation
      </s-button>
    </>
  );
}

function RoundUpDonation({ zeroVariant, allVariantIds }) {
  const cartLines = useCartLines();
  const totalAmount = useTotalAmount();
  const applyCartLinesChange = useApplyCartLinesChange();
  const [loading, setLoading] = useState(false);

  if (!zeroVariant) return null;

  const hasDonation = cartLines.some((line) => allVariantIds.includes(line.merchandise.id));
  if (hasDonation) return null;

  const total = parseFloat(totalAmount.amount);
  const ceilTotal = Math.ceil(total);
  let roundUpAmount = ceilTotal - total;
  if (roundUpAmount < 0.01) roundUpAmount = 1.0;

  const targetTotal = roundUpAmount < 1 ? ceilTotal : total + 1;

  async function handleRoundUp() {
    setLoading(true);
    await applyCartLinesChange({
      type: 'addCartLine',
      merchandiseId: zeroVariant.id,
      quantity: 1,
      attributes: [
        { key: '_donation_amount', value: roundUpAmount.toFixed(2) },
        { key: 'Donation Amount', value: `$${roundUpAmount.toFixed(2)}` },
      ],
    });
    setLoading(false);
  }

  return (
    <s-button kind="secondary" onClick={handleRoundUp} loading={loading || undefined}>
      Round up to ${targetTotal.toFixed(2)} (+${roundUpAmount.toFixed(2)} donation)
    </s-button>
  );
}
