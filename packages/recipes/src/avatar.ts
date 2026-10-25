import { pressable, tv } from './tv.js';

export type AvatarVariant = 'solid' | 'outline' | 'soft';
export type AvatarShape = 'circle' | 'square';
export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl' | '2xl';
/** Tinted background with text in the colour – every pair meets 4.5:1 (token contrast test) */
export type AvatarColor = 'primary' | 'success' | 'info' | 'warn' | 'danger';

const avatarColors: AvatarColor[] = ['primary', 'info', 'success', 'warn', 'danger'];

/**
 * Hover of a tinted avatar button: the tint goes from 14 % to 18 %, like soft buttons from /10 to /14 – more would miss
 * 4.5:1 in some themes (token contrast test)
 */
const tintHover: Record<AvatarColor, string> = {
    primary: 'hover:bg-[color-mix(in_srgb,var(--color-primary)_18%,var(--color-card))]',
    success: 'hover:bg-[color-mix(in_srgb,var(--color-success)_18%,var(--color-card))]',
    info: 'hover:bg-[color-mix(in_srgb,var(--color-info)_18%,var(--color-card))]',
    warn: 'hover:bg-[color-mix(in_srgb,var(--color-warn)_18%,var(--color-card))]',
    danger: 'hover:bg-[color-mix(in_srgb,var(--color-danger)_18%,var(--color-card))]',
};

/** The same name always gets the same colour: "Julia Klein" → "info" */
export function avatarColor(name: string): AvatarColor {
    let hash = 0;
    for (const char of name.trim().toLowerCase()) hash = (hash * 31 + char.codePointAt(0)!) | 0;
    return avatarColors[Math.abs(hash) % avatarColors.length]!;
}

export const avatar = tv({
    slots: {
        base: 'relative inline-flex shrink-0 items-center justify-center overflow-hidden font-semibold select-none',
        image: 'size-full object-cover',
        fallback: 'flex size-full items-center justify-center',
        icon: 'shrink-0',
        /** Inside a button (`as="button"`): the image that carries the name, so the button is named by it */
        content: 'flex size-full items-center justify-center',
    },
    variants: {
        variant: {
            solid: { base: 'bg-fg text-bg' },
            outline: { base: 'border border-line-2 text-fg' },
            soft: { base: 'bg-line text-fg' },
        },
        size: {
            sm: { base: 'size-8 text-xs', icon: 'size-4' },
            md: { base: 'size-10 text-sm', icon: 'size-[18px]' },
            lg: { base: 'size-12 text-base', icon: 'size-5' },
            xl: { base: 'size-16 text-xl', icon: 'size-7' },
            '2xl': { base: 'size-24 text-3xl', icon: 'size-10' },
        },
        /**
         * Tinted background (opaque, so grouped avatars do not show through) with the text in the colour; wins over
         * the variant's colours
         */
        color: {
            primary: { base: 'bg-[color-mix(in_srgb,var(--color-primary)_14%,var(--color-card))] text-primary' },
            success: { base: 'bg-[color-mix(in_srgb,var(--color-success)_14%,var(--color-card))] text-success' },
            info: { base: 'bg-[color-mix(in_srgb,var(--color-info)_14%,var(--color-card))] text-info' },
            warn: { base: 'bg-[color-mix(in_srgb,var(--color-warn)_14%,var(--color-card))] text-warn' },
            danger: { base: 'bg-[color-mix(in_srgb,var(--color-danger)_14%,var(--color-card))] text-danger' },
        },
        shape: {
            circle: { base: 'rounded-full' },
            square: {},
        },
        /** Set by AvatarGroup: inner separating border (like the design), opaque background for the overlap */
        grouped: {
            true: { base: 'border-2 border-card' },
        },
        /**
         * A button (`as="button"`), e.g. the trigger of a user menu: focus ring and hover of the IconButton with the
         * same look (see the compound variants), so triggers side by side in a bar behave alike
         */
        interactive: {
            true: { base: pressable },
        },
    },
    compoundVariants: [
        { shape: 'square', size: 'sm', class: { base: 'rounded-lg' } },
        { shape: 'square', size: 'md', class: { base: 'rounded-[10px]' } },
        { shape: 'square', size: 'lg', class: { base: 'rounded-xl' } },
        { shape: 'square', size: 'xl', class: { base: 'rounded-2xl' } },
        { shape: 'square', size: '2xl', class: { base: 'rounded-3xl' } },
        { grouped: true, variant: 'soft', class: { base: 'bg-bg-2 shadow-[inset_0_0_0_1px_var(--color-line-2)]' } },
        // Hover like IconButton: outline darkens its border, soft (bg-line) the background like `secondary`, solid
        // fades like the filled variants
        { interactive: true, variant: 'outline', class: { base: 'hover:border-fg' } },
        { interactive: true, variant: 'soft', class: { base: 'hover:bg-line-2' } },
        { interactive: true, variant: 'solid', class: { base: 'hover:opacity-85' } },
        ...avatarColors.map((color) => ({ interactive: true, color, class: { base: tintHover[color] } })),
        // A loaded image covers the background, and without a border nothing would change: a ring on hover instead
        {
            interactive: true,
            variant: ['soft', 'solid'] as AvatarVariant[],
            class: { base: 'hover:has-[img:not([hidden])]:ring-2 hover:has-[img:not([hidden])]:ring-line-2' },
        },
    ],
    defaultVariants: {
        variant: 'soft',
        size: 'md',
        shape: 'circle',
    },
});

export const avatarGroup = tv({
    slots: {
        base: 'flex items-center -space-x-2',
        more: 'relative inline-flex shrink-0 items-center justify-center rounded-full border-2 border-card bg-fg font-mono text-bg',
    },
    variants: {
        size: {
            sm: { more: 'size-8 text-[10.5px]' },
            md: { more: 'size-10 text-xs' },
            lg: { more: 'size-12 text-[13px]' },
            xl: { more: 'size-16 text-sm' },
            '2xl': { more: 'size-24 text-base' },
        },
    },
    defaultVariants: {
        size: 'sm',
    },
});
