import { tv } from './tv.js';

// Carousel and gallery. Prev/next/autoplay buttons use the iconButton recipe (outline, sm).

const focusRing = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg';

export const carousel = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        // Scrollable, so it must be reachable by keyboard (tabindex=0, WCAG 2.1.1)
        itemGroup: ['rounded-xl [&::-webkit-scrollbar]:hidden', focusRing],
        item: 'min-w-0',
        // Prev/next chevrons point the other way right-to-left
        control:
            'flex items-center gap-2 rtl:[&_[data-part=prev-trigger]_svg]:-scale-x-100 rtl:[&_[data-part=next-trigger]_svg]:-scale-x-100',
        indicatorGroup: 'flex flex-1 flex-wrap items-center justify-center',
        /** `controlsPosition: 'sides'`: previous button, slides and next button in a row */
        stage: 'flex min-w-0 items-center gap-2 rtl:[&_[data-part=prev-trigger]_svg]:-scale-x-100 rtl:[&_[data-part=next-trigger]_svg]:-scale-x-100',
        // 24 × 24 px target (WCAG 2.5.8) around a small dot; the current one is wider, not only coloured
        indicator: [
            'flex size-6 cursor-pointer items-center justify-center rounded-full',
            'before:h-2 before:w-2 before:rounded-full before:bg-line-strong before:content-[""]',
            'data-current:before:w-4 data-current:before:bg-primary forced-colors:data-current:before:bg-[Highlight]',
            'motion-safe:before:transition-[width,background-color]',
            focusRing,
        ],
        /** Measures the width for `breakpoints` (container query in JS) */
        sizer: 'w-full',
    },
    variants: {
        /** Slides on top of each other (`orientation: 'vertical'`): the arrows point up and down */
        vertical: {
            true: {
                itemGroup: 'h-full',
                control:
                    '[&_[data-part=prev-trigger]_svg]:rotate-90 [&_[data-part=next-trigger]_svg]:rotate-90 rtl:[&_[data-part=prev-trigger]_svg]:scale-x-100 rtl:[&_[data-part=next-trigger]_svg]:scale-x-100',
            },
        },
        /** Previous and next beside the slides (`controlsPosition: 'sides'`) – without it in the row below them */
        controlsPosition: {
            sides: { itemGroup: 'min-w-0 flex-1' },
        },
    },
    compoundVariants: [
        {
            vertical: true,
            controlsPosition: 'sides',
            class: {
                stage: 'flex-col [&_[data-part=prev-trigger]_svg]:rotate-90 [&_[data-part=next-trigger]_svg]:rotate-90 rtl:[&_[data-part=prev-trigger]_svg]:scale-x-100 rtl:[&_[data-part=next-trigger]_svg]:scale-x-100',
            },
        },
    ],
});

export const gallery = tv({
    slots: {
        base: 'flex min-w-0 flex-col gap-3',
        stage: 'relative',
        figure: 'flex flex-col gap-2',
        image: 'aspect-video w-full rounded-xl bg-line object-cover',
        caption: 'text-sm text-muted',
        // Solid background: stays visible on any picture (WCAG 1.4.11)
        fullscreenTrigger: 'absolute top-3 inset-e-3 bg-card',
        thumbnails: 'flex gap-2 overflow-x-auto p-1',
        thumbnail: [
            'h-14 w-20 shrink-0 cursor-pointer overflow-hidden rounded-md opacity-70 hover:opacity-100',
            'aria-current:opacity-100 aria-current:ring-2 aria-current:ring-primary',
            'motion-safe:transition-opacity',
            focusRing,
        ],
        thumbnailImage: 'size-full object-cover',
        // Fullscreen view: a dialog filling the screen
        positioner: 'fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8',
        content: [
            'flex max-h-full w-full max-w-6xl flex-col gap-3 overflow-y-auto rounded-[14px] border border-line-2 bg-card p-4 text-fg outline-none',
            'motion-safe:data-[state=open]:animate-dialog-in motion-safe:data-[state=closed]:animate-dialog-out',
        ],
        header: 'flex items-center justify-between gap-3',
        title: 'text-lg font-semibold tracking-[-0.02em]',
        fullscreenImage: 'max-h-[75vh] w-full rounded-xl bg-line object-contain',
        /** Video slide (`type: 'video'`) */
        video: 'aspect-video w-full rounded-xl bg-black',
        /** Lightbox (`tools`): toolbar, zoomable stage, the zoom in percent and the keyboard help */
        lightbox: [
            'flex max-h-full w-full max-w-6xl flex-col gap-3 overflow-hidden rounded-[14px] border border-line-2 bg-card p-4 text-fg outline-none',
            'motion-safe:data-[state=open]:animate-dialog-in motion-safe:data-[state=closed]:animate-dialog-out',
            '[&:fullscreen]:max-w-none [&:fullscreen]:rounded-none [&:fullscreen]:border-0',
        ],
        toolbar: 'flex flex-wrap items-center gap-1',
        zoomValue: 'min-w-14 text-center text-xs text-muted tabular-nums',
        zoomStage: [
            'relative flex h-[70vh] min-h-0 items-center justify-center overflow-hidden rounded-xl bg-bg-2 touch-none select-none',
            'data-zoomed:cursor-grab data-panning:cursor-grabbing',
            focusRing,
        ],
        zoomImage:
            'max-h-full max-w-full object-contain will-change-transform motion-safe:transition-transform data-panning:transition-none',
        zoomVideo: 'max-h-full w-full bg-black',
        navigation: 'flex items-center justify-between gap-2 rtl:[&_svg]:-scale-x-100',
        counter: 'text-sm text-muted tabular-nums',
        shortcuts: 'text-xs text-muted',
        status: 'sr-only',
    },
});

/** Zoom limits and step of the lightbox and the image preview */
export const zoomLimits = { min: 1, max: 5, step: 0.5 };

/** The next zoom: one step in or out, kept within the limits */
export function stepZoom(zoom: number, direction: 1 | -1, limits = zoomLimits): number {
    return Math.min(limits.max, Math.max(limits.min, Math.round((zoom + direction * limits.step) * 100) / 100));
}

/**
 * Keeps a moved, zoomed picture covering its stage: the offset (from the centre, px) can go at most half of the
 * overhang in each direction. Without zoom it is 0.
 */
export function clampPan(
    offset: { x: number; y: number },
    zoom: number,
    image: { width: number; height: number },
    stage: { width: number; height: number }
): { x: number; y: number } {
    const limit = (size: number, room: number) => Math.max(0, (size * zoom - room) / 2);
    const clamp = (value: number, max: number) => Math.min(max, Math.max(-max, value));
    return {
        x: clamp(offset.x, limit(image.width, stage.width)),
        y: clamp(offset.y, limit(image.height, stage.height)),
    };
}

/** Pinch: the zoom grows with the distance of the two fingers (relative to the start), within the limits */
export function pinchZoom(startZoom: number, startDistance: number, distance: number, limits = zoomLimits): number {
    if (startDistance <= 0) return startZoom;
    return Math.min(limits.max, Math.max(limits.min, startZoom * (distance / startDistance)));
}

/**
 * A swipe: mostly horizontal and at least `threshold` px – 1 to the next picture (finger moved to the start side),
 * -1 to the previous one, 0 no swipe. Right-to-left mirrored.
 */
export function swipeDirection(dx: number, dy: number, rtl = false, threshold = 50): 1 | -1 | 0 {
    if (Math.abs(dx) < threshold || Math.abs(dx) < Math.abs(dy) * 1.5) return 0;
    const next = dx < 0 ? 1 : -1;
    return rtl ? (-next as 1 | -1) : next;
}

/** Carousel settings that change with the width of the carousel (`breakpoints`, smallest first) */
export interface CarouselBreakpoint {
    /** From this width of the carousel on, in px */
    minWidth: number;
    slidesPerPage?: number;
    slidesPerMove?: number | 'auto';
    spacing?: string;
}

/** The settings for a width: the base, overridden by every breakpoint the width reaches */
export function carouselBreakpoint<T extends Omit<CarouselBreakpoint, 'minWidth'>>(
    width: number,
    base: T,
    breakpoints: readonly CarouselBreakpoint[] = []
): T {
    return [...breakpoints]
        .sort((a, b) => a.minWidth - b.minWidth)
        .filter((point) => width >= point.minWidth)
        .reduce<T>(
            (settings, point) => ({
                ...settings,
                ...Object.fromEntries(Object.entries(point).filter(([key]) => key !== 'minWidth')),
            }),
            base
        );
}

/** Before/after comparison of two images: a native range input over both moves the dividing line */
export const compare = tv({
    slots: {
        base: [
            'relative isolate w-full overflow-hidden rounded-xl bg-bg-2 select-none',
            'has-[input:focus-visible]:outline-2 has-[input:focus-visible]:outline-offset-2 has-[input:focus-visible]:outline-fg',
        ],
        image: 'pointer-events-none absolute inset-0 block size-full object-cover',
        divider:
            'pointer-events-none absolute inset-y-0 z-[1] w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)] rtl:translate-x-1/2',
        handle: [
            'absolute top-1/2 left-1/2 flex size-9 -translate-1/2 items-center justify-center rounded-full bg-white text-black',
            'shadow-[0_4px_14px_rgba(0,0,0,.35)]',
        ],
        handleIcon: 'size-4',
        // Full-size, invisible: the whole image is the slider (drag, click, arrow keys)
        input: 'absolute inset-0 z-[2] m-0 size-full cursor-ew-resize appearance-none opacity-0',
        label: 'pointer-events-none absolute top-3 z-[1] rounded-md bg-black/65 px-2 py-1 text-xs font-medium text-white',
        beforeLabel: 'inset-s-3',
        afterLabel: 'inset-e-3',
    },
});
