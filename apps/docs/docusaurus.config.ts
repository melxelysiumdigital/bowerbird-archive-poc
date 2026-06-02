import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
  title: 'Bowerbird Archive POC',
  tagline: 'Internal wiki — proof of concept, NOT for production',
  favicon: 'img/favicon.ico',

  future: {
    v4: true,
  },

  url: 'http://localhost',
  baseUrl: '/',

  // Not deployed — POC only.
  organizationName: 'bowerbird-archive',
  projectName: 'bowerbird-archive-poc',

  onBrokenLinks: 'warn',

  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          routeBasePath: '/',
          editUrl: undefined,
        },
        blog: false,
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    colorMode: {
      respectPrefersColorScheme: true,
    },
    announcementBar: {
      id: 'poc-warning',
      content:
        '⚠️ <strong>This is a proof of concept.</strong> Not hardened, not audited, NOT for production deployment. ⚠️',
      backgroundColor: '#7a1f1f',
      textColor: '#ffffff',
      isCloseable: false,
    },
    navbar: {
      title: 'Bowerbird Archive POC',
      logo: {
        alt: 'Bowerbird Archive POC',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'wikiSidebar',
          position: 'left',
          label: 'Wiki',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Wiki',
          items: [
            { label: 'Overview', to: '/' },
            { label: 'Getting Started', to: '/getting-started/prerequisites' },
            { label: 'Architecture', to: '/architecture/overview' },
            { label: 'Gotchas', to: '/gotchas' },
          ],
        },
        {
          title: 'POC Status',
          items: [
            { label: 'Why this is not for production', to: '/poc-status' },
          ],
        },
      ],
      copyright: `Internal POC documentation · ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ['bash', 'json', 'toml'],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
