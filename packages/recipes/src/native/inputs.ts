import { pressable, tv } from './tv.js';

// Input components for React Native: chips, codes, passwords, phone numbers, tags, ratings and colours.
// Touch targets are at least 44 pt (iOS) / 48 dp close (Android) – small visuals get a larger pressable area.

/** Standalone chip with optional icon or image and a remove button */
export const chip = tv({
    slots: {
        base: 'shrink-0 flex-row items-center self-start rounded-full border border-line-2 bg-card',
        icon: 'shrink-0 text-muted',
        avatar: 'shrink-0 rounded-full',
        label: 'shrink font-sans-medium text-fg',
        /** The pressable part of a removable chip with onPress */
        action: ['shrink flex-row items-center gap-1.5 self-stretch', pressable],
        /** 44 pt touch area around the small remove icon */
        remove: ['-my-2 size-11 items-center justify-center rounded-full', pressable],
        removeIcon: 'size-3.5 text-muted',
    },
    variants: {
        size: {
            sm: { base: 'h-7 gap-1 px-2.5', icon: 'size-3', avatar: 'size-5', label: 'text-xs' },
            md: { base: 'h-8 gap-1.5 px-3', icon: 'size-3.5', avatar: 'size-6', label: 'text-[13px]' },
            lg: { base: 'h-10 gap-2 px-4', icon: 'size-4', avatar: 'size-8', label: 'text-sm' },
        },
        removable: {
            true: { base: 'pr-0' },
        },
        withAvatar: {
            true: { base: 'pl-1' },
        },
        pressable: {
            true: { base: [pressable, 'active:bg-line active:opacity-100'] },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Strength meter and requirement checklist below a PasswordInput */
export const passwordInput = tv({
    slots: {
        base: 'w-full gap-1.5',
        strength: 'flex-row items-center gap-2.5',
        meter: 'flex-1 flex-row gap-1',
        bar: 'h-1 flex-1 rounded-full bg-line',
        strengthText: 'min-w-20 text-right font-sans text-xs text-muted',
        requirements: 'gap-1',
        requirement: 'flex-row items-center gap-1.5',
        requirementIcon: 'size-3.5 shrink-0 text-muted',
        requirementText: 'shrink font-sans text-xs text-muted',
        /** "met"/"not met" for screen readers – the icon shows it visually */
        requirementState: 'web:sr-only',
    },
    variants: {
        /** Colour of the filled bars by level */
        level: {
            weak: { bar: 'bg-danger' },
            fair: { bar: 'bg-warn' },
            good: { bar: 'bg-info' },
            strong: { bar: 'bg-success' },
        },
        empty: {
            true: { bar: 'bg-line' },
        },
        met: {
            true: { requirementIcon: 'text-success', requirementText: 'text-success' },
        },
    },
});

/** One box per character (PinInput) */
export const pinInput = tv({
    slots: {
        base: 'flex-row gap-2',
        box: [
            'h-12 w-11 rounded-lg border border-line-strong bg-bg text-center font-mono text-lg text-fg',
            'web:outline-none',
        ],
    },
    variants: {
        focused: {
            true: { box: 'border-primary' },
        },
        invalid: {
            true: { box: 'border-danger' },
        },
        disabled: {
            true: { box: 'border-line bg-bg-2 text-muted' },
        },
    },
});

/** Country button inside the PhoneInput field and the rows of the country sheet */
export const phoneInput = tv({
    slots: {
        country: [
            'flex-row items-center gap-1.5 self-stretch border-r border-line-strong bg-bg-2 px-3',
            pressable,
            'active:bg-line',
        ],
        flag: 'text-base',
        dial: 'font-mono text-xs text-fg',
        indicator: 'size-3.5 text-muted',
        optionFlag: 'w-7 text-lg',
        optionDial: 'font-mono text-xs text-muted',
    },
});

/** Entries as chips with a text field after them (TagsInput, Autocomplete multiple) */
export const tagsInput = tv({
    slots: {
        base: 'min-h-10 w-full flex-row flex-wrap items-center gap-1 rounded-lg border border-line-strong bg-bg px-1.5 py-1',
        tag: 'h-7 flex-row items-center rounded-full bg-line pl-2.5',
        tagText: 'font-sans-medium text-[13px] text-fg',
        tagRemove: ['-my-2 size-9 items-center justify-center rounded-full', pressable],
        tagRemoveIcon: 'size-3 text-muted',
        control: 'h-8 min-w-24 flex-1 px-1.5 font-sans text-[15px] text-fg web:outline-none',
        counter: 'px-1 font-mono text-[11px] text-muted',
    },
    variants: {
        focused: {
            true: { base: 'border-primary' },
        },
        invalid: {
            true: { base: 'border-danger' },
        },
        disabled: {
            true: { base: 'border-line bg-bg-2', control: 'text-muted' },
        },
        /** The entry chosen with Backspace (next Backspace removes it) */
        selected: {
            true: { tag: 'bg-primary', tagText: 'text-on-primary', tagRemoveIcon: 'text-on-primary' },
        },
    },
});

/** Stars as a radio group (Rating) */
export const rating = tv({
    slots: {
        base: 'gap-1.5 self-start',
        label: 'font-sans-medium text-[13px] text-fg',
        items: 'flex-row',
        /** 44 pt touch target per star */
        item: ['size-11 items-center justify-center rounded-full', pressable],
        /** Half star: the filled star clipped to its left half, over the empty one */
        half: 'absolute top-0 bottom-0 left-0 w-1/2 overflow-hidden',
        halfInner: 'h-full items-center justify-center',
        icon: 'text-line-strong',
    },
    variants: {
        size: {
            sm: { item: 'size-9', icon: 'size-4' },
            md: { icon: 'size-6' },
            lg: { item: 'size-12', icon: 'size-8' },
        },
        filled: {
            true: { icon: 'text-warn' },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Colours as a radio group (ColorSwatchPicker) and the swatches of the ColorPicker */
export const colorSwatchPicker = tv({
    slots: {
        base: 'gap-2',
        label: 'font-sans-medium text-[13px] text-fg',
        items: 'flex-row flex-wrap gap-1',
        /** 44 pt touch target around the swatch */
        item: ['items-center gap-1 rounded-xl p-1', pressable],
        swatch: 'items-center justify-center rounded-full border border-line-2',
        check: 'size-4',
        name: 'font-sans text-[11px] text-muted',
    },
    variants: {
        size: {
            sm: { swatch: 'size-7' },
            md: { swatch: 'size-9' },
            lg: { swatch: 'size-11' },
        },
        checked: {
            true: { swatch: 'border-2 border-fg' },
        },
        /** Colour of the tick on the swatch: light on dark colours, dark on light ones */
        ink: {
            light: { check: 'text-white' },
            dark: { check: 'text-black' },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** ColorPicker: field with swatch and hex, the sheet with preview, sliders and hex input */
export const colorPicker = tv({
    slots: {
        triggerSwatch: 'size-6 shrink-0 rounded-md border border-line-2',
        content: 'gap-4 px-5 pt-4 pb-2',
        preview: 'h-14 w-full rounded-xl border border-line-2',
        /** Gradient of a slider track, drawn as segments */
        track: 'h-3 w-full flex-row overflow-hidden rounded-full border border-line-2',
        segment: 'h-full flex-1',
        hexRow: 'flex-row items-center gap-3',
        swatches: 'flex-row flex-wrap gap-1',
    },
});

/** FileUpload: choose button (and drop zone look), the list of files with progress */
export const fileUpload = tv({
    slots: {
        base: 'w-full gap-2',
        label: 'font-sans-medium text-[13px] text-fg',
        zone: 'items-center gap-2 rounded-xl border border-dashed border-line-strong bg-bg-2 px-4 py-6',
        zoneIcon: 'size-6 text-muted',
        zoneText: 'text-center font-sans text-sm text-muted',
        hint: 'font-sans text-xs text-muted',
        list: 'gap-2',
        item: 'flex-row items-center gap-3 rounded-lg border border-line-2 bg-card py-2 pr-1 pl-3',
        thumb: 'size-10 rounded-md bg-line',
        fileIcon: 'size-5 shrink-0 text-muted',
        itemBody: 'min-w-0 flex-1 gap-1',
        itemName: 'font-sans-medium text-sm text-fg',
        itemMeta: 'font-sans text-xs text-muted',
        track: 'h-1 w-full overflow-hidden rounded-full bg-line',
        range: 'h-full rounded-full bg-primary',
        footer: 'flex-row justify-end',
        error: 'font-sans text-xs text-danger',
    },
    variants: {
        status: {
            pending: {},
            uploading: {},
            done: { itemMeta: 'text-success', range: 'bg-success' },
            error: { itemMeta: 'text-danger', range: 'bg-danger' },
            cancelled: {},
        },
        invalid: {
            true: { zone: 'border-danger' },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
});

/** SignaturePad: the drawing area (a light sheet in both modes – the ink is exported), tools and typed name */
export const signaturePad = tv({
    slots: {
        base: 'w-full gap-2',
        label: 'font-sans-medium text-[13px] text-fg',
        canvas: 'h-40 w-full overflow-hidden rounded-xl border border-line-strong bg-white',
        placeholder: 'absolute right-0 bottom-3 left-0 text-center font-sans text-sm text-black/55',
        baseline: 'absolute right-6 bottom-10 left-6 h-px bg-black/25',
        typed: 'absolute inset-0 items-center justify-center px-4',
        typedText: 'font-sans text-3xl text-black italic',
        toolbar: 'flex-row flex-wrap items-center justify-between gap-2',
        tools: 'flex-row gap-1',
    },
    variants: {
        invalid: {
            true: { canvas: 'border-danger' },
        },
        disabled: {
            true: { base: 'opacity-40' },
        },
    },
});

/** InlineEdit: the value as a button, the editor with save/cancel */
export const inlineEdit = tv({
    slots: {
        display: [
            'min-h-11 flex-row items-center gap-2 self-start rounded-lg px-2 py-1.5',
            pressable,
            'active:bg-line active:opacity-100',
        ],
        value: 'shrink font-sans text-[15px] text-fg',
        placeholder: 'font-sans text-[15px] text-muted italic',
        icon: 'size-3.5 shrink-0 text-muted',
        editor: 'w-full gap-2',
        actions: 'flex-row justify-end gap-2',
        error: 'font-sans text-xs text-danger',
    },
});

/** SearchField: the area select above the field */
export const searchField = tv({
    base: 'w-full gap-2',
});

/** Mentions: highlighted mentions in the preview line */
export const mentions = tv({
    slots: {
        base: 'w-full gap-1',
        mention: 'font-sans-semibold text-primary',
    },
});
