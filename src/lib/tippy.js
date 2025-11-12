import tippy from 'tippy.js';
import 'tippy.js/animations/shift-toward-subtle.css';

export const defaultOptions = {
  animation: 'shift-toward-subtle',
  theme: 'my-theme',
};

export default function (el, options = {}) {
  try {
    if (!el) {
      console.error('[createTippy] Element is null or undefined');
      return null;
    }

    el?.setAttribute('vtooltip', '');

    if (typeof tippy !== 'function') {
      console.error('[createTippy] tippy is not a function:', typeof tippy);
      return null;
    }

    const instance = tippy(el, {
      ...defaultOptions,
      ...options,
    });

    console.log('[createTippy] Created instance:', {
      hasInstance: !!instance,
      instanceType: typeof instance,
      isArray: Array.isArray(instance),
      keys: instance ? Object.keys(instance).slice(0, 5) : []
    });

    if (!instance) {
      console.error('[createTippy] tippy returned null/undefined');
    }

    return instance;
  } catch (error) {
    console.error('[createTippy] Error creating tippy instance:', error);
    return null;
  }
}
