// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook';

import config from '@bowerbird-poc/eslint-config/react-internal';

export default [{ ignores: ['storybook-static/'] }, ...config];
