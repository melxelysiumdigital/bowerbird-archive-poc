// @ts-check

/**
 * @typedef {import("../generated/api").CartTransformRunInput} CartTransformRunInput
 * @typedef {import("../generated/api").CartTransformRunResult} CartTransformRunResult
 */

/**
 * Overrides the price of cart lines that have a `_donation_amount` attribute.
 * This allows customers to specify a custom donation amount, which gets applied
 * as a fixed price per unit at checkout via the Cart Transform API.
 *
 * @param {CartTransformRunInput} input
 * @returns {CartTransformRunResult}
 */
export function cartTransformRun(input) {
  const operations = [];

  for (const line of input.cart.lines) {
    // Try hidden _donation_amount first, fall back to visible "Donation Amount"
    let rawAmount = line.donationAmount?.value;

    if (!rawAmount && line.donationDisplay?.value) {
      // Parse "$33" or "$12.50" format from the display property
      rawAmount = line.donationDisplay.value.replace(/[^0-9.]/g, "");
    }

    console.error(`Line ${line.id}: _donation_amount=${line.donationAmount?.value}, Donation Amount=${line.donationDisplay?.value}, parsed=${rawAmount}`);

    if (!rawAmount) continue;

    const amount = parseFloat(rawAmount);
    if (isNaN(amount) || amount <= 0) continue;

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        price: {
          adjustment: {
            fixedPricePerUnit: {
              amount: amount.toFixed(2),
            },
          },
        },
      },
    });
  }

  console.error("Cart Transform operations:", JSON.stringify(operations));

  return { operations };
}