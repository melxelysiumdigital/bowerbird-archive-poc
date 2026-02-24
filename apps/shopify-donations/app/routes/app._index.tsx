import { useEffect } from "react";
import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { useLoaderData, useFetcher } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

const CART_TRANSFORM_QUERY = `#graphql
  query {
    cartTransforms(first: 10) {
      nodes {
        id
        functionId
        blockOnFailure
      }
    }
  }
`;

const SHOPIFY_FUNCTIONS_QUERY = `#graphql
  query {
    shopifyFunctions(first: 25) {
      nodes {
        id
        title
        apiType
        app {
          title
        }
      }
    }
  }
`;

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request);

  // Check existing cart transforms
  const transformsRes = await admin.graphql(CART_TRANSFORM_QUERY);
  const transformsData = await transformsRes.json();
  const transforms = transformsData.data?.cartTransforms?.nodes ?? [];

  // Check available functions
  const functionsRes = await admin.graphql(SHOPIFY_FUNCTIONS_QUERY);
  const functionsData = await functionsRes.json();
  const functions = functionsData.data?.shopifyFunctions?.nodes ?? [];

  // Find our cart transform function
  const cartTransformFn = functions.find(
    (f: any) => f.apiType === "cart_transform",
  );

  // Check if it's already activated
  const isActivated = cartTransformFn
    ? transforms.some((t: any) => t.functionId === cartTransformFn.id)
    : false;

  return {
    transforms,
    cartTransformFunction: cartTransformFn ?? null,
    isActivated,
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  const formData = await request.formData();
  const intent = formData.get("intent");

  if (intent === "activate") {
    const functionId = formData.get("functionId") as string;
    if (!functionId) {
      return { error: "No function ID provided" };
    }

    const response = await admin.graphql(
      `#graphql
        mutation cartTransformCreate($functionId: String!) {
          cartTransformCreate(functionId: $functionId) {
            cartTransform {
              id
              functionId
            }
            userErrors {
              field
              message
            }
          }
        }`,
      { variables: { functionId } },
    );

    const data = await response.json();
    const userErrors = data.data?.cartTransformCreate?.userErrors ?? [];

    if (userErrors.length > 0) {
      return { error: userErrors.map((e: any) => e.message).join(", ") };
    }

    return {
      success: true,
      cartTransform: data.data?.cartTransformCreate?.cartTransform,
    };
  }

  return { error: "Unknown intent" };
};

export default function Index() {
  const { transforms, cartTransformFunction, isActivated } =
    useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const shopify = useAppBridge();

  const isLoading =
    ["loading", "submitting"].includes(fetcher.state) &&
    fetcher.formMethod === "POST";

  useEffect(() => {
    if (fetcher.data?.success) {
      shopify.toast.show("Cart Transform activated!");
    }
    if (fetcher.data?.error) {
      shopify.toast.show(fetcher.data.error, { isError: true });
    }
  }, [fetcher.data, shopify]);

  const activateTransform = () => {
    if (!cartTransformFunction) return;
    fetcher.submit(
      { intent: "activate", functionId: cartTransformFunction.id },
      { method: "POST" },
    );
  };

  return (
    <s-page heading="Bowerbird Donations">
      <s-section heading="Cart Transform Function">
        {!cartTransformFunction ? (
          <s-banner tone="warning">
            <s-paragraph>
              No cart transform function found. Make sure the app is deployed
              with <s-text tone="code">shopify app deploy</s-text>.
            </s-paragraph>
          </s-banner>
        ) : isActivated || fetcher.data?.success ? (
          <s-banner tone="success">
            <s-paragraph>
              Cart Transform is active. Custom donation amounts will be repriced
              at checkout.
            </s-paragraph>
          </s-banner>
        ) : (
          <s-stack direction="block" gap="base">
            <s-banner tone="warning">
              <s-paragraph>
                Cart Transform function is deployed but not activated. Custom
                donation amounts won't work until you activate it.
              </s-paragraph>
            </s-banner>
            <s-button onClick={activateTransform} loading={isLoading || undefined}>
              Activate Cart Transform
            </s-button>
          </s-stack>
        )}
      </s-section>

      <s-section heading="Setup Checklist">
        <s-ordered-list>
          <s-list-item>
            Create a donation product with preset amount variants ($5, $10, $25,
            etc.) and one $0 "Custom Amount" variant
          </s-list-item>
          <s-list-item>
            Enable donations in Theme Settings → Donation section
          </s-list-item>
          <s-list-item>
            Activate the Cart Transform above (for custom amounts)
          </s-list-item>
          <s-list-item>
            Assign the donation product to the "product.donation" template
          </s-list-item>
          <s-list-item>
            Place the checkout donation block in Settings → Checkout → Customize
          </s-list-item>
        </s-ordered-list>
      </s-section>

      <s-section slot="aside" heading="Status">
        <s-paragraph>
          <s-text fontWeight="bold">Function: </s-text>
          <s-text>
            {cartTransformFunction ? cartTransformFunction.title : "Not found"}
          </s-text>
        </s-paragraph>
        <s-paragraph>
          <s-text fontWeight="bold">Activated: </s-text>
          <s-text>
            {isActivated || fetcher.data?.success ? "Yes" : "No"}
          </s-text>
        </s-paragraph>
        <s-paragraph>
          <s-text fontWeight="bold">Active transforms: </s-text>
          <s-text>{transforms.length}</s-text>
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
