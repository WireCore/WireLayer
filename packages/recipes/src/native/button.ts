import type { ButtonColorKey, ButtonVariant, IconButtonVariant } from '../button.js';
import { pressable, tv } from './tv.js';

// Text does not inherit in React Native: every variant colours the label and the icon itself.
const colors: Record<IconButtonVariant, { base: string; label: string; icon: string }> = {
    primary: { base: 'bg-primary', label: 'text-on-primary', icon: 'text-on-primary' },
    secondary: { base: 'bg-line', label: 'text-fg', icon: 'text-fg' },
    success: { base: 'bg-success', label: 'text-on-success', icon: 'text-on-success' },
    info: { base: 'bg-info', label: 'text-on-info', icon: 'text-on-info' },
    warn: { base: 'bg-warn', label: 'text-on-warn', icon: 'text-on-warn' },
    danger: { base: 'bg-danger', label: 'text-on-danger', icon: 'text-on-danger' },
    outline: { base: 'border border-line-2 active:border-fg', label: 'text-fg', icon: 'text-fg' },
    text: { base: 'active:bg-line active:opacity-100', label: 'text-fg', icon: 'text-fg' },
    soft: { base: 'bg-primary/10', label: 'text-primary', icon: 'text-primary' },
    inverted: { base: 'bg-bg', label: 'text-fg', icon: 'text-fg' },
};

type FilledVariant = 'primary' | 'secondary' | 'success' | 'info' | 'warn' | 'danger';
const filled: FilledVariant[] = ['primary', 'secondary', 'success', 'info', 'warn', 'danger'];

type Paint = { base: string; label: string; icon: string };
/** Colour × style (same names as the web): the fill replaces the variant's own, the others take the colour */
const colorStyles: Record<ButtonColorKey, { filled: Paint; outline: Paint; text: Paint; soft: Paint; link: Paint }> = {
    colorPrimary: {
        filled: { base: 'bg-primary', label: 'text-on-primary', icon: 'text-on-primary' },
        outline: { base: 'border-primary active:border-primary', label: 'text-primary', icon: 'text-primary' },
        text: { base: 'active:bg-primary/8', label: 'text-primary', icon: 'text-primary' },
        soft: { base: 'bg-primary/10', label: 'text-primary', icon: 'text-primary' },
        link: { base: 'border-primary', label: 'text-primary', icon: 'text-primary' },
    },
    colorSecondary: {
        filled: { base: 'bg-line', label: 'text-fg', icon: 'text-fg' },
        outline: { base: 'border-line-2', label: 'text-muted', icon: 'text-muted' },
        text: { base: 'active:bg-line', label: 'text-muted', icon: 'text-muted' },
        soft: { base: 'bg-line', label: 'text-fg', icon: 'text-fg' },
        link: { base: 'border-muted', label: 'text-muted', icon: 'text-muted' },
    },
    colorSuccess: {
        filled: { base: 'bg-success', label: 'text-on-success', icon: 'text-on-success' },
        outline: { base: 'border-success active:border-success', label: 'text-success', icon: 'text-success' },
        text: { base: 'active:bg-success/8', label: 'text-success', icon: 'text-success' },
        soft: { base: 'bg-success/10', label: 'text-success', icon: 'text-success' },
        link: { base: 'border-success', label: 'text-success', icon: 'text-success' },
    },
    colorInfo: {
        filled: { base: 'bg-info', label: 'text-on-info', icon: 'text-on-info' },
        outline: { base: 'border-info active:border-info', label: 'text-info', icon: 'text-info' },
        text: { base: 'active:bg-info/8', label: 'text-info', icon: 'text-info' },
        soft: { base: 'bg-info/10', label: 'text-info', icon: 'text-info' },
        link: { base: 'border-info', label: 'text-info', icon: 'text-info' },
    },
    colorWarn: {
        filled: { base: 'bg-warn', label: 'text-on-warn', icon: 'text-on-warn' },
        outline: { base: 'border-warn active:border-warn', label: 'text-warn', icon: 'text-warn' },
        text: { base: 'active:bg-warn/8', label: 'text-warn', icon: 'text-warn' },
        soft: { base: 'bg-warn/10', label: 'text-warn', icon: 'text-warn' },
        link: { base: 'border-warn', label: 'text-warn', icon: 'text-warn' },
    },
    colorDanger: {
        filled: { base: 'bg-danger', label: 'text-on-danger', icon: 'text-on-danger' },
        outline: { base: 'border-danger active:border-danger', label: 'text-danger', icon: 'text-danger' },
        text: { base: 'active:bg-danger/8', label: 'text-danger', icon: 'text-danger' },
        soft: { base: 'bg-danger/10', label: 'text-danger', icon: 'text-danger' },
        link: { base: 'border-danger', label: 'text-danger', icon: 'text-danger' },
    },
    colorContrast: {
        filled: { base: 'bg-fg', label: 'text-bg', icon: 'text-bg' },
        outline: { base: 'border-fg active:border-fg', label: 'text-fg', icon: 'text-fg' },
        text: { base: 'active:bg-line', label: 'text-fg', icon: 'text-fg' },
        soft: { base: 'bg-fg/10', label: 'text-fg', icon: 'text-fg' },
        link: { base: 'border-fg', label: 'text-fg', icon: 'text-fg' },
    },
};

const colorEntries = Object.entries(colorStyles) as [ButtonColorKey, (typeof colorStyles)[ButtonColorKey]][];
const colorKeys = Object.fromEntries(colorEntries.map(([key]) => [key, {}])) as Record<ButtonColorKey, object>;
/** Compound variants for every colour × style (Button and IconButton – IconButton has no label) */
const colorCompounds = () =>
    colorEntries.flatMap(([color, styles]) => [
        { variant: filled, color, class: styles.filled },
        { variant: 'outline' as const, color, class: styles.outline },
        { variant: 'text' as const, color, class: styles.text },
        { variant: 'soft' as const, color, class: styles.soft },
    ]);
const linkCompounds = () =>
    colorEntries.map(([color, styles]) => ({ variant: 'link' as const, color, class: styles.link }));

/** Counter or dot after the label (Button) */
const badgeParts = {
    badge: 'h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1',
    badgeLabel: 'font-mono text-[10px] text-on-danger',
    dot: 'size-2 shrink-0 rounded-full bg-danger',
};

export const button = tv({
    slots: {
        base: ['shrink-0 flex-row items-center justify-center rounded-full', pressable],
        label: 'font-sans-semibold',
        icon: '',
        ...badgeParts,
    },
    variants: {
        variant: {
            ...colors,
            link: {
                base: 'h-auto min-h-6 rounded-none border-b border-fg px-0 pb-px',
                label: 'text-fg',
                icon: 'text-fg',
            },
        } satisfies Record<ButtonVariant, unknown>,
        size: {
            sm: { base: 'h-8 gap-1 px-3', label: 'text-[13px]', icon: 'size-3.5' },
            md: { base: 'h-10 gap-1.5 px-4', label: 'text-sm', icon: 'size-4' },
            lg: { base: 'h-12 gap-2 px-[22px]', label: 'text-[15px]', icon: 'size-[18px]' },
        },
        /** Colour combined with the variant (same keys as the web: colorDanger …) */
        color: colorKeys,
        /** Corner shape: pill (default), rounded or square */
        shape: {
            pill: {},
            rounded: { base: 'rounded-lg' },
            square: { base: 'rounded-none' },
        },
        /** Full width of the container */
        block: {
            true: { base: 'w-full self-stretch' },
        },
    },
    compoundVariants: [
        { variant: 'text', size: 'sm', class: { base: 'px-2.5' } },
        { variant: 'text', size: 'md', class: { base: 'px-3' } },
        { variant: 'text', size: 'lg', class: { base: 'px-4' } },
        { variant: 'link', class: { base: 'h-auto rounded-none px-0', icon: 'size-3.5' } },
        ...colorCompounds(),
        ...linkCompounds(),
    ],
    defaultVariants: {
        variant: 'primary',
        size: 'md',
        shape: 'pill',
    },
});

export const iconButton = tv({
    slots: {
        base: ['relative shrink-0 items-center justify-center rounded-full', pressable],
        icon: '',
        badge: 'absolute -top-[3px] -right-[3px] h-[18px] min-w-[18px] items-center justify-center rounded-full border-2 border-card bg-danger px-1',
        badgeLabel: 'font-mono text-[10px] text-on-danger',
        dot: 'absolute top-px right-px size-2.5 rounded-full border-2 border-card bg-fg',
    },
    variants: {
        variant: {
            primary: { base: colors.primary.base, icon: colors.primary.icon },
            secondary: { base: colors.secondary.base, icon: colors.secondary.icon },
            success: { base: colors.success.base, icon: colors.success.icon },
            info: { base: colors.info.base, icon: colors.info.icon },
            warn: { base: colors.warn.base, icon: colors.warn.icon },
            danger: { base: colors.danger.base, icon: colors.danger.icon },
            outline: { base: colors.outline.base, icon: colors.outline.icon },
            text: { base: colors.text.base, icon: colors.text.icon },
            soft: { base: colors.soft.base, icon: colors.soft.icon },
            inverted: { base: colors.inverted.base, icon: colors.inverted.icon },
        },
        size: {
            sm: { base: 'size-8', icon: 'size-3.5' },
            md: { base: 'size-10', icon: 'size-[18px]' },
            lg: { base: 'size-12', icon: 'size-5' },
        },
        color: colorKeys,
        shape: {
            pill: {},
            rounded: { base: 'rounded-lg' },
            square: { base: 'rounded-none' },
        },
    },
    compoundVariants: colorCompounds().map(({ variant, color, class: paint }) => ({
        variant,
        color,
        class: { base: paint.base, icon: paint.icon },
    })),
    defaultVariants: {
        variant: 'outline',
        size: 'md',
        shape: 'pill',
    },
});

/**
 * Buttons joined into one control (ButtonGroup): only the outer corners stay round, the borders overlap. RN has no
 * child selectors – the group passes `first`/`middle`/`last` to its buttons.
 */
export const buttonGroup = tv({
    slots: {
        base: 'flex-row items-stretch self-start',
        item: '',
    },
    variants: {
        orientation: {
            horizontal: {},
            vertical: { base: 'flex-col' },
        },
        position: {
            first: {},
            middle: { item: 'rounded-none' },
            last: {},
            only: {},
        },
        block: {
            true: { base: 'w-full self-stretch', item: 'flex-1' },
        },
    },
    compoundVariants: [
        { orientation: 'horizontal', position: 'first', class: { item: 'rounded-r-none' } },
        { orientation: 'horizontal', position: 'last', class: { item: '-ml-px rounded-l-none' } },
        { orientation: 'horizontal', position: 'middle', class: { item: '-ml-px' } },
        { orientation: 'vertical', position: 'first', class: { item: 'rounded-b-none' } },
        { orientation: 'vertical', position: 'last', class: { item: '-mt-px rounded-t-none' } },
        { orientation: 'vertical', position: 'middle', class: { item: '-mt-px' } },
    ],
    defaultVariants: {
        orientation: 'horizontal',
    },
});
