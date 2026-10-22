import { normalizeClass, type StyleValue } from 'vue';

/**
 * Splits fallthrough attrs for components whose root is a wrapper:
 * class/style go to the wrapper, everything else to the inner control.
 */
export function splitAttrs(attrs: Record<string, unknown>) {
    const { class: className, style, ...rest } = attrs;
    return { className: normalizeClass(className), style: style as StyleValue, rest };
}
