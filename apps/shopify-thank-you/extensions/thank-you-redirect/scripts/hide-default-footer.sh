#!/bin/bash
# Hide the default checkout footer to replace the "Continue shopping" button
# REQUIRES: Shopify Plus plan
#
# This script uses the Shopify CLI to run a GraphQL mutation that hides
# the default footer on checkout and thank you pages.
#
# Usage:
#   ./hide-default-footer.sh
#
# Prerequisites:
#   1. Run `shopify auth login` first
#   2. Ensure you have access to a Shopify Plus store

set -e

echo "Fetching checkout profile ID..."

# First, get the checkout profile ID
PROFILE_QUERY='
query {
  checkoutProfiles(first: 1, query: "is_published:true") {
    nodes {
      id
      name
      isPublished
    }
  }
}
'

# Run the query to get profile ID
PROFILE_RESULT=$(npx shopify app function run --query "$PROFILE_QUERY" 2>/dev/null || echo "")

if [ -z "$PROFILE_RESULT" ]; then
  echo ""
  echo "Could not auto-fetch profile ID. Please run manually in your Shopify admin GraphiQL:"
  echo ""
  echo "Step 1: Get your checkout profile ID"
  echo "======================================="
  cat << 'EOF'
query {
  checkoutProfiles(first: 1, query: "is_published:true") {
    nodes {
      id
      name
    }
  }
}
EOF
  echo ""
  echo "Step 2: Hide the default footer"
  echo "================================"
  echo "Replace CHECKOUT_PROFILE_ID with the id from step 1:"
  echo ""
  cat << 'EOF'
mutation hideCheckoutFooter($checkoutProfileId: ID!) {
  checkoutBrandingUpsert(
    checkoutProfileId: $checkoutProfileId
    checkoutBrandingInput: {
      customizations: {
        footer: {
          visibility: HIDDEN
        }
      }
    }
  ) {
    checkoutBranding {
      customizations {
        footer {
          visibility
        }
      }
    }
    userErrors {
      field
      message
    }
  }
}
EOF
  echo ""
  echo "Variables:"
  echo '{"checkoutProfileId": "gid://shopify/CheckoutProfile/YOUR_ID"}'
  echo ""
  echo "Run this in: Settings > Checkout > Customize checkout > ... > Edit code > GraphiQL"
  echo "Or use the Shopify Admin API GraphiQL app"
fi
