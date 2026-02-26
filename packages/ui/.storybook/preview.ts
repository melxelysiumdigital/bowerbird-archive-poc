import type { Preview } from '@storybook/react';

import '../src/styles/globals.css';

const preview: Preview = {
  tags: ['autodocs', 'a11y-test'],
  initialGlobals: {
    viewport: { value: undefined },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
