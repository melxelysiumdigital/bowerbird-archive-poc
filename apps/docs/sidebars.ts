import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

const sidebars: SidebarsConfig = {
  wikiSidebar: [
    'intro',
    'poc-status',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'getting-started/prerequisites',
        'getting-started/install',
        'getting-started/dev-workflow',
        'getting-started/env-vars',
        'getting-started/seeding-products',
        'getting-started/seeding-workflows',
        'getting-started/installed-apps',
      ],
    },
    {
      type: 'category',
      label: 'Architecture',
      collapsed: false,
      items: [
        'architecture/overview',
        'architecture/why-monorepo',
        'architecture/headless-checkout',
        'architecture/dawn-plus-vite',
        'architecture/tailwind-cascade',
        'architecture/non-destructive-deploy',
        'architecture/deployment-ci',
      ],
    },
    {
      type: 'category',
      label: 'Apps',
      collapsed: true,
      items: [
        'apps/web',
        {
          type: 'category',
          label: 'shopify-theme',
          link: { type: 'doc', id: 'apps/shopify-theme/index' },
          collapsed: true,
          items: [
            'apps/shopify-theme/react-mount-system',
            'apps/shopify-theme/section-walkthrough',
            'apps/shopify-theme/vite-pipeline',
          ],
        },
        'apps/shopify-donations',
        'apps/shopify-thank-you',
        'apps/shopify-digitisation',
      ],
    },
    'gotchas',
    'resources',
  ],
};

export default sidebars;
