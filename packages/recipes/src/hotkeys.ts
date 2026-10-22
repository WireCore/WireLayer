// Keyboard shortcuts: matching ("mod+k", sequences "g i"), a central registry with one document listener (Vue
// useHotkeys, React useHotkeys, CommandPalette, HotkeysDialog) and the display per platform (⌘ vs. Strg).

import { isDevelopment } from './dev.js';

interface KeyLike {
    key: string;
    ctrlKey: boolean;
    metaKey: boolean;
    altKey: boolean;
    shiftKey: boolean;
    target?: EventTarget | null;
}

/** Keys that only modify – they never complete a step of a shortcut */
const modifierKeys = new Set(['control', 'meta', 'alt', 'shift', 'altgraph', 'capslock', 'os', 'hyper', 'super']);

/** Other spellings of keys in shortcuts ("esc", "space", "up") */
const keyAliases: Record<string, string> = {
    esc: 'escape',
    space: ' ',
    spacebar: ' ',
    up: 'arrowup',
    down: 'arrowdown',
    left: 'arrowleft',
    right: 'arrowright',
    return: 'enter',
    del: 'delete',
    plus: '+',
};

/** The steps of a shortcut: "g i" → ["g", "i"]; "mod+k" → ["mod+k"] (a lone "+" or " " stays a key) */
export function hotkeySteps(hotkey: string): string[] {
    const trimmed = hotkey.trim().toLowerCase();
    if (trimmed === '' || trimmed === '+') return [trimmed || ' '];
    return trimmed.split(/\s+/);
}

/** Modifiers and key of one step: "mod+shift+k" → { mods: ['mod', 'shift'], key: 'k' } */
export function parseHotkeyStep(step: string): { mods: Set<string>; key: string } {
    const parts = step.toLowerCase().split('+');
    // "mod++" (plus key): the empty parts at the end are the "+"
    const last = parts.pop();
    const key = last === '' ? '+' : (last ?? '');
    const mods = new Set(parts.filter(Boolean));
    return { mods, key: keyAliases[key] ?? key };
}

/** Whether a key event is the step: key and modifiers ("mod" is Ctrl or ⌘). Shift only counts for letters or when named */
export function matchesHotkeyStep(event: KeyLike, step: string): boolean {
    const { mods, key } = parseHotkeyStep(step);
    const ctrl = mods.has('ctrl') || (mods.has('mod') && !event.metaKey);
    const meta = mods.has('meta') || (mods.has('mod') && !event.ctrlKey);
    if (event.key.toLowerCase() !== key) return false;
    if (event.ctrlKey !== ctrl || event.metaKey !== meta || event.altKey !== mods.has('alt')) return false;
    return mods.has('shift') ? event.shiftKey : !(event.shiftKey && /^[a-z]$/.test(key));
}

/** Whether the shortcut has Ctrl, ⌘ or Alt in its first step – those also fire while typing in a field */
export function hasCommandModifier(hotkey: string): boolean {
    const { mods } = parseHotkeyStep(hotkeySteps(hotkey)[0]!);
    return mods.has('mod') || mods.has('ctrl') || mods.has('meta') || mods.has('alt');
}

/** A form field (input, textarea, select) or an editable element – typing there is no shortcut */
export function isEditableTarget(target: EventTarget | null | undefined): boolean {
    const element = target as HTMLElement | null | undefined;
    if (!element || typeof element.tagName !== 'string') return false;
    return element.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(element.tagName);
}

/** One normalised name per shortcut, to find conflicts: "Mod+K" and "mod+k" are the same */
export function normalizeHotkey(hotkey: string): string {
    return hotkeySteps(hotkey)
        .map((step) => {
            const { mods, key } = parseHotkeyStep(step);
            const order = ['mod', 'ctrl', 'meta', 'alt', 'shift'].filter((mod) => mods.has(mod));
            return [...order, key === ' ' ? 'space' : key].join('+');
        })
        .join(' ');
}

export interface HotkeyOptions {
    /** What the shortcut does – listed in the HotkeysDialog */
    description?: string;
    /** Heading in the HotkeysDialog, e.g. "Navigation" */
    group?: string;
    /**
     * Fire while the focus is in a text field, select or editable element. Default: only shortcuts with Ctrl/⌘/Alt
     * do; plain keys ("?", "g i") are typing there
     */
    enableInInputs?: boolean;
    /** Prevents the browser's own action of the keys (default true) */
    preventDefault?: boolean;
    /** Switched off for now (default true) */
    enabled?: boolean;
    /** Not listed in the HotkeysDialog */
    hidden?: boolean;
}

export interface HotkeyEntry extends HotkeyOptions {
    id: number;
    hotkey: string;
    handler: (event: KeyboardEvent) => void;
}

/** Steps of a sequence must follow each other within this many ms */
export const HOTKEY_SEQUENCE_TIMEOUT = 1000;

/**
 * All registered shortcuts with one keydown listener on the document (added with the first entry). Handlers of the
 * same shortcut all run; registering one twice warns in development.
 */
export class HotkeyRegistry {
    #entries = new Map<number, HotkeyEntry>();
    #listeners = new Set<() => void>();
    #nextId = 1;
    #recent: { event: KeyLike; time: number }[] = [];
    #target: Document | null = null;
    #version = 0;

    /** Adds a shortcut; returns the function that removes it again */
    register(hotkey: string, handler: (event: KeyboardEvent) => void, options: HotkeyOptions = {}): () => void {
        const id = this.#nextId++;
        const entry: HotkeyEntry = { ...options, id, hotkey, handler };
        if (isDevelopment() && entry.enabled !== false) {
            const same = this.conflictsWith(hotkey);
            if (same.length)
                console.warn(
                    `[WireLayer] Shortcut "${hotkey}" is registered more than once` +
                        (entry.description ? ` ("${entry.description}")` : '') +
                        `: ${same.map((other) => other.description ?? 'unnamed').join(', ')}`
                );
        }
        this.#entries.set(id, entry);
        this.#attach();
        this.#changed();
        return () => {
            if (!this.#entries.delete(id)) return;
            this.#changed();
            if (!this.#entries.size) this.#detach();
        };
    }

    /** Enabled entries with the same (normalised) shortcut */
    conflictsWith(hotkey: string): HotkeyEntry[] {
        const name = normalizeHotkey(hotkey);
        return [...this.#entries.values()].filter(
            (entry) => entry.enabled !== false && normalizeHotkey(entry.hotkey) === name
        );
    }

    /** Shortcuts registered more than once: normalised name → entries */
    conflicts(): Map<string, HotkeyEntry[]> {
        const byName = new Map<string, HotkeyEntry[]>();
        for (const entry of this.#entries.values()) {
            if (entry.enabled === false) continue;
            const name = normalizeHotkey(entry.hotkey);
            byName.set(name, [...(byName.get(name) ?? []), entry]);
        }
        return new Map([...byName].filter(([, entries]) => entries.length > 1));
    }

    /** The entries as registered (for the HotkeysDialog: enabled, not hidden, with a description) */
    list(options: { all?: boolean } = {}): HotkeyEntry[] {
        const entries = [...this.#entries.values()];
        return options.all
            ? entries
            : entries.filter((entry) => entry.enabled !== false && !entry.hidden && !!entry.description);
    }

    /** Called after every change of the entries; returns the function that stops listening */
    subscribe(listener: () => void): () => void {
        this.#listeners.add(listener);
        return () => this.#listeners.delete(listener);
    }

    /** Changes with every registration (for useSyncExternalStore) */
    get version(): number {
        return this.#version;
    }

    /** Runs the handlers matching a key event – the document listener calls it; tests may, too */
    handle = (event: KeyboardEvent) => {
        if (event.isComposing || modifierKeys.has(event.key.toLowerCase())) return;
        const now = Date.now();
        this.#recent = [
            ...this.#recent.filter((step) => now - step.time <= HOTKEY_SEQUENCE_TIMEOUT),
            { event, time: now },
        ].slice(-8);
        const editable = isEditableTarget(event.target);
        let matchedSequence = false;
        for (const entry of [...this.#entries.values()]) {
            if (entry.enabled === false) continue;
            if (editable && !(entry.enableInInputs ?? hasCommandModifier(entry.hotkey))) continue;
            const steps = hotkeySteps(entry.hotkey);
            const recent = this.#recent.slice(-steps.length);
            if (recent.length < steps.length) continue;
            if (!steps.every((step, index) => matchesHotkeyStep(recent[index]!.event, step))) continue;
            if (steps.length > 1) matchedSequence = true;
            if (entry.preventDefault !== false) event.preventDefault();
            entry.handler(event);
        }
        // A finished sequence starts over (so "g g" does not fire on every further "g")
        if (matchedSequence) this.#recent = [];
    };

    #attach() {
        if (this.#target || typeof document === 'undefined') return;
        this.#target = document;
        document.addEventListener('keydown', this.handle);
    }

    #detach() {
        this.#target?.removeEventListener('keydown', this.handle as EventListener);
        this.#target = null;
        this.#recent = [];
    }

    #changed() {
        this.#version++;
        for (const listener of this.#listeners) listener();
    }
}

/** The registry shared by all components and hooks of a page */
export const hotkeyRegistry = new HotkeyRegistry();

/** Whether the device is an Apple one (⌘ instead of Strg); false on the server */
export function isApplePlatform(): boolean {
    if (typeof navigator === 'undefined') return false;
    const platform =
        (navigator as Navigator & { userAgentData?: { platform?: string } }).userAgentData?.platform ??
        navigator.platform ??
        '';
    return /mac|iphone|ipad|ipod/i.test(platform);
}

/** Names of keys for the display (translations.hotkeys.keys) */
export interface HotkeyKeyNames {
    ctrl: string;
    alt: string;
    shift: string;
    meta: string;
    space: string;
    enter: string;
    escape: string;
    backspace: string;
    delete: string;
    tab: string;
}

const appleSymbols: Record<string, string> = { mod: '⌘', meta: '⌘', ctrl: '⌃', alt: '⌥', shift: '⇧' };
const arrows: Record<string, string> = { arrowup: '↑', arrowdown: '↓', arrowleft: '←', arrowright: '→' };

/**
 * The keys of a shortcut for the display, per step: "mod+shift+k" → [["Ctrl", "Shift", "K"]] or [["⌘", "⇧", "K"]]
 * on Apple devices; "g i" → [["G"], ["I"]]
 */
export function formatHotkey(hotkey: string, names: HotkeyKeyNames, apple = false): string[][] {
    return hotkeySteps(hotkey).map((step) => {
        const { mods, key } = parseHotkeyStep(step);
        const modifiers = ['mod', 'ctrl', 'meta', 'alt', 'shift']
            .filter((mod) => mods.has(mod))
            .map((mod) => {
                if (apple) return appleSymbols[mod]!;
                if (mod === 'mod' || mod === 'ctrl') return names.ctrl;
                return names[mod as 'alt' | 'shift' | 'meta'];
            });
        const named: Record<string, string> = {
            ' ': names.space,
            enter: apple ? '↩' : names.enter,
            escape: names.escape,
            backspace: apple ? '⌫' : names.backspace,
            delete: names.delete,
            tab: names.tab,
            ...arrows,
        };
        const label = named[key] ?? (key.length === 1 ? key.toUpperCase() : key[0]!.toUpperCase() + key.slice(1));
        // Strg and Ctrl appear once even for "mod+ctrl"
        return [...new Set(modifiers), label];
    });
}

/** The shortcut as one text, e.g. for aria-keyshortcuts-like hints: "Ctrl+K", "⌘⇧K", "G then I" */
export function formatHotkeyText(hotkey: string, names: HotkeyKeyNames, apple = false, then = ' '): string {
    return formatHotkey(hotkey, names, apple)
        .map((keys) => keys.join(apple ? '' : '+'))
        .join(then);
}
