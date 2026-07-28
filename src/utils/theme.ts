import type { UserSettings } from '../types';

export type Theme = UserSettings['ui']['theme'];

/**
 * Themes are CSS-native: design-system.css declares every token as a
 * `light-dark()` pair, so the only thing to do here is pin `color-scheme`
 * via `data-theme` — or remove it and let the OS decide.
 *
 * `el` is the document root on extension pages and the shadow host in the
 * content script, which is why it is a parameter rather than a lookup.
 */
export const applyTheme = (theme: Theme = 'auto', el: HTMLElement = document.documentElement) => {
    if (theme === 'auto') {
        delete el.dataset.theme;
    } else {
        el.dataset.theme = theme;
    }
};
