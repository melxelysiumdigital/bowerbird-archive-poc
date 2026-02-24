import "@shopify/ui-extensions/preact";
import { render } from "preact";
import { useState, useEffect } from "preact/hooks";
import {
  useCartLines,
  useApplyCartLinesChange,
} from "@shopify/ui-extensions/preact";

export default function extension() {
  render(<DonationUpsell />, document.body);
}

function DonationUpsell() {
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();

  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const productHandle = shopify.settings.value.product_handle;
  const heading = shopify.settings.value.heading || "Add a donation";
  const description =
    shopify.settings.value.description ||
    "Support our mission with a one-time donation.";

  // Fetch donation product variants via Storefront API
  useEffect(() => {
    if (!productHandle) return;

    shopify
      .query(
        `query DonationProduct($handle: String!) {
          product(handle: $handle) {
            id
            variants(first: 20) {
              nodes {
                id
                title
                price { amount currencyCode }
              }
            }
          }
        }`,
        { variables: { handle: productHandle } },
      )
      .then(({ data, errors }) => {
        if (errors?.length) {
          setError("Could not load donation options.");
          return;
        }
        if (data?.product?.variants?.nodes) {
          setVariants(data.product.variants.nodes);
        }
      })
      .catch(() => {
        setError("Could not load donation options.");
      });
  }, [productHandle]);

  // Check if a donation is already in cart
  const donationVariantIds = variants.map((v) => v.id);
  const donationInCart = cartLines.some((line) =>
    donationVariantIds.includes(line.merchandise.id),
  );

  const presetVariants = variants.filter(
    (v) => parseFloat(v.price.amount) > 0,
  );
  const zeroVariant = variants.find((v) => parseFloat(v.price.amount) === 0);

  async function handleAddDonation() {
    const variantId = isCustom ? zeroVariant?.id : selectedVariantId;
    if (!variantId) return;

    if (isCustom) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 1) {
        setError("Please enter an amount of at least $1.");
        return;
      }
    }

    setLoading(true);
    setError("");

    const attributes = isCustom
      ? [
          { key: "_donation_amount", value: customAmount },
          { key: "Donation Amount", value: `$${customAmount}` },
        ]
      : [];

    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantId,
      quantity: 1,
      ...(attributes.length > 0 && { attributes }),
    });

    setLoading(false);

    if (result.type === "error") {
      setError("Could not add donation. Please try again.");
    } else {
      setAdded(true);
    }
  }

  if (!productHandle) return null;
  if (variants.length === 0 && !error) return null;

  if (added || donationInCart) {
    return <s-banner status="success">Thank you for adding a donation!</s-banner>;
  }

  const canAdd = isCustom ? parseFloat(customAmount) >= 1 : !!selectedVariantId;

  return (
    <s-stack direction="block" gap="base">
      <s-heading level={3}>{heading}</s-heading>
      <s-text>{description}</s-text>

      {error && <s-banner status="critical">{error}</s-banner>}

      <s-stack direction="inline" gap="base">
        {presetVariants.map((variant) => (
          <s-button
            key={variant.id}
            kind={selectedVariantId === variant.id ? "primary" : "secondary"}
            onClick={() => {
              setSelectedVariantId(variant.id);
              setIsCustom(false);
              setCustomAmount("");
              setError("");
            }}
          >
            ${parseFloat(variant.price.amount).toFixed(0)}
          </s-button>
        ))}
        {zeroVariant && (
          <s-button
            kind={isCustom ? "primary" : "secondary"}
            onClick={() => {
              setIsCustom(true);
              setSelectedVariantId(null);
              setError("");
            }}
          >
            Custom
          </s-button>
        )}
      </s-stack>

      {isCustom && (
        <s-text-field
          type="number"
          label="Custom amount"
          value={customAmount}
          onInput={(e) => setCustomAmount(e.target.value)}
        />
      )}

      <s-button
        kind="primary"
        onClick={handleAddDonation}
        loading={loading || undefined}
        disabled={!canAdd || undefined}
      >
        Add donation
      </s-button>
    </s-stack>
  );
}
