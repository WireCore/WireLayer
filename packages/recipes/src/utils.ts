/** Framework-free helpers shared by @wirecore/wirelayer-vue and @wirecore/wirelayer-react. */

/** "Julia Klein" → "JK", "Julia" → "J" */
export function getInitials(name: string): string {
    const words = name.trim().split(/\s+/).filter(Boolean);
    const first = words[0]?.[0] ?? '';
    const last = words.length > 1 ? (words.at(-1)?.[0] ?? '') : '';
    return (first + last).toUpperCase();
}

/** Text of a counter badge: 4 → "4", 120 → "99+" */
export function formatCount(count: number, max = 99): string {
    return count > max ? `${max}+` : String(count);
}

export type ColorMode = 'light' | 'dark';

/** Stored choice, otherwise the system preference. Browser only. */
export function getPreferredMode(storageKey = 'wirecore-mode'): ColorMode {
    try {
        const stored = localStorage.getItem(storageKey);
        if (stored === 'light' || stored === 'dark') return stored;
    } catch {
        // Storage may be unavailable (private mode)
    }
    return typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Applies the mode to the document (`data-mode`) and remembers it. Browser only. */
export function setMode(mode: ColorMode, storageKey = 'wirecore-mode') {
    document.documentElement.dataset.mode = mode;
    try {
        localStorage.setItem(storageKey, mode);
    } catch {
        // Storage may be unavailable (private mode) – the mode still applies for this page
    }
}

/**
 * Inline script for the document <head> of server-rendered apps (Nuxt, Next): applies the stored or system
 * mode before the first paint, so dark mode does not flash light.
 */
export function modeScript(storageKey = 'wirecore-mode'): string {
    return `(function(){var m;try{m=localStorage.getItem(${JSON.stringify(storageKey)})}catch(e){}if(m!=='light'&&m!=='dark')m=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.mode=m})()`;
}

/** Mask tokens: 9 digit, a letter, * letter or digit – every other character is inserted as it is, \\ escapes */
const maskTokens: Record<string, RegExp> = { '9': /\d/, a: /\p{L}/u, '*': /[\p{L}\d]/u };

/** Own mask tokens, e.g. { h: /[0-9a-f]/i } for hex digits – they extend (or replace) 9, a and * */
export type MaskTokens = Record<string, RegExp>;

type MaskSlot = ({ token: RegExp } | { literal: string }) & { optional?: boolean };

/** `?` starts the optional rest of a mask: "99999?-9999" (a postcode with an optional extension) */
function parseMask(mask: string, tokens?: MaskTokens): MaskSlot[] {
    const all = tokens ? { ...maskTokens, ...tokens } : maskTokens;
    const slots: MaskSlot[] = [];
    let optional = false;
    for (let index = 0; index < mask.length; index++) {
        const char = mask[index]!;
        if (char === '\\' && index + 1 < mask.length) slots.push({ literal: mask[++index]!, optional });
        else if (char === '?' && !all['?']) optional = true;
        else slots.push(all[char] ? { token: all[char], optional } : { literal: char, optional });
    }
    return slots;
}

/**
 * Fits typed text into a mask, e.g. maskValue('891234', 'DE99 9999 9999') → 'DE89 1234'. Characters that do not
 * fit a slot are skipped, separators come by themselves (and may also be typed). '+4\\9 999' keeps the 9 of +49.
 */
export function maskValue(value: string, mask: string, tokens?: MaskTokens): string {
    let out = '';
    let index = 0;
    for (const slot of parseMask(mask, tokens)) {
        if (index >= value.length) break;
        if ('token' in slot) {
            while (index < value.length && !slot.token.test(value[index]!)) index++;
            if (index >= value.length) break;
            out += value[index++];
        } else {
            out += slot.literal;
            if (value[index] === slot.literal) index++;
        }
    }
    return out;
}

/** Only the typed characters of a masked value: unmaskValue('DE89 1234', 'DE99 9999 9999') → '891234' */
export function unmaskValue(value: string, mask: string, tokens?: MaskTokens): string {
    const slots = parseMask(mask, tokens);
    return [...value].filter((_, index) => slots[index] && 'token' in slots[index]!).join('');
}

/** Placeholder showing the mask: 'DE99 9999' → 'DE__ ____'; `slotChar` replaces the underscore */
export const maskPlaceholder = (mask: string, slotChar = '_', tokens?: MaskTokens) =>
    parseMask(mask, tokens)
        .map((slot) => ('token' in slot ? slotChar : slot.literal))
        .join('');

/** Masks with only digits for the typed slots get the numeric keyboard */
export const maskIsNumeric = (mask: string, tokens?: MaskTokens) =>
    parseMask(mask, tokens).every((slot) => !('token' in slot) || slot.token === maskTokens['9']);

/** Whether every required slot of the mask is filled (the optional rest after `?` may stay empty) */
export function maskIsComplete(value: string, mask: string, tokens?: MaskTokens): boolean {
    const masked = maskValue(value, mask, tokens);
    return parseMask(mask, tokens).every((slot, index) => slot.optional || !('token' in slot) || index < masked.length);
}

// Knob: a 270° dial from bottom left (−135°) clockwise to bottom right (+135°), 0° = top

const KNOB_START = -135;
const KNOB_SWEEP = 270;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const roundToStep = (value: number, min: number, step: number) =>
    Number((Math.round((value - min) / step) * step + min).toFixed(10));

/** SVG path of the dial from the start to `fraction` (0–1), in a 100 × 100 view box */
export function knobArc(fraction: number, radius = 40): string {
    const point = (angle: number) => {
        const radians = ((angle - 90) * Math.PI) / 180;
        return `${(50 + radius * Math.cos(radians)).toFixed(3)} ${(50 + radius * Math.sin(radians)).toFixed(3)}`;
    };
    const end = KNOB_START + KNOB_SWEEP * clamp(fraction, 0, 1);
    const large = end - KNOB_START > 180 ? 1 : 0;
    return `M ${point(KNOB_START)} A ${radius} ${radius} 0 ${large} 1 ${point(Math.max(end, KNOB_START + 0.01))}`;
}

/** Value at a pointer position (relative to the dial's centre), snapped to the step */
export function knobValueAt(x: number, y: number, min: number, max: number, step: number): number {
    let angle = (Math.atan2(x, -y) * 180) / Math.PI; // 0° = top, clockwise
    if (angle < KNOB_START) angle += 360;
    const fraction = clamp((angle - KNOB_START) / KNOB_SWEEP, 0, 1);
    return clamp(roundToStep(min + fraction * (max - min), min, step), min, max);
}

/** Next value for a key (slider keyboard pattern), or undefined for other keys */
export function knobValueForKey(key: string, value: number, min: number, max: number, step: number) {
    const big = Math.max(step, (max - min) / 10);
    const next: Record<string, number> = {
        ArrowUp: value + step,
        ArrowRight: value + step,
        ArrowDown: value - step,
        ArrowLeft: value - step,
        PageUp: value + big,
        PageDown: value - big,
        Home: min,
        End: max,
    };
    return key in next ? clamp(roundToStep(next[key]!, min, step), min, max) : undefined;
}

/**
 * Toolbar keyboard (WAI-ARIA toolbar pattern): the index arrow keys, Home and End move to among `count`
 * controls, or undefined for other keys. Wraps around at the ends.
 */
/**
 * +1 for the arrow key that points forward in the reading direction, -1 for back, 0 for other keys.
 * Right-to-left, left and right swap (WAI-ARIA); the direction is the element's computed `direction`.
 */
export function inlineArrowStep(key: string, element: Element | null | undefined): -1 | 0 | 1 {
    const step = key === 'ArrowRight' ? 1 : key === 'ArrowLeft' ? -1 : 0;
    return step && element && getComputedStyle(element).direction === 'rtl' ? (-step as -1 | 1) : step;
}

export function toolbarIndexForKey(
    key: string,
    index: number,
    count: number,
    element?: Element | null
): number | undefined {
    const step = inlineArrowStep(key, element);
    if (step) return (index + step + count) % count;
    if (key === 'Home') return 0;
    if (key === 'End') return count - 1;
    return undefined;
}

/**
 * CSV for spreadsheets: values quoted when needed, `;` as separator (what German Excel expects),
 * with a byte order mark so umlauts survive.
 */
export function toCsv(rows: unknown[][], separator = ';'): string {
    const cell = (value: unknown) => {
        const text = value === null || value === undefined ? '' : String(value);
        return /[";\n\r,]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    return `\uFEFF${rows.map((row) => row.map(cell).join(separator)).join('\r\n')}`;
}

/** Offers text as a file download. Browser only. */
export function downloadText(filename: string, text: string, type = 'text/csv;charset=utf-8') {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const link = Object.assign(document.createElement('a'), { href: url, download: filename });
    link.click();
    URL.revokeObjectURL(url);
}

/**
 * Rough password strength 0–4 for the strength meter: length (8, 12) and the kinds of characters used
 * (lower/upper case, digits, others). Under 8 characters it stays at 0. A hint, no security check.
 */
export function passwordStrength(password: string): 0 | 1 | 2 | 3 | 4 {
    if (password.length < 8) return 0;
    const kinds = [/[a-zäöüß]/, /[A-ZÄÖÜ]/, /\d/, /[^\p{L}\d]/u].filter((kind) => kind.test(password)).length;
    const score = (password.length >= 12 ? 2 : 1) + (kinds >= 3 ? 2 : kinds === 2 ? 1 : 0);
    return Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
}

/** One rule of a PasswordInput checklist, e.g. { label: 'At least 12 characters', test: (v) => v.length >= 12 } */
export interface PasswordRequirement {
    label: string;
    /** A pattern the password must contain or a check of its own */
    test: RegExp | ((password: string) => boolean);
}

/** Which requirements a password meets, in their order */
export const checkPasswordRequirements = (password: string, requirements: readonly PasswordRequirement[]): boolean[] =>
    requirements.map(({ test }) => (typeof test === 'function' ? test(password) : test.test(password)));

/** Characters a PinInput box takes */
export type PinInputType = 'numeric' | 'alphanumeric' | 'alphabetic';

const pinPatterns: Record<PinInputType, RegExp> = {
    numeric: /^\d$/,
    alphabetic: /^\p{L}$/u,
    alphanumeric: /^[\p{L}\d]$/u,
};

/**
 * Text typed or pasted into box `index` of a code input with one field per character (React Native PinInput): a
 * new character replaces the box's old one, a pasted or autofilled code fills the boxes from there on, characters of
 * the wrong type are dropped. Returns the characters and the box that gets the focus next.
 */
export function pinInputChange(
    chars: readonly string[],
    index: number,
    text: string,
    length: number,
    type: PinInputType = 'numeric'
): { chars: string[]; focus: number } {
    const next = Array.from({ length }, (_, position) => chars[position] ?? '');
    const previous = next[index] ?? '';
    if (text === '') {
        next[index] = '';
        return { chars: next, focus: index };
    }
    // Typing into a filled box gives the old and the new character – keep the new one
    const typed =
        previous && text.length === 2 && text.includes(previous)
            ? text.startsWith(previous)
                ? text.slice(1)
                : text.slice(0, 1)
            : text;
    const accepted = [...typed].filter((char) => pinPatterns[type].test(char));
    if (!accepted.length) return { chars: next, focus: index };
    accepted.slice(0, length - index).forEach((char, offset) => (next[index + offset] = char));
    return { chars: next, focus: Math.min(index + accepted.length, length - 1) };
}

const TOOLBAR_ITEMS =
    ':is(button, a[href], [role=button], [role=checkbox], [role=radio], [role=switch], [role=combobox]):not(:disabled, [aria-hidden=true])';
const TOOLBAR_ITEMS_WITH_INPUTS =
    ':is(button, a[href], [role=button], [role=checkbox], [role=radio], [role=switch], [role=combobox], input:not([type=hidden])):not(:disabled, [aria-hidden=true])';

/** Options of setupToolbar */
export interface ToolbarSetupOptions {
    /**
     * Text fields are controls of the toolbar, too (e.g. a page number): the arrow keys move the caret and pass the
     * focus on only from the start or end of the text; Home and End stay in the field.
     */
    textInputs?: boolean;
}

/**
 * Makes a toolbar one tab stop (WAI-ARIA toolbar): arrow keys (along the orientation), Home and End move
 * between its controls; the last focused one keeps the tab stop. Works with any children – it sets their
 * tabindex itself and again when they change. Browser only; returns the cleanup.
 */
export function setupToolbar(
    toolbar: HTMLElement,
    orientation: 'horizontal' | 'vertical' = 'horizontal',
    options: ToolbarSetupOptions = {}
) {
    let current: HTMLElement | undefined;
    const selector = options.textInputs ? TOOLBAR_ITEMS_WITH_INPUTS : TOOLBAR_ITEMS;
    const items = () => [...toolbar.querySelectorAll<HTMLElement>(selector)];
    const apply = () => {
        const list = items();
        if (!current || !list.includes(current)) current = list[0];
        for (const item of list) item.tabIndex = item === current ? 0 : -1;
    };
    const onFocus = (event: FocusEvent) => {
        const target = (event.target as HTMLElement).closest<HTMLElement>(selector);
        if (!target || !toolbar.contains(target)) return;
        current = target;
        apply();
    };
    const onKey = (event: KeyboardEvent) => {
        const list = items();
        const index = list.indexOf(event.target as HTMLElement);
        if (index < 0) return;
        const step =
            orientation === 'horizontal'
                ? inlineArrowStep(event.key, toolbar)
                : event.key === 'ArrowDown'
                  ? 1
                  : event.key === 'ArrowUp'
                    ? -1
                    : 0;
        // A text field keeps Home/End and the arrow keys until the caret is at the start or end of its text
        const field = event.target instanceof HTMLInputElement ? event.target : null;
        if (field) {
            if (!step) return;
            const { selectionStart, selectionEnd, value } = field;
            if (selectionStart !== selectionEnd) return;
            if (step > 0 ? selectionEnd !== value.length : selectionStart !== 0) return;
        }
        const target = step
            ? (index + step + list.length) % list.length
            : event.key === 'Home'
              ? 0
              : event.key === 'End'
                ? list.length - 1
                : undefined;
        if (target === undefined) return;
        event.preventDefault();
        list[target]?.focus();
    };
    const observer = new MutationObserver(apply);
    observer.observe(toolbar, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled'] });
    toolbar.addEventListener('focusin', onFocus);
    toolbar.addEventListener('keydown', onKey);
    apply();
    return () => {
        observer.disconnect();
        toolbar.removeEventListener('focusin', onFocus);
        toolbar.removeEventListener('keydown', onKey);
    };
}

/** Timer that can be paused and resumed – for content that hides itself (WCAG 2.2.1: pause on hover and focus) */
export interface PausableTimer {
    /** Stops the countdown and keeps the remaining time */
    pause(): void;
    /** Continues with the remaining time */
    resume(): void;
    /** Stops for good */
    clear(): void;
}

/** Calls `done` after `duration` ms of running time; browser only (call it after mount). */
export function createPausableTimer(done: () => void, duration: number): PausableTimer {
    let remaining = duration;
    let startedAt = 0;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let finished = false;
    const resume = () => {
        if (finished || timer !== undefined) return;
        startedAt = Date.now();
        timer = setTimeout(() => {
            finished = true;
            timer = undefined;
            done();
        }, remaining);
    };
    const pause = () => {
        if (timer === undefined) return;
        clearTimeout(timer);
        timer = undefined;
        remaining = Math.max(0, remaining - (Date.now() - startedAt));
    };
    resume();
    return {
        pause,
        resume,
        clear: () => {
            finished = true;
            pause();
        },
    };
}

type TextControl = HTMLInputElement | HTMLTextAreaElement;

/**
 * Changes a text control like typing would: sets the text and fires `input`, so Vue, React and Ark see the change.
 * Without `text` the control is emptied. Browser only.
 */
export function setTextControlValue(control: TextControl, text = '') {
    // The prototype's setter: React tracks the instance's own value property and would miss the change
    Object.getOwnPropertyDescriptor(Object.getPrototypeOf(control), 'value')?.set?.call(control, text);
    control.dispatchEvent(new Event('input', { bubbles: true }));
}

/** Inserts text at the caret (replacing the selection) and fires `input`, like typing it. Browser only. */
export function insertIntoTextControl(control: TextControl, text: string) {
    const start = control.selectionStart ?? control.value.length;
    const end = control.selectionEnd ?? start;
    control.setRangeText(text, start, end, 'end');
    control.dispatchEvent(new Event('input', { bubbles: true }));
}

const FOCUSABLE =
    'input:not([type=hidden]), select, textarea, button, [href], [tabindex]:not([tabindex="-1"]), [contenteditable=true]';

/**
 * Moves the focus to a form control by id – the element itself if it is focusable, otherwise the first focusable
 * element inside (e.g. a group of radios) – and scrolls it into view. Returns false if there is no such element.
 * Browser only.
 */
export function focusFormControl(id: string): boolean {
    const target = document.getElementById(id);
    if (!target) return false;
    const control = target.matches(FOCUSABLE) ? target : target.querySelector<HTMLElement>(FOCUSABLE);
    (control ?? target).focus();
    target.scrollIntoView?.({ block: 'center' });
    return true;
}

/** A piece of text for Highlight: a hit (with the index of its search term) or plain text */
export interface HighlightChunk {
    text: string;
    match: boolean;
    /** Index of the search term that matched (for its colour) */
    term?: number;
}

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Splits a text into hits and plain text. `wholeWord` only marks complete words, `ignoreAccents` finds "Muller" in
 * "Müller" (and the other way round); the hits keep the original spelling.
 */
export function highlightChunks(
    text: string,
    query: string | string[],
    options: { ignoreCase?: boolean; matchAll?: boolean; wholeWord?: boolean; ignoreAccents?: boolean } = {}
): HighlightChunk[] {
    const { ignoreCase = true, matchAll = true, wholeWord = false, ignoreAccents = false } = options;
    const strip = (value: string) => (ignoreAccents ? value.normalize('NFD').replace(/\p{M}/gu, '') : value);
    // The searched text, with the position of every character in the original text
    let searched = '';
    const origin: number[] = [];
    [...text].reduce((position, char) => {
        for (const part of strip(char)) {
            searched += part;
            origin.push(position);
        }
        return position + char.length;
    }, 0);
    origin.push(text.length);
    const terms = (Array.isArray(query) ? query : [query])
        .map((term, index) => ({ term: strip(term.trim()), index }))
        .filter(({ term }) => term)
        .sort((a, b) => b.term.length - a.term.length);
    if (!terms.length) return text ? [{ text, match: false }] : [];
    const word = '[\\p{L}\\p{N}_]';
    const pattern = terms
        .map(({ term }) => `(${wholeWord ? `(?<!${word})${escapeRegExp(term)}(?!${word})` : escapeRegExp(term)})`)
        .join('|');
    const regex = new RegExp(pattern, `gu${ignoreCase ? 'i' : ''}`);
    const chunks: HighlightChunk[] = [];
    let last = 0;
    for (const found of searched.matchAll(regex)) {
        const start = origin[found.index]!;
        const end = origin[found.index + found[0].length]!;
        if (start > last) chunks.push({ text: text.slice(last, start), match: false });
        const group = found.slice(1).findIndex((value) => value !== undefined);
        chunks.push({ text: text.slice(start, end), match: true, term: terms[group]!.index });
        last = end;
        if (!matchAll) break;
    }
    if (last < text.length) chunks.push({ text: text.slice(last), match: false });
    return chunks;
}

/**
 * Slider with `restrictToMarks`: every thumb moves to a mark – the nearest one, but at least one mark further in the
 * direction it moved, so arrow keys go from mark to mark.
 */
export function snapToMarks(next: number[], previous: number[], marks: number[]): number[] {
    const sorted = [...new Set(marks)].sort((a, b) => a - b);
    if (!sorted.length) return next;
    return next.map((value, index) => {
        const before = previous[index] ?? value;
        const nearest = sorted.reduce((best, mark) => (Math.abs(mark - value) < Math.abs(best - value) ? mark : best));
        if (nearest !== before || value === before) return nearest;
        return value > before
            ? (sorted.find((mark) => mark > before) ?? before)
            : ([...sorted].reverse().find((mark) => mark < before) ?? before);
    });
}

/** Whether a scrolled element has more content towards its start and its end (horizontally, also right-to-left) */
export function scrollEdges(element: { scrollLeft: number; clientWidth: number; scrollWidth: number }) {
    const offset = Math.abs(element.scrollLeft);
    return { start: offset > 1, end: offset + element.clientWidth < element.scrollWidth - 1 };
}

/**
 * Closes a tab and keeps the focus in the tab list: if the tab had the focus and is gone after `close` (the app
 * removed it), its neighbour (the next tab, else the previous one) gets the focus. Browser only.
 */
export function closeTab(trigger: HTMLElement, close: () => void) {
    const tabs = [...(trigger.closest('[role=tablist]')?.querySelectorAll<HTMLElement>('[role=tab]') ?? [])].filter(
        (tab) => !tab.hasAttribute('disabled') && tab.getAttribute('aria-disabled') !== 'true'
    );
    const index = tabs.indexOf(trigger);
    const neighbour = tabs[index + 1] ?? tabs[index - 1];
    const hadFocus = trigger.contains(document.activeElement);
    close();
    if (!hadFocus || !neighbour) return;
    requestAnimationFrame(() => {
        if (!trigger.isConnected) neighbour.focus();
    });
}

// ---------------------------------------------------------------------------------------------------------------
// Overlays: anchors, dragging, long press, swiping, shortcuts

/** Where a popup opens: an element or a point on the screen (viewport coordinates) */
export type OverlayAnchor = Element | { x: number; y: number };

/** Position and size of an anchor, as Ark's positioning expects it */
export interface AnchorBox {
    x: number;
    y: number;
    width: number;
    height: number;
}

/**
 * The anchor for `open(anchor)`: an element as it is, a pointer event as the point it happened at. Clicks made with
 * the keyboard have no pointer position – then the element that was clicked.
 */
export function toOverlayAnchor(anchor: OverlayAnchor | MouseEvent | null | undefined): OverlayAnchor | null {
    if (!anchor) return null;
    if ('clientX' in anchor && 'type' in anchor) {
        const element = (anchor.currentTarget ?? anchor.target) as Element | null;
        if (anchor.detail === 0 && anchor.type === 'click' && element) return element;
        return { x: anchor.clientX, y: anchor.clientY };
    }
    return anchor;
}

/**
 * Methods of Popover, HoverCard, Menu and ContextMenu (Vue: template ref, React: ref) to open them at any element or
 * pointer position, without a trigger
 */
export interface OverlayHandle {
    /** Opens at the anchor (element, pointer event or point) – without one at the `anchor` prop or the trigger */
    open(anchor?: OverlayAnchor | MouseEvent | null): void;
    close(): void;
    /** Closes when open, otherwise opens at the anchor */
    toggle(anchor?: OverlayAnchor | MouseEvent | null): void;
}

/** The box of an anchor: the element's box or an empty box at the point */
export function anchorBox(anchor: OverlayAnchor): AnchorBox {
    if ('getBoundingClientRect' in anchor) {
        const rect = anchor.getBoundingClientRect();
        return { x: rect.x, y: rect.y, width: rect.width, height: rect.height };
    }
    return { x: anchor.x, y: anchor.y, width: 0, height: 0 };
}

/**
 * Keeps a moved dialog on screen: `base` is its box without the offset; the header never leaves the top edge and at
 * least `keep` pixels stay visible on the other sides.
 */
export function clampDialogOffset(
    offset: { x: number; y: number },
    base: AnchorBox,
    viewport: { width: number; height: number },
    keep = 48
): { x: number; y: number } {
    return {
        x: Math.min(Math.max(offset.x, keep - base.x - base.width), viewport.width - keep - base.x),
        y: Math.min(Math.max(offset.y, -base.y), viewport.height - keep - base.y),
    };
}

/** The keys that move a draggable dialog, for aria-keyshortcuts */
export const dialogMoveKeys = 'Alt+ArrowUp Alt+ArrowDown Alt+ArrowLeft Alt+ArrowRight';

/** Alt + arrow keys move a draggable dialog by 10 pixels, with Shift by 50 (keyboard alternative to dragging) */
export function dialogMoveForKey(event: {
    key: string;
    altKey: boolean;
    shiftKey: boolean;
}): { x: number; y: number } | null {
    if (!event.altKey) return null;
    const step = event.shiftKey ? 50 : 10;
    const moves: Record<string, { x: number; y: number }> = {
        ArrowUp: { x: 0, y: -step },
        ArrowDown: { x: 0, y: step },
        ArrowLeft: { x: -step, y: 0 },
        ArrowRight: { x: step, y: 0 },
    };
    return moves[event.key] ?? null;
}

interface PointerLike {
    pointerType: string;
    clientX: number;
    clientY: number;
}

export interface LongPress {
    /** pointerdown: starts the timer for touch and pen (the mouse has its right click) */
    down(event: PointerLike): void;
    /** pointermove: moving further than the tolerance cancels */
    move(event: PointerLike): void;
    /** pointerup/pointercancel/unmount */
    cancel(): void;
    /** True once after a long press – the click that follows it should be ignored */
    consumeClick(): boolean;
}

/** Holding a finger (or pen) still for `delay` ms calls `onLongPress` with the point – touch has no hover or right click */
export function createLongPress(
    onLongPress: (point: { x: number; y: number }) => void,
    {
        delay = 500,
        tolerance = 10,
        mouse = false,
    }: {
        delay?: number;
        tolerance?: number;
        /** Also with the mouse (useLongPress) – by default only touch and pen */
        mouse?: boolean;
    } = {}
): LongPress {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let start = { x: 0, y: 0 };
    let fired = false;
    const cancel = () => {
        clearTimeout(timer);
        timer = undefined;
    };
    return {
        down(event) {
            cancel();
            fired = false;
            if (event.pointerType === 'mouse' && !mouse) return;
            start = { x: event.clientX, y: event.clientY };
            timer = setTimeout(() => {
                timer = undefined;
                fired = true;
                onLongPress(start);
            }, delay);
        },
        move(event) {
            if (timer && Math.hypot(event.clientX - start.x, event.clientY - start.y) > tolerance) cancel();
        },
        cancel,
        consumeClick() {
            const result = fired;
            fired = false;
            return result;
        },
    };
}

/** A toast swiped sideways by `distance` pixels closes once it moved 80 pixels or 40 % of its width */
export function isSwipeDismiss(distance: number, width: number): boolean {
    return Math.abs(distance) >= Math.min(80, width * 0.4);
}

/** Toasts with an action stay until dismissed (WCAG 2.2.1); all others close after 6 seconds */
export function toastDuration(options: { duration?: number; action?: unknown }): number {
    return options.duration ?? (options.action ? Infinity : 6000);
}

interface KeyLike {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    target?: EventTarget | null;
}

/**
 * Whether a key press matches a shortcut like "mod+k", "alt+shift+p" or "/". `mod` is Ctrl or ⌘. Shortcuts
 * without Ctrl, ⌘ or Alt do not fire while typing in a field.
 */
export function matchesHotkey(event: KeyLike, hotkey: string): boolean {
    const parts = hotkey.toLowerCase().split('+');
    const key = parts.pop() || '+';
    const mods = new Set(parts);
    const ctrl = mods.has('ctrl') || (mods.has('mod') && !event.metaKey);
    const meta = mods.has('meta') || (mods.has('mod') && !event.ctrlKey);
    if (event.key.toLowerCase() !== key) return false;
    if (event.ctrlKey !== ctrl || event.metaKey !== meta || event.altKey !== mods.has('alt')) return false;
    // Shift only counts when named or for letters ("?" needs Shift on many layouts)
    if (mods.has('shift') ? !event.shiftKey : event.shiftKey && /^[a-z]$/.test(key)) return false;
    if (ctrl || meta || mods.has('alt')) return true;
    const target = event.target as HTMLElement | null | undefined;
    return !(target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName ?? ''));
}

/**
 * Keeps the items a score accepts: `false`/0 drop an item, `true` keeps it in place, higher numbers come first
 * (stable). `limit` cuts the list.
 */
export function rankItems<T>(items: readonly T[], score: (item: T) => number | boolean, limit?: number): T[] {
    const ranked = items
        .map((item, index) => ({ item, index, score: Number(score(item)) }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score || a.index - b.index)
        .map((entry) => entry.item);
    return limit === undefined ? ranked : ranked.slice(0, Math.max(0, limit));
}

/** What CommandPalette searches and groups: the label, further words and the group heading */
export interface CommandSearchItem {
    label: string;
    keywords?: string[];
    group?: string;
}

/**
 * Results of a command palette: without a query (or with `filter: false`) the items as they are; otherwise the items
 * whose label or keywords contain the query (case and accents ignored) – or ranked by an own `filter` score. `limit`
 * cuts the list.
 */
export function filterCommands<T extends CommandSearchItem>(
    items: readonly T[],
    query: string,
    options: { filter?: ((item: T, query: string) => number | boolean) | false; limit?: number } = {}
): T[] {
    const { filter, limit } = options;
    if (!query.trim() || filter === false) return limit === undefined ? [...items] : items.slice(0, Math.max(0, limit));
    const fold = (text: string) => text.normalize('NFD').replace(/\p{M}/gu, '').toLocaleLowerCase();
    const needle = fold(query.trim());
    const score = filter
        ? (item: T) => filter(item, query)
        : (item: T) => [item.label, ...(item.keywords ?? [])].some((text) => fold(text).includes(needle));
    return rankItems(items, score, limit);
}

/** Items by their group heading, in the order the groups first appear ('' for items without a group) */
export function commandGroups<T extends { group?: string }>(items: readonly T[]): { group: string; items: T[] }[] {
    const byGroup = new Map<string, T[]>();
    for (const item of items) {
        const key = item.group ?? '';
        byGroup.set(key, [...(byGroup.get(key) ?? []), item]);
    }
    return [...byGroup].map(([group, entries]) => ({ group, items: entries }));
}

/** Entries of a menu as far as filtering needs them */
interface FilterableEntry {
    type?: string;
    label?: string;
    items?: readonly FilterableEntry[];
    children?: FilterableEntry[];
}

/**
 * Filters menu entries by their label: groups keep their matching items, submenus their matching entries (or all
 * when their own label matches), separators are dropped.
 */
export function filterMenuEntries<T extends FilterableEntry>(
    entries: readonly T[],
    matches: (label: string) => boolean
): T[] {
    const result: T[] = [];
    for (const entry of entries) {
        if (entry.type === 'separator') continue;
        if (entry.items) {
            const items = filterMenuEntries(entry.items, matches);
            if (items.length) result.push({ ...entry, items });
        } else if (entry.label !== undefined && matches(entry.label)) {
            result.push(entry);
        } else if (entry.children) {
            const children = filterMenuEntries(entry.children, matches);
            if (children.length) result.push({ ...entry, children });
        }
    }
    return result;
}

/** The page that keeps the first item of the current page in view after the page size changed */
export function pageForSize(page: number, pageSize: number, nextSize: number): number {
    return Math.floor(((page - 1) * pageSize) / nextSize) + 1;
}

/**
 * Page buttons of a pagination: the pages around `page` (`siblingCount` on each side), `boundaryCount` pages at
 * both ends and `'ellipsis'` for each gap of more than one page (a gap of exactly one page shows that page)
 */
export function paginationItems(
    page: number,
    totalPages: number,
    siblingCount = 1,
    boundaryCount = 1
): (number | 'ellipsis')[] {
    const total = Math.max(1, Math.floor(totalPages));
    const current = Math.min(Math.max(1, Math.floor(page)), total);
    const shown = new Set<number>();
    for (let index = 1; index <= Math.min(boundaryCount, total); index++) {
        shown.add(index);
        shown.add(total + 1 - index);
    }
    for (let index = current - siblingCount; index <= current + siblingCount; index++) {
        if (index >= 1 && index <= total) shown.add(index);
    }
    const pages = [...shown].sort((a, b) => a - b);
    const items: (number | 'ellipsis')[] = [];
    for (const [index, value] of pages.entries()) {
        const previous = pages[index - 1];
        if (previous !== undefined && value - previous === 2) items.push(previous + 1);
        else if (previous !== undefined && value - previous > 2) items.push('ellipsis');
        items.push(value);
    }
    return items;
}

/** The items of a menu that can be highlighted, in order (submenus are portalled elsewhere) */
function menuItemsOf(field: Element): HTMLElement[] {
    const menu = field.closest('[role=menu]');
    return [...(menu?.querySelectorAll<HTMLElement>('[role^=menuitem]') ?? [])].filter(
        (item) => !item.hasAttribute('data-disabled')
    );
}

/**
 * Keys in the filter field of a searchable menu: arrow up/down (and Home/End with Ctrl) move the highlight through the
 * matching items while the focus stays in the field, Enter chooses the highlighted item, Escape and Tab reach the
 * menu. Returns the id of the newly highlighted item (for aria-activedescendant). Browser only.
 */
export function menuSearchKey(
    event: KeyboardEvent,
    menu: { setHighlightedValue: (value: string) => void }
): string | undefined {
    const field = event.currentTarget as HTMLElement;
    const items = menuItemsOf(field);
    const current = items.findIndex((item) => item.hasAttribute('data-highlighted'));
    let next: HTMLElement | undefined;
    if (event.key === 'ArrowDown') next = items[(current + 1) % items.length];
    else if (event.key === 'ArrowUp') next = items[current <= 0 ? items.length - 1 : current - 1];
    else if (event.key === 'Enter') {
        event.preventDefault();
        event.stopPropagation();
        items[current]?.click();
        return undefined;
    }
    // Other keys edit the text (Space, arrows left/right, Home/End) – the menu must not react to them
    if (event.key !== 'Escape' && event.key !== 'Tab') event.stopPropagation();
    if (!next) return undefined;
    event.preventDefault();
    menu.setHighlightedValue(next.dataset.value ?? '');
    return next.id;
}

/** Highlights the first matching item after the filter of a searchable menu changed; returns its id */
export function highlightFirstMenuItem(
    field: Element,
    menu: { setHighlightedValue: (value: string) => void }
): string | undefined {
    const first = menuItemsOf(field)[0];
    if (first) menu.setHighlightedValue(first.dataset.value ?? '');
    return first?.id;
}

/**
 * Closes an open menu on what it does not follow: the page scrolling (not a scroll inside a menu), the window being
 * resized or losing the focus (switching to another window). Returns the cleanup. Browser only.
 */
export function closeMenuOnPageEvents(
    close: () => void,
    events: { scroll?: boolean; resize?: boolean; blur?: boolean }
): () => void {
    const onScroll = (event: Event) => {
        if (event.target instanceof Element && event.target.closest('[data-scope=menu]')) return;
        close();
    };
    const listeners: [string, EventListener, AddEventListenerOptions][] = [];
    if (events.scroll) listeners.push(['scroll', onScroll, { capture: true, passive: true }]);
    if (events.resize) listeners.push(['resize', close, {}]);
    if (events.blur) listeners.push(['blur', close, {}]);
    for (const [type, listener, options] of listeners) window.addEventListener(type, listener, options);
    return () => {
        for (const [type, listener, options] of listeners) window.removeEventListener(type, listener, options);
    };
}
