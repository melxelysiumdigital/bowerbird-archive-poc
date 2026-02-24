import { useState, useEffect } from "react";
import {
  reactExtension,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  useSettings,
  BlockStack,
  InlineLayout,
  Button,
  TextField,
  Text,
  Heading,
  Banner,
} from "@shopify/ui-extensions-react/checkout";

export default reactExtension(
  "purchase.checkout.block.render",
  () => <DonationUpsell />,
);

function DonationUpsell() {
  const settings = useSettings();
  const cartLines = useCartLines();
  const applyCartLinesChange = useApplyCartLinesChange();
  const { query } = useApi();

  const [variants, setVariants] = useState([]);
  const [selectedVariantId, setSelectedVariantId] = useState(null);
  const [isCustom, setIsCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const productHandle = settings.product_handle;
  const heading = settings.heading || "Add a donation";
  const description =
    settings.description || "Support our mission with a one-time donation.";

  // Fetch donation product variants via Storefront API
  useEffect(() => {
    if (!productHandle) return;

    query(
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
    return <Banner status="success">Thank you for adding a donation!</Banner>;
  }

  const canAdd = isCustom ? parseFloat(customAmount) >= 1 : !!selectedVariantId;

  return (
    <BlockStack spacing="base">
      <Heading level={3}>{heading}</Heading>
      <Text>{description}</Text>

      {error && <Banner status="critical">{error}</Banner>}

      <InlineLayout
        columns={[
          ...presetVariants.map(() => "fill"),
          ...(zeroVariant ? ["fill"] : []),
        ]}
        spacing="base"
      >
        {presetVariants.map((variant) => (
          <Button
            key={variant.id}
            kind={selectedVariantId === variant.id ? "primary" : "secondary"}
            onPress={() => {
              setSelectedVariantId(variant.id);
              setIsCustom(false);
              setCustomAmount("");
              setError("");
            }}
          >
            ${parseFloat(variant.price.amount).toFixed(0)}
          </Button>
        ))}
        {zeroVariant && (
          <Button
            kind={isCustom ? "primary" : "secondary"}
            onPress={() => {
              setIsCustom(true);
              setSelectedVariantId(null);
              setError("");
            }}
          >
            Custom
          </Button>
        )}
      </InlineLayout>

      {isCustom && (
        <TextField
          type="number"
          label="Custom amount"
          value={customAmount}
          onChange={setCustomAmount}
        />
      )}

      <Button
        kind="primary"
        onPress={handleAddDonation}
        loading={loading}
        disabled={!canAdd}
      >
        Add donation
      </Button>
    </BlockStack>
  );
}
