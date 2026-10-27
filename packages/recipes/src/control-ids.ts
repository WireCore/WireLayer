// Own ids on Ark-based controls. Ark finds its parts by the ids it generates – an `id` attribute spread onto a part
// overwrites that id, and the machine loses the element (a Select list opened at the top left of the page). An own id
// therefore goes through Ark's `ids` option to the part a `<label for>` points to (trigger, input …).

export type ControlIds = Record<string, string | undefined>;

/**
 * The props for an Ark root that put an own `id` on `part`. Ark replaces its `ids` as a whole, so `fieldIds` are the
 * ones it would take from a surrounding Field (e.g. `{ label, hiddenSelect }` for a Select). Without an own id nothing
 * is passed (Ark keeps its ids); `standalone` drops the Field's ids (a second control inside a Field).
 */
export function controlIds(
    id: string | undefined,
    part: string,
    fieldIds: ControlIds = {},
    standalone = false
): { ids?: ControlIds } {
    const own = id ? { [part]: id } : {};
    if (standalone) return { ids: own };
    return id ? { ids: { ...fieldIds, ...own } } : {};
}
