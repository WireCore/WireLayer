import { createTV } from 'tailwind-variants';

/** tailwind-merge knows the custom WireLayer utilities (also used by the @wirecore/wirelayer-css generator). */
export const twMergeConfig = {
    extend: {
        classGroups: {
            'bg-image': ['bg-glow'],
            'text-gradient': ['text-gradient'],
            'label-mono': ['label-mono'],
        },
    },
};

/**
 * tv() that knows the custom WireLayer utilities, so tailwind-merge does not
 * mistake `bg-glow` for a background colour or `text-gradient` for a text colour.
 */
export const tv = createTV({ twMergeConfig });

/**
 * Shared by all pressable controls: visible focus ring (WCAG 2.4.7), disabled/busy states,
 * no transitions with reduced motion and a visible boundary in Windows high-contrast mode.
 */
export const pressable = [
    'cursor-pointer select-none transition-[opacity,background-color,border-color,color] duration-150',
    'motion-reduce:transition-none',
    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
    'disabled:cursor-not-allowed disabled:opacity-40 aria-busy:cursor-wait',
    'forced-colors:border forced-colors:border-[ButtonBorder]',
];

/**
 * Popups positioned by Ark (menu, select, tooltip): above sticky table headers and pinned columns (Ark copies the
 * z-index of the content to its positioner), and an open/close animation: fade + slight scale,
 * moving in from the side they open on. Only switched on with motion-safe (a later `animate-none` would lose
 * against the more specific data-state selector); with reduced motion Ark unmounts immediately.
 */
export const popupMotion = [
    'z-50',
    'motion-safe:data-[state=open]:animate-pop-in motion-safe:data-[state=closed]:animate-pop-out',
    'data-[side=bottom]:[--wc-pop-y:-4px] data-[side=top]:[--wc-pop-y:4px] data-[side=left]:[--wc-pop-x:4px] data-[side=right]:[--wc-pop-x:-4px]',
];

/** Focus ring for controls whose focus lands on a visually hidden input (Ark sets data-focus-visible). */
export const focusRing =
    'data-focus-visible:outline-2 data-focus-visible:outline-offset-2 data-focus-visible:outline-fg';
