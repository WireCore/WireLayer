// WCAG 2.2 AA contrast checks for a full colour set – used by the token tests for every built-in theme
// and exported so projects can test their own themes:
//   expect(checkTheme(myTheme)).toEqual([])
import { contrast, inGamut, oklchToRgb, over, parse, rgbToOklch, toHex, type Rgba } from './color.js';
import { colorTokens, modes, resolveColors, type ColorSet, type ColorToken, type Mode, type Theme } from './tokens.js';

/** 4.5:1 for text (1.4.3), 3:1 for UI component boundaries, selected states and icons (1.4.11). */
const TEXT = 4.5;
const NON_TEXT = 3;
/** Must match the `hover:opacity-*` of the solid button variants in @wirecore/wirelayer-recipes. */
const HOVER_OPACITY = 0.85;
/** Info and warn buttons fade less on hover (`hover:opacity-90`) – at 85 % white text would drop below 4.5:1. */
const HOVER_OPACITY_LIGHT_FILL = 0.9;
/** Tinted ("soft") buttons: `bg-<colour>/10`, on hover `/14` (the tint of badges and alert icons). */
const SOFT_HOVER_TINT = 0.14;
/** Tinted avatar as a button (`color`, `as="button"`): 14 % of the colour on the card, on hover 18 % */
const AVATAR_HOVER_TINT = 0.18;
/**
 * Editor colours – must match `editorColorTokens`/`editorColorValue` in @wirecore/wirelayer-recipes: text moved 25 % towards
 * `fg` (`color-mix(in srgb …)`), backgrounds as a 20 % tint.
 */
const EDITOR_TOKENS = ['primary', 'info', 'success', 'warn', 'danger', 'muted'] as const;
const EDITOR_TEXT_MIX = 0.25;
const EDITOR_BACKGROUND_TINT = 0.2;

const statuses = ['success', 'info', 'warn', 'danger'] as const;
const surfaces = ['bg', 'bg-2', 'card'] as const;

export interface ContrastResult {
    name: string;
    ratio: number;
    min: number;
}

interface Pair {
    name: string;
    foreground: Rgba;
    background: Rgba;
    min: number;
}

/** Every foreground/background combination the components use, with its required ratio. */
export function contrastPairs(colors: ColorSet): ContrastResult[] {
    const color = (token: ColorToken) => parse(colors[token]);
    /** A token painted onto an opaque surface, optionally with Tailwind opacity (`bg-success/14`). */
    const on = (token: ColorToken, surface: ColorToken, opacity = 1) => over(color(token), color(surface), opacity);
    const pair = (name: string, foreground: Rgba, background: Rgba, min: number): Pair => ({
        name,
        foreground,
        background,
        min,
    });

    const pairs: Pair[] = [
        // Body text, labels, helper text, placeholders, input addons
        ...surfaces.flatMap((surface) => [
            pair(`text-fg on ${surface}`, color('fg'), color(surface), TEXT),
            pair(`text-muted on ${surface}`, color('muted'), color(surface), TEXT),
        ]),
        // Error text, badges and alert icons in status colours
        ...statuses.flatMap((status) => [
            pair(`text-${status} on bg`, color(status), color('bg'), TEXT),
            pair(`text-${status} on card`, color(status), color('card'), TEXT),
            ...surfaces.map((surface) =>
                pair(`text-${status} on bg-${status}/14 (${surface})`, color(status), on(status, surface, 0.14), TEXT)
            ),
        ]),
        // Buttons, selected chips/segments/pages (primary), inverted surfaces (badge, tooltip, toast)
        pair('primary: text-on-primary on bg-primary', color('on-primary'), color('primary'), TEXT),
        pair('inverted: text-bg on bg-fg', color('bg'), color('fg'), TEXT),
        pair('secondary: text-fg on bg-line (bg)', color('fg'), on('line', 'bg'), TEXT),
        pair('secondary: text-fg on bg-line (card)', color('fg'), on('line', 'card'), TEXT),
        pair('secondary hover: text-fg on bg-line-2', color('fg'), on('line-2', 'bg'), TEXT),
        pair('success: text-on-success on bg-success', color('on-success'), color('success'), TEXT),
        pair('danger: text-on-danger on bg-danger', color('on-danger'), color('danger'), TEXT),
        pair('info: text-on-info on bg-info', color('on-info'), color('info'), TEXT),
        pair('warn: text-on-warn on bg-warn', color('on-warn'), color('warn'), TEXT),
        // Hover of solid buttons (`hover:opacity-85` fades text and background onto the page)
        ...(
            [
                ['primary', 'on-primary', 'primary'],
                ['success', 'on-success', 'success'],
                ['danger', 'on-danger', 'danger'],
            ] as const
        ).flatMap(([variant, text, fill]) =>
            surfaces.map((surface) =>
                pair(
                    `${variant} hover on ${surface}`,
                    on(text, surface, HOVER_OPACITY),
                    on(fill, surface, HOVER_OPACITY),
                    TEXT
                )
            )
        ),
        ...(
            [
                ['info', 'on-info', 'info'],
                ['warn', 'on-warn', 'warn'],
            ] as const
        ).flatMap(([variant, text, fill]) =>
            surfaces.map((surface) =>
                pair(
                    `${variant} hover on ${surface}`,
                    on(text, surface, HOVER_OPACITY_LIGHT_FILL),
                    on(fill, surface, HOVER_OPACITY_LIGHT_FILL),
                    TEXT
                )
            )
        ),
        // Button colour "contrast" (bg-fg text-bg), faded on hover
        ...surfaces.map((surface) =>
            pair(
                `contrast hover on ${surface}`,
                on('bg', surface, HOVER_OPACITY),
                on('fg', surface, HOVER_OPACITY),
                TEXT
            )
        ),
        // Coloured outline/text/soft buttons: text in the colour on the page and on its tint (hover); primary as
        // text colour (status colours are covered above)
        ...surfaces.map((surface) => pair(`text-primary on ${surface}`, color('primary'), color(surface), TEXT)),
        ...surfaces.flatMap((surface) =>
            (['primary', ...statuses] as const).map((tone) =>
                pair(
                    `soft ${tone} hover: text-${tone} on bg-${tone}/14 (${surface})`,
                    color(tone),
                    on(tone, surface, SOFT_HOVER_TINT),
                    TEXT
                )
            )
        ),
        // Tinted avatar buttons on hover (the avatar mixes its tint with the card)
        ...(['primary', ...statuses] as const).map((tone) =>
            pair(
                `avatar ${tone} hover: text-${tone} on ${tone}/18 (card)`,
                color(tone),
                on(tone, 'card', AVATAR_HOVER_TINT),
                TEXT
            )
        ),
        // Outline/text buttons in a colour: hover tint /8 on every surface
        ...surfaces.flatMap((surface) =>
            (['primary', ...statuses] as const).map((tone) =>
                pair(
                    `${tone} outline hover: text on bg-${tone}/8 (${surface})`,
                    color(tone),
                    on(tone, surface, 0.08),
                    TEXT
                )
            )
        ),
        // Highlight: marked text on the tint of its search term
        ...(['bg', 'card'] as const).flatMap((surface) =>
            (['primary', ...statuses] as const).map((tone) =>
                pair(`highlight: text-fg on bg-${tone}/25 (${surface})`, color('fg'), on(tone, surface, 0.25), TEXT)
            )
        ),
        // Editor: every text colour on the surfaces and on every background colour (default text included)
        ...surfaces.flatMap((surface) =>
            (['fg', ...EDITOR_TOKENS] as const).flatMap((text) => {
                const foreground = text === 'fg' ? color('fg') : over(color('fg'), color(text), EDITOR_TEXT_MIX);
                return [
                    pair(`editor: text ${text} on ${surface}`, foreground, color(surface), TEXT),
                    ...EDITOR_TOKENS.map((background) =>
                        pair(
                            `editor: text ${text} on background ${background} (${surface})`,
                            foreground,
                            on(background, surface, EDITOR_BACKGROUND_TINT),
                            TEXT
                        )
                    ),
                ];
            })
        ),
        // Menu: shortcut and danger item on a highlighted item; toast: meta line on the inverted surface
        pair('menu shortcut: text-muted on bg-line (card)', color('muted'), on('line', 'card'), TEXT),
        pair('menu danger item: text-danger on bg-line (card)', color('danger'), on('line', 'card'), TEXT),
        pair('toast: text-bg/65 on bg-fg', on('bg', 'fg', 0.65), color('fg'), TEXT),
        // Form control boundaries, selected states, invalid state, focus ring and focused field border
        ...surfaces.flatMap((surface) => [
            pair(`input border line-strong on ${surface}`, on('line-strong', surface), color(surface), NON_TEXT),
            pair(`selected/focus primary on ${surface}`, color('primary'), color(surface), NON_TEXT),
            pair(`invalid border danger on ${surface}`, color('danger'), color(surface), NON_TEXT),
            pair(`focus ring fg on ${surface}`, color('fg'), color(surface), NON_TEXT),
        ]),
    ];

    return pairs.map(({ name, foreground, background, min }) => ({
        name,
        ratio: contrast(foreground, background),
        min,
    }));
}

/** All pairs of a theme (in both modes) that miss their required contrast – empty when the theme passes. */
export function checkTheme(theme: Theme): (ContrastResult & { mode: Mode })[] {
    return modes.flatMap((mode) =>
        contrastPairs(resolveColors(theme, mode))
            .filter((result) => result.ratio < result.min)
            .map((result) => ({ ...result, mode }))
    );
}

/** A way to meet a missed contrast: a token and its new value, with the ratio the pair then reaches */
export interface ContrastFix {
    token: ColorToken;
    value: string;
    ratio: number;
}

/** A pair `checkTheme` reports, with suggestions to fix it */
export interface ContrastSuggestion extends ContrastResult {
    mode: Mode;
    /**
     * The nearest colour that meets it – its lightness moved in OKLCH, the hue kept (the chroma only lowered where
     * sRGB needs it) – without breaking another pair
     */
    color?: ContrastFix;
    /** A light or dark text colour (`on-*`) that meets it */
    on?: ContrastFix;
}

const ON_COLORS = ['#FFFFFF', '#050505'];
/** Steps of the OKLCH lightness while searching the nearest colour that meets a pair */
const LIGHTNESS_STEP = 0.005;

/**
 * The pairs `checkTheme` reports, each with suggestions: the nearest variant of a colour of the pair that meets it
 * (lightness moved in OKLCH, hue and chroma kept) and/or a light or dark `on-*` colour. Tokens the theme sets
 * itself are tried first. Empty when the theme passes.
 */
export function suggestThemeFixes(theme: Theme): ContrastSuggestion[] {
    return modes.flatMap((mode) => {
        const colors = resolveColors(theme, mode);
        const before = contrastPairs(colors);
        const failing = new Set(before.filter((result) => result.ratio < result.min).map((result) => result.name));
        const ratioOf = (set: ColorSet, name: string) => contrastPairs(set).find((result) => result.name === name)!;
        /** Meets the pair and every pair that passed before still passes */
        const fixes = (set: ColorSet, name: string) => {
            const results = contrastPairs(set);
            const own = results.find((result) => result.name === name)!;
            const broken = results.some((result) => result.ratio < result.min && !failing.has(result.name));
            return own.ratio >= own.min && !broken ? own.ratio : undefined;
        };
        const own = theme.colors[mode] ?? {};
        return before
            .filter((result) => result.ratio < result.min)
            .map((result): ContrastSuggestion => {
                // The tokens the pair depends on: changing them changes its ratio
                const involved = colorTokens.filter((token) => {
                    const shifted = { ...colors, [token]: toHex(over(parse('#808080'), parse(colors[token]), 0.5)) };
                    return Math.abs(ratioOf(shifted, result.name).ratio - result.ratio) > 1e-6;
                });
                const ordered = [...involved].sort((a, b) => Number(b in own) - Number(a in own));
                const suggestion: ContrastSuggestion = { ...result, mode };
                // Translucent tokens (lines) keep their alpha – no opaque replacement for them
                const opaque = ordered.filter((name) => !name.startsWith('on-') && parse(colors[name]).a === 1);
                for (const token of opaque) {
                    const fix = nearestLightness(colors, token, (set) => fixes(set, result.name));
                    if (fix) {
                        suggestion.color = fix;
                        break;
                    }
                }
                for (const token of ordered.filter((name) => name.startsWith('on-'))) {
                    for (const value of ON_COLORS) {
                        const ratio = fixes({ ...colors, [token]: value }, result.name);
                        if (ratio !== undefined && value.toLowerCase() !== colors[token].toLowerCase()) {
                            suggestion.on = { token, value, ratio };
                            break;
                        }
                    }
                    if (suggestion.on) break;
                }
                return suggestion;
            });
    });
}

/** The colour of `token` with the nearest OKLCH lightness (either way) for which `meets` gives a ratio */
function nearestLightness(
    colors: ColorSet,
    token: ColorToken,
    meets: (set: ColorSet) => number | undefined
): ContrastFix | undefined {
    const { l, c, h } = rgbToOklch(parse(colors[token]));
    for (let step = 1; step * LIGHTNESS_STEP <= 1; step++) {
        for (const lightness of [l - step * LIGHTNESS_STEP, l + step * LIGHTNESS_STEP]) {
            if (lightness < 0 || lightness > 1) continue;
            const value = toHex(oklchToRgb(lightness, chromaInGamut(lightness, c, h), h));
            const ratio = meets({ ...colors, [token]: value });
            if (ratio !== undefined) return { token, value, ratio };
        }
    }
    return undefined;
}

/** The chroma closest to `c` that sRGB can show at this lightness and hue – so the hue stays */
function chromaInGamut(l: number, c: number, h: number) {
    if (inGamut(l, c, h)) return c;
    let [low, high] = [0, c];
    for (let i = 0; i < 20; i++) {
        const middle = (low + high) / 2;
        if (inGamut(l, middle, h)) low = middle;
        else high = middle;
    }
    return low;
}
