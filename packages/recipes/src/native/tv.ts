import { createTV } from 'tailwind-variants';

/**
 * tv() for React Native (Uniwind). RN cannot pick the weight of a custom font, so every weight is its own
 * font family (`font-sans-semibold` …) – tailwind-merge has to treat them as one group.
 */
export const tv = createTV({
    twMergeConfig: {
        extend: {
            classGroups: {
                'font-family': [{ font: ['sans', 'sans-medium', 'sans-semibold', 'sans-bold', 'mono'] }],
            },
        },
    },
});

/**
 * Shared by all pressable controls. RN has no hover; `active:` is the pressed state.
 * Keyboard focus (web, external keyboards) gets the same visible ring as on the web.
 */
export const pressable =
    'active:opacity-80 disabled:opacity-40 web:focus-visible:outline-2 web:focus-visible:outline-offset-2 web:focus-visible:outline-fg';
