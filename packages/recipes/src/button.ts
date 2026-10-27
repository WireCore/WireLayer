import { pressable, tv } from './tv.js';

export type Size = 'sm' | 'md' | 'lg';
/** Button sizes: `xs` (24px, the minimum target size of WCAG 2.5.8) for dense toolbars and tables */
export type ButtonSize = 'xs' | Size;
export type ButtonVariant =
    | 'primary'
    | 'secondary'
    | 'success'
    | 'info'
    | 'warn'
    | 'danger'
    | 'outline'
    | 'text'
    | 'soft'
    | 'inverted'
    | 'link';
export type IconButtonVariant = Exclude<ButtonVariant, 'link'>;
/**
 * Colour of a button, combined with its style: with `outline`, `text`, `soft` and `link` it colours that style
 * ("danger as a text button"), with a filled variant (the default `primary` …) it replaces the fill.
 */
export type ButtonColor = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger' | 'contrast';
/** Corner shape: `pill` (default), `rounded` or `square` */
export type ButtonShape = 'pill' | 'rounded' | 'square';

/**
 * The recipe key of a colour. The values carry a `color` prefix because the generated CSS classes must be unique per
 * recipe (`.wc-button-danger` is the filled variant, `.wc-button-color-danger` the colour).
 */
export type ButtonColorKey = `color${Capitalize<ButtonColor>}`;
export const buttonColorKey = (color: ButtonColor | undefined): ButtonColorKey | undefined =>
    color && (`color${color[0]!.toUpperCase()}${color.slice(1)}` as ButtonColorKey);

const colors: Record<IconButtonVariant, string> = {
    primary: 'bg-primary text-on-primary hover:opacity-85',
    secondary: 'bg-line text-fg hover:bg-line-2',
    success: 'bg-success text-on-success hover:opacity-85',
    // Info and warn fade less on hover: at 85 % their text would drop below 4.5:1 (see the token contrast test)
    info: 'bg-info text-on-info hover:opacity-90',
    warn: 'bg-warn text-on-warn hover:opacity-90',
    danger: 'bg-danger text-on-danger hover:opacity-85',
    outline: 'border border-line-2 text-fg hover:border-fg',
    text: 'text-fg hover:bg-line',
    /** Tinted background in the primary colour (or the `color`) */
    soft: 'bg-primary/10 text-primary hover:bg-primary/14',
    /** On inverted (fg) surfaces, e.g. the CTA section */
    inverted: 'bg-bg text-fg hover:opacity-85',
};

type FilledVariant = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger';
const filled: FilledVariant[] = ['primary', 'secondary', 'success', 'info', 'warn', 'danger'];

/** Colour × style: the fill replaces the variant's own one, outline/text/soft/link take the colour as text colour */
const colorStyles: Record<
    ButtonColorKey,
    { filled: string; outline: string; text: string; soft: string; link: string }
> = {
    colorPrimary: {
        filled: 'bg-primary text-on-primary hover:bg-primary hover:opacity-85',
        outline: 'border-primary text-primary hover:border-primary hover:bg-primary/8',
        text: 'text-primary hover:bg-primary/8',
        soft: 'bg-primary/10 text-primary hover:bg-primary/14',
        link: 'text-primary',
    },
    colorSecondary: {
        filled: 'bg-line text-fg hover:bg-line-2 hover:opacity-100',
        outline: 'border-line-2 text-muted hover:border-fg hover:text-fg',
        text: 'text-muted hover:bg-line hover:text-fg',
        soft: 'bg-line text-fg hover:bg-line-2',
        link: 'text-muted hover:text-fg',
    },
    colorSuccess: {
        filled: 'bg-success text-on-success hover:bg-success hover:opacity-85',
        outline: 'border-success text-success hover:border-success hover:bg-success/8',
        text: 'text-success hover:bg-success/8',
        soft: 'bg-success/10 text-success hover:bg-success/14',
        link: 'text-success',
    },
    colorInfo: {
        filled: 'bg-info text-on-info hover:bg-info hover:opacity-90',
        outline: 'border-info text-info hover:border-info hover:bg-info/8',
        text: 'text-info hover:bg-info/8',
        soft: 'bg-info/10 text-info hover:bg-info/14',
        link: 'text-info',
    },
    colorWarn: {
        filled: 'bg-warn text-on-warn hover:bg-warn hover:opacity-90',
        outline: 'border-warn text-warn hover:border-warn hover:bg-warn/8',
        text: 'text-warn hover:bg-warn/8',
        soft: 'bg-warn/10 text-warn hover:bg-warn/14',
        link: 'text-warn',
    },
    colorDanger: {
        filled: 'bg-danger text-on-danger hover:bg-danger hover:opacity-85',
        outline: 'border-danger text-danger hover:border-danger hover:bg-danger/8',
        text: 'text-danger hover:bg-danger/8',
        soft: 'bg-danger/10 text-danger hover:bg-danger/14',
        link: 'text-danger',
    },
    colorContrast: {
        filled: 'bg-fg text-bg hover:bg-fg hover:opacity-85',
        outline: 'border-fg text-fg hover:border-fg hover:bg-line',
        text: 'text-fg hover:bg-line',
        soft: 'bg-fg/10 text-fg hover:bg-fg/14',
        link: 'text-fg',
    },
};

const colorEntries = Object.entries(colorStyles) as [ButtonColorKey, (typeof colorStyles)[ButtonColorKey]][];

/** Compound variants for every colour × style (Button and IconButton) */
const colorCompounds = () =>
    colorEntries.flatMap(([color, styles]) => [
        { variant: filled, color, class: { base: styles.filled } },
        { variant: 'outline' as const, color, class: { base: styles.outline } },
        { variant: 'text' as const, color, class: { base: styles.text } },
        { variant: 'soft' as const, color, class: { base: styles.soft } },
    ]);

const colorKeys = Object.fromEntries(Object.keys(colorStyles).map((key) => [key, {}])) as Record<
    ButtonColorKey,
    object
>;

export const button = tv({
    slots: {
        base: [
            'inline-flex shrink-0 items-center justify-center rounded-full font-semibold whitespace-nowrap',
            ...pressable,
        ],
        icon: 'shrink-0',
        /** Counter after the label, e.g. unread messages */
        badge: [
            'inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1',
            'font-mono text-[10px] leading-none text-on-danger forced-colors:border',
        ],
        /** Dot without a number */
        dot: 'size-2 shrink-0 rounded-full bg-danger forced-colors:bg-[CanvasText]',
        /** Name of the badge for assistive tech ("4 new") */
        badgeLabel: 'sr-only',
    },
    variants: {
        variant: {
            primary: { base: colors.primary },
            secondary: { base: colors.secondary },
            success: { base: colors.success },
            info: { base: colors.info },
            warn: { base: colors.warn },
            danger: { base: colors.danger },
            outline: { base: colors.outline },
            text: { base: colors.text },
            soft: { base: colors.soft },
            inverted: { base: colors.inverted },
            link: { base: 'text-fg hover:opacity-70' },
        },
        /** Colour combined with the variant (see ButtonColor); the classes come from the compound variants */
        color: colorKeys,
        size: {
            xs: { base: 'h-6 gap-1 px-2.5 text-xs', icon: 'size-3' },
            sm: { base: 'h-[var(--wc-control-h-sm,2rem)] gap-1 px-3 text-[13px]', icon: 'size-3.5' },
            md: { base: 'h-[var(--wc-control-h-md,2.5rem)] gap-1.5 px-4 text-sm', icon: 'size-4' },
            lg: { base: 'h-[var(--wc-control-h-lg,3rem)] gap-2 px-5.5 text-[15px]', icon: 'size-[18px]' },
        },
        shape: {
            pill: {},
            rounded: { base: 'rounded-[var(--wc-button-radius,0.5rem)]' },
            square: { base: 'rounded-none' },
        },
        /** Full width of its container */
        block: {
            true: { base: 'flex w-full' },
        },
    },
    compoundVariants: [
        { variant: 'text', size: 'xs', class: { base: 'px-2' } },
        { variant: 'text', size: 'sm', class: { base: 'px-2.5' } },
        { variant: 'text', size: 'md', class: { base: 'px-3' } },
        { variant: 'text', size: 'lg', class: { base: 'px-4' } },
        { shape: 'rounded', size: 'xs', class: { base: 'rounded-md' } },
        {
            variant: 'link',
            class: {
                // min-h-6: 24px target size (WCAG 2.5.8)
                base: 'h-auto min-h-6 gap-1 rounded-none border-b border-current px-0 pb-px forced-colors:border-0 forced-colors:border-b',
                icon: 'size-3.5',
            },
        },
        ...colorCompounds(),
        ...colorEntries.map(([color, styles]) => ({ variant: 'link' as const, color, class: { base: styles.link } })),
    ],
    defaultVariants: {
        variant: 'primary',
        size: 'md',
        shape: 'pill',
    },
});

export const iconButton = tv({
    slots: {
        base: ['relative inline-flex shrink-0 items-center justify-center rounded-full', ...pressable],
        icon: 'shrink-0',
        /** Counter in the top-right corner, e.g. unread notifications */
        badge: [
            'pointer-events-none absolute -top-[3px] -inset-e-[3px] flex h-[18px] min-w-[18px] items-center justify-center',
            'rounded-full border-2 border-card bg-danger px-1 font-mono text-[10px] leading-none text-on-danger',
        ],
        /** Dot without a number */
        dot: 'pointer-events-none absolute top-px inset-e-px size-2.5 rounded-full border-2 border-card bg-fg',
    },
    variants: {
        variant: {
            primary: { base: colors.primary },
            secondary: { base: colors.secondary },
            success: { base: colors.success },
            info: { base: colors.info },
            warn: { base: colors.warn },
            danger: { base: colors.danger },
            outline: { base: colors.outline },
            text: { base: colors.text },
            soft: { base: colors.soft },
            inverted: { base: colors.inverted },
        },
        /** Colour combined with the variant (see ButtonColor) */
        color: colorKeys,
        size: {
            xs: { base: 'size-6', icon: 'size-3.5' },
            sm: { base: 'size-[var(--wc-control-h-sm,2rem)]', icon: 'size-3.5' },
            md: { base: 'size-[var(--wc-control-h-md,2.5rem)]', icon: 'size-[18px]' },
            lg: { base: 'size-[var(--wc-control-h-lg,3rem)]', icon: 'size-5' },
        },
        shape: {
            pill: {},
            rounded: { base: 'rounded-[var(--wc-button-radius,0.5rem)]' },
            square: { base: 'rounded-none' },
        },
    },
    compoundVariants: [{ shape: 'rounded', size: 'xs', class: { base: 'rounded-md' } }, ...colorCompounds()],
    defaultVariants: {
        variant: 'outline',
        size: 'md',
        shape: 'pill',
    },
});

/** Buttons joined into one control: the borders overlap, only the outer corners stay round */
export const buttonGroup = tv({
    base: [
        'inline-flex items-stretch',
        // !important: the corners win over the buttons' own shape/size variants (in @wirecore/wirelayer-css those carry more
        // specificity than a child selector) – like InputGroup
        '[&>*]:relative [&>*:focus-visible]:z-[1] [&>*:hover]:z-[1]',
    ],
    variants: {
        orientation: {
            horizontal: [
                '[&>*:not(:first-child)]:rounded-s-none! [&>*:not(:last-child)]:rounded-e-none!',
                '[&>*:not(:first-child)]:-ms-px',
            ],
            vertical: [
                'flex-col',
                '[&>*:not(:first-child)]:rounded-t-none! [&>*:not(:last-child)]:rounded-b-none!',
                '[&>*:not(:first-child)]:-mt-px',
            ],
        },
        /** Stretch over the full width; the buttons share it */
        block: {
            true: 'flex w-full [&>*]:flex-1',
        },
    },
    defaultVariants: {
        orientation: 'horizontal',
    },
});
