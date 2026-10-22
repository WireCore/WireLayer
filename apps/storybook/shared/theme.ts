// Mode (light/dark) and theme (color preset) for the Vue and React Storybooks.
//
// Standalone (localhost:6007 / 6008) both are Storybook globals with a toolbar menu.
// Composed into the host Storybook (localhost:6006) Storybook does not pass globals to refs,
// so the host's tools send them via postMessage and the story follows them.
import { modes, themes, type Mode } from '@wirecore/wirelayer-tokens';
import type { DecoratorFunction } from 'storybook/internal/types';

export const APPEARANCE_MESSAGE = 'wirecore:appearance';
export const APPEARANCE_REQUEST = 'wirecore:appearance-request';

export interface Appearance {
    mode: Mode;
    theme: string;
}

export const isMode = (value: unknown): value is Mode => modes.includes(value as Mode);
export const isTheme = (value: unknown): value is string => themes.some((theme) => theme.name === value);

export const appearanceGlobalTypes = {
    mode: {
        description: 'Light or dark',
        toolbar: {
            title: 'Mode',
            icon: 'contrast',
            items: [
                { value: 'dark', title: 'Dark' },
                { value: 'light', title: 'Light' },
            ],
            dynamicTitle: true,
        },
    },
    theme: {
        description: 'Color theme',
        toolbar: {
            title: 'Theme',
            icon: 'paintbrush',
            items: themes.map((theme) => ({ value: theme.name, title: theme.label })),
            dynamicTitle: true,
        },
    },
};

export const appearanceInitialGlobals: Appearance = { mode: 'dark', theme: 'wirecore' };

/** Appearance received from the host Storybook – wins over the local globals while composed. */
let host: Partial<Appearance> = {};

/** Extra handlers, e.g. the React Native Storybook switches the Uniwind theme. */
const listeners: ((appearance: Appearance) => void)[] = [];
export const onAppearance = (listener: (appearance: Appearance) => void) => listeners.push(listener);

function apply(appearance: Appearance) {
    document.documentElement.dataset.mode = appearance.mode;
    document.documentElement.dataset.theme = appearance.theme;
    listeners.forEach((listener) => listener(appearance));
}

if (typeof window !== 'undefined' && window.parent !== window) {
    window.addEventListener('message', (event: MessageEvent) => {
        if (event.data?.type !== APPEARANCE_MESSAGE) return;
        host = {
            mode: isMode(event.data.mode) ? event.data.mode : undefined,
            theme: isTheme(event.data.theme) ? event.data.theme : undefined,
        };
        apply({ mode: host.mode ?? 'dark', theme: host.theme ?? 'wirecore' });
    });
    // Ask the host for its current appearance (a standalone Storybook simply doesn't answer)
    window.parent.postMessage({ type: APPEARANCE_REQUEST }, '*');
}

export const withAppearance: DecoratorFunction = (storyFn, context) => {
    apply({
        mode: host.mode ?? (isMode(context.globals.mode) ? context.globals.mode : 'dark'),
        theme: host.theme ?? (isTheme(context.globals.theme) ? context.globals.theme : 'wirecore'),
    });
    return storyFn();
};
