// Framework-neutral logic of the page shell: mega menu hover intent, current links, resize handles, headroom,
// link targets, stored preferences, notification days, speed dial positions, masonry rows and responsive column variables.

export interface Point {
    x: number;
    y: number;
}

export interface RectLike {
    left: number;
    top: number;
    right: number;
    bottom: number;
}

/** Whether `point` lies inside the triangle a–b–c (edges included) */
export function pointInTriangle(point: Point, a: Point, b: Point, c: Point): boolean {
    const side = (p: Point, q: Point, r: Point) => (p.x - r.x) * (q.y - r.y) - (q.x - r.x) * (p.y - r.y);
    const d1 = side(point, a, b);
    const d2 = side(point, b, c);
    const d3 = side(point, c, a);
    const negative = d1 < 0 || d2 < 0 || d3 < 0;
    const positive = d1 > 0 || d2 > 0 || d3 > 0;
    return !(negative && positive);
}

/**
 * "Safe triangle" of a mega menu: while the pointer moves from where it left the open entry (`apex`) towards the
 * open panel, it may cross other entries without switching. The triangle runs from the apex to the panel's near
 * edge – the top edge for a panel below (`bottom`), the start edge for a panel beside it (`end`, RTL mirrored).
 */
export function inSafeTriangle(point: Point, apex: Point, panel: RectLike, side: 'bottom' | 'end', rtl = false) {
    if (side === 'bottom') {
        return pointInTriangle(point, apex, { x: panel.left, y: panel.top }, { x: panel.right, y: panel.top });
    }
    const x = rtl ? panel.right : panel.left;
    return pointInTriangle(point, apex, { x, y: panel.top }, { x, y: panel.bottom });
}

/** A link the mega menu, bottom navigation or side navigation can mark as the current page */
export interface CurrentLinkLike {
    href?: string;
    current?: boolean;
}

/**
 * Whether a link is the current page: its own `current` flag, else `isCurrent(link)`, else an exact match of
 * `currentHref` – never a prefix, so only one link carries aria-current="page".
 */
export function isCurrentLink<T extends CurrentLinkLike>(
    link: T,
    currentHref?: string,
    isCurrent?: (link: T) => boolean
): boolean {
    if (link.current !== undefined) return link.current;
    if (isCurrent) return isCurrent(link);
    return currentHref !== undefined && link.href !== undefined && link.href === currentHref;
}

/** Router target of a link: a path or a route object (vue-router, React Router, TanStack Router) */
export type LinkTo = string | object;

/** Props for the link component (`linkAs`): `to` when the link has a router target, else `href` */
export const linkTarget = (href: string | undefined, to?: LinkTo) => (to === undefined ? { href } : { to });

export interface ResizeLimits {
    min: number;
    max: number;
    /** Arrow keys (px), default 16 */
    step?: number;
    /** Shift + arrow keys (px), default 64 */
    shiftStep?: number;
}

export const clampSize = (size: number, { min, max }: ResizeLimits) => Math.min(max, Math.max(min, size));

/**
 * New size of a panel for a key on its resize handle (window splitter pattern), or undefined for other keys.
 * `grows`: the arrow key that makes the panel larger (ArrowRight for a panel at the start in LTR).
 */
export function resizeForKey(
    key: string,
    shift: boolean,
    size: number,
    limits: ResizeLimits,
    grows: 'ArrowRight' | 'ArrowLeft' | 'ArrowDown' | 'ArrowUp'
): number | undefined {
    const step = shift ? (limits.shiftStep ?? 64) : (limits.step ?? 16);
    const shrinks = { ArrowRight: 'ArrowLeft', ArrowLeft: 'ArrowRight', ArrowDown: 'ArrowUp', ArrowUp: 'ArrowDown' }[
        grows
    ];
    if (key === grows) return clampSize(size + step, limits);
    if (key === shrinks) return clampSize(size - step, limits);
    if (key === 'Home') return limits.min;
    if (key === 'End') return limits.max;
    return undefined;
}

/**
 * Headroom: whether the header is hidden after scrolling from `previous` to `current` (px). It hides when
 * scrolling down past `offset`, shows again when scrolling up; small movements (< `tolerance`) keep the state.
 */
export function headroomHidden(previous: number, current: number, hidden: boolean, offset = 64, tolerance = 4) {
    if (current <= offset) return false;
    if (current - previous > tolerance) return true;
    if (previous - current > tolerance) return false;
    return hidden;
}

/** Reads a JSON value from localStorage; undefined without storage, entry or valid JSON (private mode, SSR) */
export function readStored<T>(key: string | undefined): T | undefined {
    if (!key || typeof localStorage === 'undefined') return undefined;
    try {
        const raw = localStorage.getItem(key);
        return raw === null ? undefined : (JSON.parse(raw) as T);
    } catch {
        return undefined;
    }
}

/** Writes a JSON value to localStorage (ignored without storage or when it is full) */
export function writeStored(key: string | undefined, value: unknown) {
    if (!key || typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch {
        // Storage disabled or full – the preference is simply not kept
    }
}

export type NotificationDay = 'today' | 'yesterday' | 'older';

const startOfDay = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** Calendar day of a date relative to `now` in local time */
export function notificationDay(date: Date | string | number, now: Date = new Date()): NotificationDay {
    const day = startOfDay(new Date(date));
    const today = startOfDay(now);
    if (day >= today) return 'today';
    const yesterday = startOfDay(new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1));
    return day >= yesterday ? 'yesterday' : 'older';
}

/** Items grouped by day (today, yesterday, older); groups without items are left out, the order is kept */
export function groupByDay<T extends { date: Date | string | number }>(items: readonly T[], now: Date = new Date()) {
    const days: NotificationDay[] = ['today', 'yesterday', 'older'];
    return days
        .map((day) => ({ day, items: items.filter((item) => notificationDay(item.date, now) === day) }))
        .filter((group) => group.items.length > 0);
}

/** "Today"/"Yesterday" from Intl (capitalized), `older` for the rest */
export function dayLabel(day: NotificationDay, locale: string, older: string): string {
    if (day === 'older') return older;
    const text = new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }).format(day === 'today' ? 0 : -1, 'day');
    return text.charAt(0).toLocaleUpperCase(locale) + text.slice(1);
}

/** Time of a notification: the clock time today and yesterday, the date before that */
export function notificationTime(date: Date | string | number, day: NotificationDay, locale: string): string {
    const value = new Date(date);
    return day === 'older'
        ? new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value)
        : new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(value);
}

/**
 * Unread items whose id was not in `known` and that are newer than `since` (ms) – the ones to announce. Older ones
 * that were loaded later (more pages) are not new.
 */
export function newUnread<T extends { id: string; read?: boolean; date: Date | string | number }>(
    known: Set<string>,
    items: readonly T[],
    since = -Infinity
): T[] {
    return items.filter((item) => !item.read && !known.has(item.id) && new Date(item.date).getTime() > since);
}

/** Time (ms) of the newest item, -Infinity without items */
export const newestTime = (items: readonly { date: Date | string | number }[]) =>
    items.reduce((newest, item) => Math.max(newest, new Date(item.date).getTime()), -Infinity);

export type SpeedDialLayout = 'column' | 'circle' | 'semicircle' | 'quarter';
export type SpeedDialDirection = 'up' | 'down' | 'left' | 'right';

/**
 * Offsets (px, from the centre of the main button) of the actions around it. `semicircle` opens towards
 * `direction`, `quarter` turns from `direction` to the inline start (for a button in the bottom-end corner).
 */
export function speedDialPositions(
    count: number,
    layout: Exclude<SpeedDialLayout, 'column'>,
    direction: SpeedDialDirection = 'up',
    radius = 80,
    rtl = false
): Point[] {
    // Screen angles: 0 = right, 90 = down
    const facing = { right: 0, down: 90, left: 180, up: 270 }[direction];
    let start: number;
    let sweep: number;
    if (layout === 'circle') {
        start = facing;
        sweep = 360 - 360 / Math.max(count, 1);
    } else if (layout === 'semicircle') {
        start = facing - 90;
        sweep = 180;
    } else {
        // Quarter: from the facing direction towards the start side (left in LTR)
        const towardsStart = direction === 'up' || direction === 'right' ? -90 : 90;
        start = facing;
        sweep = rtl ? -towardsStart : towardsStart;
    }
    const steps = Math.max(count - 1, 1);
    return Array.from({ length: count }, (_, index) => {
        const angle =
            ((start + (count === 1 && layout !== 'circle' ? sweep / 2 : (sweep * index) / steps)) * Math.PI) / 180;
        const x = Math.round(Math.cos(angle) * radius);
        return { x: (rtl && layout !== 'quarter' ? -x : x) || 0, y: Math.round(Math.sin(angle) * radius) || 0 };
    });
}

/** Rows a measured masonry item spans: its height plus the gap, in rows of `rowHeight` px */
export function masonrySpan(height: number, rowHeight = 4, gap = 16): number {
    return Math.max(1, Math.ceil((height + gap) / rowHeight));
}

/** Columns per breakpoint: a number, or { base, sm, md, lg, xl } (missing ones take the next smaller) */
export type ResponsiveColumns = number | Partial<Record<'base' | 'sm' | 'md' | 'lg' | 'xl', number>>;

/** CSS variables for a responsive column count (`--wc-cols`, `--wc-cols-sm` …) */
export function columnVariables(columns: ResponsiveColumns): Record<string, string> {
    if (typeof columns === 'number') return { '--wc-cols': String(columns) };
    const variables: Record<string, string> = {};
    for (const key of ['base', 'sm', 'md', 'lg', 'xl'] as const) {
        const value = columns[key];
        if (value !== undefined) variables[key === 'base' ? '--wc-cols' : `--wc-cols-${key}`] = String(value);
    }
    return variables;
}

/** Breakpoints (px) of the responsive column counts – the same as Tailwind's sm, md, lg and xl */
export const columnBreakpoints = { sm: 640, md: 768, lg: 1024, xl: 1280 } as const;

/** The column count for a width (React Native: the window or container width; the web uses CSS variables) */
export function responsiveColumnCount(columns: ResponsiveColumns, width: number): number {
    if (typeof columns === 'number') return columns;
    let count = columns.base ?? 1;
    for (const key of ['sm', 'md', 'lg', 'xl'] as const) {
        const value = columns[key];
        if (value !== undefined && width >= columnBreakpoints[key]) count = value;
    }
    return count;
}

export interface HoverIntentOptions {
    /** Value of the open panel ('' when none is open) */
    value: () => string;
    /** Opens a panel ('' closes) */
    open: (value: string) => void;
    /** Delay before the first panel opens (ms) */
    openDelay: () => number;
    /** Delay before closing after the pointer left (ms) */
    closeDelay: () => number;
    /** Box of the open panel – the target of the safe triangle */
    panel: (value: string) => RectLike | null;
    /** Panels open below the entries (horizontal) or beside them (vertical) */
    side: () => 'bottom' | 'end';
    rtl: () => boolean;
}

/**
 * Hover intent for a mega menu (mouse only – call it for `pointerType === 'mouse'`). The first panel opens after
 * `openDelay`; with a panel open, entering another entry switches at once – unless the pointer is inside the safe
 * triangle towards the open panel, then it switches only when it rests there or leaves the triangle. Leaving the
 * entry (with its panel) closes after `closeDelay`. Entries without a panel use the value ''.
 */
export function createHoverIntent(options: HoverIntentOptions) {
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    let switchTimer: ReturnType<typeof setTimeout> | undefined;
    let apex: Point | null = null;
    let pending: string | null = null;
    const towardsOpenPanel = (point: Point) => {
        const current = options.value();
        const rect = current ? options.panel(current) : null;
        return !!apex && !!rect && inSafeTriangle(point, apex, rect, options.side(), options.rtl());
    };
    const switchTo = (value: string) => {
        clearTimeout(switchTimer);
        pending = null;
        options.open(value);
    };
    return {
        /** The pointer entered an entry (its item, including the panel inside it) */
        enter(value: string, point: Point) {
            clearTimeout(closeTimer);
            const current = options.value();
            if (current === value) {
                clearTimeout(switchTimer);
                pending = null;
                return;
            }
            if (!current) {
                clearTimeout(openTimer);
                if (value) openTimer = setTimeout(() => options.open(value), options.openDelay());
                return;
            }
            if (towardsOpenPanel(point)) {
                pending = value;
                clearTimeout(switchTimer);
                switchTimer = setTimeout(() => pending === value && switchTo(value), options.openDelay());
                return;
            }
            switchTo(value);
        },
        /** The pointer moved inside an entry – switches once it is no longer on its way to the open panel */
        move(value: string, point: Point) {
            if (pending === value && !towardsOpenPanel(point)) switchTo(value);
        },
        /** The pointer left an entry (and its panel) */
        leave(value: string, point: Point) {
            clearTimeout(openTimer);
            if (pending === value) {
                clearTimeout(switchTimer);
                pending = null;
            }
            if (options.value() === value) apex = point;
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => options.open(''), options.closeDelay());
        },
        /** Stops all timers (unmount, or a click/key took over) */
        cancel() {
            clearTimeout(openTimer);
            clearTimeout(closeTimer);
            clearTimeout(switchTimer);
            pending = null;
        },
    };
}

export type HoverIntent = ReturnType<typeof createHoverIntent>;
