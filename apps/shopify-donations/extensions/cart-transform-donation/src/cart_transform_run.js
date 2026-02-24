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
    const donationAttr = line.donationAmount;
    if (!donationAttr?.value) continue;

    const amount = parseFloat(donationAttr.value);
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

  return { operations };
}