import { createElement, type ComponentType } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ComponentRegistry = Record<string, ComponentType<any>>;

const roots = new WeakMap<Element, Root>();

function parseProps(el: Element): Record<string, unknown> {
  const inlineJson = el.getAttribute('data-react-props');
  if (inlineJson) {
    try {
      return JSON.parse(inlineJson);
    } catch (e) {
      console.error('[react-mount] Failed to parse inline props:', e);
      return {};
    }
  }

  const scriptSelector = el.getAttribute('data-react-props-from');
  if (scriptSelector) {
    const scriptEl = document.querySelector(scriptSelector);
    if (scriptEl?.textContent) {
      try {
        return JSON.parse(scriptEl.textContent);
      } catch (e) {
        console.error('[react-mount] Failed to parse props from script:', e);
        return {};
      }
    }
  }

  return {};
}

export function mountComponents(registry: ComponentRegistry, scope?: Element): void {
  const container = scope ?? document;
  const elements = container.querySelectorAll<HTMLElement>('[data-react-component]');

  elements.forEach((el) => {
    const name = el.getAttribute('data-react-component');
    if (!name) return;

    const Component = registry[name];
    if (!Component) {
      console.warn(`[react-mount] Unknown component: "${name}"`);
      return;
    }

    if (roots.has(el)) return;

    const props = parseProps(el);
    const root = createRoot(el);
    roots.set(el, root);

    root.render(createElement(Component, props));
  });
}

export function unmountComponents(scope?: Element): void {
  const container = scope ?? document;
  const elements = container.querySelectorAll<HTMLElement>('[data-react-component]');

  elements.forEach((el) => {
    const root = roots.get(el);
    if (root) {
      root.unmount();
      roots.delete(el);
    }
  });
}
