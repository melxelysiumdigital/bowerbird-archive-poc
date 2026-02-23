import './react.css';

import { mountComponents, unmountComponents } from '@/react/mount';
import { registry } from '@/react/registry';

function mount(scope?: Element) {
  mountComponents(registry, scope);
}

// Mount immediately if DOM is already ready, otherwise wait
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => mount());
} else {
  mount();
}

// Shopify theme editor events
document.addEventListener('shopify:section:load', (e) => {
  const section = (e as CustomEvent).target as Element;
  mount(section);
});

document.addEventListener('shopify:section:unload', (e) => {
  const section = (e as CustomEvent).target as Element;
  unmountComponents(section);
});

document.addEventListener('shopify:block:select', (e) => {
  const block = (e as CustomEvent).target as Element;
  mount(block);
});

document.addEventListener('shopify:block:deselect', (e) => {
  const block = (e as CustomEvent).target as Element;
  unmountComponents(block);
});

// HMR support
if (import.meta.hot) {
  import.meta.hot.accept('@/react/registry', () => {
    mount();
  });
}
