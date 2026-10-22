import { listboxContent, listboxOption, listboxParts } from './navigation.js';
import { focusRing, tv } from './tv.js';

// Building blocks and special inputs: QR code, signature, image cropper, floating panel, JSON viewer and input,
// marquee, angle slider, mentions, phone number, colour swatches, emoji picker, watermark, ring progress, sortable
// lists and the log viewer.

/** Small square icon button inside a component (toolbars, panel controls) */
const toolButton = [
    'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-muted transition-colors',
    'hover:bg-line hover:text-fg motion-reduce:transition-none disabled:cursor-not-allowed disabled:opacity-40',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
];
const popupShadow = 'shadow-[0_14px_32px_-12px_rgba(0,0,0,.45)]';

/** QR code: always dark on a light tile (scanners need the contrast), optional logo in the middle */
export const qrCode = tv({
    slots: {
        base: 'inline-flex max-w-full flex-col items-center gap-2',
        frame: 'relative inline-flex rounded-lg bg-white p-3 forced-colors:border',
        svg: 'block',
        pattern: 'fill-black',
        overlay: 'flex size-[22%] items-center justify-center rounded-md bg-white p-1',
        logo: 'block size-full object-contain',
        value: 'max-w-full font-mono text-xs break-all text-muted',
        actions: 'flex flex-wrap justify-center gap-2',
    },
});

/** Signature field: a light sheet (the ink is exported as drawn), toolbar, typed alternative */
export const signaturePad = tv({
    slots: {
        base: 'flex w-full flex-col gap-1.5',
        label: 'text-[13px] font-medium text-fg',
        control: [
            'relative h-40 w-full cursor-crosshair touch-none overflow-hidden rounded-lg border border-line-strong bg-white',
            'data-disabled:cursor-not-allowed data-disabled:opacity-60 data-invalid:border-danger',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
        ],
        segment: 'fill-black',
        guide: 'pointer-events-none absolute inset-x-6 bottom-9 border-b border-dashed border-black/40',
        /** "Sign here" on the sheet while it is empty */
        placeholder: 'pointer-events-none absolute start-6 bottom-3 text-xs text-black/60',
        toolbar: 'flex flex-wrap items-center gap-2',
        typed: 'flex flex-col gap-2',
        /** The typed name in a handwriting font */
        preview: [
            'flex h-40 w-full items-center justify-center overflow-hidden rounded-lg border border-line bg-white px-4',
            "font-['Segoe_Script','Bradley_Hand','Brush_Script_MT',cursive] text-[40px] text-black",
        ],
    },
});

/** Image cropper: the image, a movable crop area (circle or rectangle) with handles and a toolbar */
export const imageCropper = tv({
    slots: {
        base: 'flex w-full flex-col gap-3',
        root: 'w-full',
        viewport: 'flex h-72 w-full items-center justify-center overflow-hidden rounded-lg bg-bg-2',
        image: 'max-h-full max-w-full',
        selection: [
            'border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,.55)] outline-none data-[shape=circle]:rounded-full',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            'forced-colors:border-[Highlight]',
        ],
        handle: 'z-[1] size-3.5 rounded-full border border-black/50 bg-white',
        grid: [
            'border-white/50 data-[axis=horizontal]:border-y data-[axis=vertical]:border-x',
            'opacity-0 transition-opacity motion-reduce:transition-none data-dragging:opacity-100 data-panning:opacity-100',
        ],
        toolbar: 'flex flex-wrap items-center gap-1',
        tool: toolButton,
        toolIcon: 'size-4',
        zoom: 'min-w-14 text-center font-mono text-xs text-muted tabular-nums',
    },
});

/** Floating window: header to drag, buttons to minimise, maximise and close, edges to resize */
export const floatingPanel = tv({
    slots: {
        positioner: 'z-50',
        content: [
            'flex flex-col overflow-hidden rounded-xl border border-line-2 bg-card text-fg outline-none',
            popupShadow,
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg',
            'data-maximized:rounded-none data-minimized:h-auto!',
            'motion-safe:data-[state=open]:animate-pop-in',
        ],
        header: 'flex h-10 shrink-0 cursor-move items-center gap-2 border-b border-line ps-3 pe-1 select-none',
        title: 'min-w-0 flex-1 truncate text-sm font-semibold',
        control: 'flex shrink-0 items-center gap-0.5',
        button: toolButton,
        buttonIcon: 'size-4',
        body: 'min-h-0 flex-1 overflow-auto p-4 text-sm',
        resize: 'z-[1]',
        /** Keyboard hint for screen readers (Alt + arrows) */
        hint: 'sr-only',
    },
});

/** JSON tree: keys, values coloured by type (quotes, true/false and null tell them apart as text, too) */
export const jsonViewer = tv({
    slots: {
        base: 'flex w-full flex-col gap-2',
        tree: [
            'm-0 max-h-96 list-none overflow-auto rounded-lg border border-line bg-bg p-1.5 font-mono text-[13px] leading-6',
            'outline-none',
        ],
        branch: 'm-0 list-none p-0',
        group: 'ms-[11px] border-s border-line ps-2',
        row: [
            'group/row flex min-h-7 cursor-default items-center gap-1 rounded-sm px-1 outline-none hover:bg-line',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg data-selected:bg-line',
            'forced-colors:data-selected:outline forced-colors:data-selected:outline-[Highlight]',
        ],
        indicator:
            'size-4 shrink-0 text-muted transition-transform motion-reduce:transition-none data-[state=open]:rotate-90 rtl:not-data-[state=open]:-scale-x-100',
        indicatorIcon: 'size-full',
        spacer: 'size-4 shrink-0',
        key: 'text-fg',
        punctuation: 'text-muted',
        value: 'min-w-0 break-all',
        preview: 'text-muted italic',
        /** Type name: hidden by default (read by screen readers), visible with `showTypes` */
        type: 'sr-only',
        copy: [
            'ms-auto flex size-6 shrink-0 cursor-pointer items-center justify-center rounded text-muted opacity-0',
            'group-hover/row:opacity-100 group-focus-visible/row:opacity-100 pointer-coarse:opacity-100 hover:bg-line-2 hover:text-fg',
            'focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-fg',
        ],
        copyIcon: 'size-3.5',
        status: 'sr-only',
    },
    variants: {
        valueType: {
            string: { value: 'text-success' },
            number: { value: 'text-info' },
            boolean: { value: 'text-warn' },
            nothing: { value: 'text-muted' },
            nested: {},
        },
        showTypes: {
            true: { type: 'not-sr-only ms-2 font-sans text-[11px] text-muted' },
        },
    },
    defaultVariants: {
        valueType: 'nested',
    },
});

/** JSON text field: monospaced textarea, check result and "Format" */
export const jsonInput = tv({
    slots: {
        base: 'flex w-full flex-col gap-1.5',
        textarea: 'min-h-40 font-mono text-[13px] leading-5',
        footer: 'flex flex-wrap items-center justify-between gap-2',
        status: 'inline-flex items-center gap-1.5 text-xs text-muted',
        statusIcon: 'size-3.5 shrink-0',
    },
    variants: {
        state: {
            empty: {},
            valid: { status: 'text-success' },
            invalid: { status: 'text-danger' },
        },
    },
    defaultVariants: {
        state: 'empty',
    },
});

/** Marquee: moves only with motion-safe (stopped for reduced motion), pauses on hover/focus and with its button */
export const marquee = tv({
    slots: {
        base: 'flex w-full items-center gap-2',
        root: 'min-w-0 flex-1',
        viewport: 'min-w-0',
        content: [
            'gap-(--marquee-spacing) pe-(--marquee-spacing)',
            'motion-safe:animate-marquee-x motion-safe:data-[orientation=vertical]:animate-marquee-y',
            'data-[orientation=vertical]:pe-0 data-[orientation=vertical]:pb-(--marquee-spacing)',
            'data-reverse:[animation-direction:reverse] [[data-paused]_&]:[animation-play-state:paused]',
        ],
        item: 'shrink-0',
        edge: [
            'z-[1] from-bg to-transparent',
            'data-[side=start]:h-full data-[side=start]:w-[10%] data-[side=start]:bg-linear-to-r rtl:data-[side=start]:bg-linear-to-l',
            'data-[side=end]:h-full data-[side=end]:w-[10%] data-[side=end]:bg-linear-to-l rtl:data-[side=end]:bg-linear-to-r',
        ],
    },
});

/** Angle 0–360°: a dial with a needle, optional tick marks */
export const angleSlider = tv({
    slots: {
        base: 'inline-flex flex-col items-center gap-2',
        label: 'text-[13px] font-medium text-fg',
        control: [
            'relative size-28 rounded-full border-2 border-line-strong bg-bg',
            'data-disabled:cursor-not-allowed data-disabled:opacity-40 data-invalid:border-danger',
        ],
        thumb: [
            'absolute inset-0 rounded-full outline-none',
            'focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-fg',
            'before:absolute before:start-[calc(50%-1.5px)] before:top-3 before:h-[calc(50%-12px)] before:w-[3px] before:rounded-full before:bg-primary',
            'after:absolute after:start-[calc(50%-8px)] after:top-0.5 after:size-4 after:rounded-full after:border-2 after:border-bg after:bg-primary',
            'forced-colors:before:bg-[Highlight] forced-colors:after:bg-[Highlight]',
        ],
        markers: 'pointer-events-none absolute inset-0',
        marker: [
            'absolute inset-0 before:absolute before:start-[calc(50%-1px)] before:top-1 before:h-2 before:w-0.5 before:bg-line-strong',
            'data-[state=under-value]:before:bg-primary data-[state=at-value]:before:bg-primary',
        ],
        value: 'font-mono text-sm text-fg tabular-nums',
    },
});

/** Text with @mentions: the textarea over a layer that marks the mentions, suggestions below */
export const mentions = tv({
    slots: {
        base: 'relative flex w-full flex-col',
        control: [
            'relative w-full rounded-lg border border-line-strong bg-bg transition-colors motion-reduce:transition-none',
            'focus-within:border-primary data-invalid:border-danger',
            'data-disabled:cursor-not-allowed data-disabled:border-line data-disabled:bg-bg-2',
        ],
        highlighter: [
            'pointer-events-none absolute inset-0 overflow-hidden px-3 py-[9px] text-[15px] leading-normal text-transparent',
            'break-words whitespace-pre-wrap',
        ],
        mark: 'rounded-sm bg-primary/15 forced-colors:outline forced-colors:outline-1',
        textarea: [
            'relative block min-h-24 w-full resize-y bg-transparent px-3 py-[9px] text-[15px] leading-normal text-fg outline-none',
            'placeholder:text-muted disabled:cursor-not-allowed disabled:text-muted',
        ],
        content: ['absolute start-0 top-full z-50 mt-1 w-full max-w-sm', ...listboxContent],
        option: listboxOption,
        optionBody: listboxParts.itemBody,
        optionDescription: listboxParts.itemDescription,
        empty: listboxParts.empty,
        loading: listboxParts.loading,
        loadingIcon: listboxParts.loadingIcon,
        status: 'sr-only',
    },
});

/** Phone number: country (flag and calling code) before the number field */
export const phoneInput = tv({
    slots: {
        base: 'flex w-full items-start gap-2',
        country: 'w-36 shrink-0',
        /** The list of countries is wider than the select (full names) */
        countryList: 'min-w-64',
        number: 'min-w-0 flex-1',
        flag: 'shrink-0 text-base leading-none',
        dial: 'font-mono text-xs text-muted',
    },
});

/** Colour swatches as a radio group: the colour plus its name (visible or for screen readers) */
export const colorSwatchPicker = tv({
    slots: {
        base: 'flex flex-col gap-2',
        label: 'text-[13px] font-medium text-fg',
        items: 'flex flex-wrap gap-2',
        item: 'relative flex cursor-pointer flex-col items-center gap-1 data-disabled:cursor-not-allowed data-disabled:opacity-40',
        swatch: [
            'flex size-8 items-center justify-center rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.18)]',
            'data-[state=checked]:outline-2 data-[state=checked]:outline-offset-2 data-[state=checked]:outline-fg',
            focusRing,
            'forced-colors:border forced-colors:data-[state=checked]:outline-[Highlight]',
        ],
        check: 'size-4 text-white drop-shadow-[0_0_1px_rgba(0,0,0,.9)]',
        text: 'sr-only',
    },
    variants: {
        size: {
            sm: { swatch: 'size-6', check: 'size-3' },
            md: {},
            lg: { swatch: 'size-10', check: 'size-5' },
        },
        showLabels: {
            true: { text: 'not-sr-only max-w-16 truncate text-xs text-muted' },
        },
    },
    defaultVariants: {
        size: 'md',
    },
});

/** Emoji picker: search, categories, a grid of emoji buttons, the name of the focused emoji */
export const emojiPicker = tv({
    slots: {
        base: 'flex w-[336px] max-w-full flex-col gap-2 rounded-xl border border-line-2 bg-card p-2 text-fg',
        categories: 'flex gap-0.5 overflow-x-auto',
        category: [
            'flex size-8 shrink-0 cursor-pointer items-center justify-center rounded-md text-lg leading-none hover:bg-line',
            'aria-pressed:bg-line focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
            'forced-colors:aria-pressed:outline forced-colors:aria-pressed:outline-[Highlight]',
        ],
        heading: 'px-1 font-mono text-[11px] tracking-label text-muted uppercase',
        grid: 'grid max-h-64 grid-cols-[repeat(var(--wc-columns),minmax(0,1fr))] gap-0.5 overflow-y-auto p-0.5',
        row: 'contents',
        cell: 'flex',
        emoji: [
            'flex size-9 cursor-pointer items-center justify-center rounded-md text-2xl leading-none hover:bg-line',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        empty: 'px-2 py-6 text-center text-sm text-muted',
        footer: 'flex h-8 items-center gap-2 border-t border-line px-1 pt-1 text-sm text-muted',
        footerEmoji: 'text-xl leading-none',
        status: 'sr-only',
    },
});

/** Watermark: a repeated text or image over the content, not clickable, hidden from screen readers */
export const watermark = tv({
    slots: {
        base: 'relative isolate',
        layer: 'pointer-events-none absolute inset-0 z-10 bg-repeat print:block forced-colors:hidden',
    },
});

/** Ring with one or more parts and a label in the middle */
export const ringProgress = tv({
    slots: {
        base: 'inline-flex flex-col items-center gap-3',
        ring: 'relative size-(--size) shrink-0',
        svg: 'size-full -rotate-90',
        track: 'fill-none stroke-line',
        segment:
            'fill-none transition-[stroke-dasharray] motion-reduce:transition-none forced-colors:stroke-[CanvasText]',
        center: 'absolute inset-0 flex flex-col items-center justify-center p-[16%] text-center',
        value: 'font-mono text-lg text-fg tabular-nums',
        label: 'text-xs text-muted',
        legend: 'm-0 flex list-none flex-wrap justify-center gap-x-4 gap-y-1 p-0',
        legendItem: 'flex items-center gap-1.5 text-sm text-fg',
        swatch: 'size-2.5 shrink-0 rounded-full',
        legendValue: 'text-muted tabular-nums',
    },
    variants: {
        size: {
            sm: { ring: '[--size:64px]', value: 'text-sm' },
            md: { ring: '[--size:104px]' },
            lg: { ring: '[--size:144px]', value: 'text-2xl' },
        },
        /** The legend only for screen readers */
        hideLegend: {
            true: { legend: 'sr-only' },
        },
        color: {
            primary: { segment: 'stroke-primary', swatch: 'bg-primary' },
            info: { segment: 'stroke-info', swatch: 'bg-info' },
            success: { segment: 'stroke-success', swatch: 'bg-success' },
            warn: { segment: 'stroke-warn', swatch: 'bg-warn' },
            danger: { segment: 'stroke-danger', swatch: 'bg-danger' },
            muted: { segment: 'stroke-muted', swatch: 'bg-muted' },
        },
    },
    defaultVariants: {
        size: 'md',
        color: 'primary',
    },
});

/** Sortable list or grid: items with a drag handle; the picked-up item is lifted */
export const sortable = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-2',
        label: 'text-[13px] font-medium text-fg',
        list: [
            'm-0 flex min-h-12 list-none flex-col gap-2 rounded-lg p-0 transition-colors motion-reduce:transition-none',
            'data-active:outline-1 data-active:outline-offset-4 data-active:outline-line-strong data-active:outline-dashed',
        ],
        item: [
            'relative flex items-center gap-2 rounded-lg border border-line bg-card p-2 text-sm text-fg',
            'transition-shadow motion-reduce:transition-none',
            'data-grabbed:z-[1] data-grabbed:border-primary data-grabbed:shadow-[0_10px_24px_-10px_rgba(0,0,0,.45)]',
            'data-dragging:opacity-85 forced-colors:data-grabbed:outline-2 forced-colors:data-grabbed:outline-[Highlight]',
        ],
        handle: [
            'flex size-8 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted',
            'hover:bg-line hover:text-fg aria-pressed:cursor-grabbing aria-pressed:bg-line aria-pressed:text-fg',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
            'disabled:cursor-not-allowed disabled:opacity-40',
        ],
        handleIcon: 'size-4',
        content: 'min-w-0 flex-1',
        empty: 'rounded-lg border border-dashed border-line-strong p-4 text-center text-sm text-muted',
        instructions: 'sr-only',
    },
    variants: {
        orientation: {
            vertical: {},
            horizontal: { list: 'flex-row flex-wrap' },
            grid: { list: 'grid grid-cols-[repeat(var(--wc-columns),minmax(0,1fr))]' },
        },
    },
    defaultVariants: {
        orientation: 'vertical',
    },
});

/** Log lines: number, level (icon and text), time and text in a monospaced, scrollable area */
export const logViewer = tv({
    slots: {
        base: 'flex w-full flex-col overflow-hidden rounded-lg border border-line bg-bg text-fg',
        toolbar: 'flex flex-wrap items-center gap-2 border-b border-line p-2',
        search: 'min-w-40 flex-1',
        body: 'relative',
        viewport: [
            'h-80 overflow-auto font-mono text-xs leading-5 outline-none',
            'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-fg',
        ],
        list: 'm-0 min-w-max list-none p-0',
        line: 'flex h-5 items-center gap-3 px-2 whitespace-pre',
        number: 'w-10 shrink-0 text-end text-muted select-none tabular-nums',
        level: 'inline-flex w-[4.5rem] shrink-0 items-center gap-1',
        levelIcon: 'size-3.5 shrink-0',
        time: 'shrink-0 text-muted',
        text: 'min-w-0',
        more: 'flex justify-center p-2',
        empty: 'p-4 text-center font-sans text-sm text-muted',
        jump: 'absolute end-3 bottom-3 z-[1]',
        footer: 'flex items-center justify-between gap-2 border-t border-line px-2 py-1 text-xs text-muted',
        levels: 'flex flex-wrap items-center gap-1',
        status: 'sr-only',
    },
    variants: {
        level: {
            none: {},
            debug: { line: 'text-muted', level: 'text-muted' },
            info: { level: 'text-info' },
            warn: { line: 'bg-warn/8', level: 'text-warn' },
            error: { line: 'bg-danger/8', level: 'text-danger' },
        },
    },
    defaultVariants: {
        level: 'none',
    },
});
