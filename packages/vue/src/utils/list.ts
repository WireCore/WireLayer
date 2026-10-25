import { useFilter } from '@ark-ui/vue/locale';
import {
    filterListOptions,
    groupListOptions,
    indexListOptions,
    listOptionsForValues,
    listValues,
    toListOptions,
    type ListItemAccessors,
    type ListOption,
} from '@wirecore/wirelayer-recipes';
import { computed, ref, type Ref } from 'vue';

/**
 * Items of an option list, normalised (any item and value type), filtered by `query` and grouped. `ordered` is the
 * order of the DOM (groups together) – Ark's collection must follow it.
 */
export function useListOptions<T>(
    items: () => readonly T[],
    accessors: () => ListItemAccessors<T>,
    query: () => string = () => ''
) {
    // Accent-blind ("nu" finds "Nürnberg"): German search collation would tell u and ü apart
    const filters = useFilter({ sensitivity: 'base', usage: 'sort' });
    const options = computed(() => toListOptions(items(), accessors()));
    const visible = computed(() => filterListOptions(options.value, query(), filters.value.contains));
    const groups = computed(() => groupListOptions(visible.value));
    const ordered = computed(() => groups.value.flatMap((group) => group.options));
    return { options, visible, groups, ordered };
}

/**
 * The chosen options of a list: from v-model (or the own state without it), shown with their labels even when they
 * are not among the current items (server-side search, lazy loading). `commit` takes new options and emits their
 * original values – one value or null (single), an array (multiple).
 */
export function useListSelection<T>(options: {
    multiple: boolean;
    model: () => unknown;
    defaultValue: unknown;
    accessors: () => ListItemAccessors<T>;
    items: Ref<ListOption<T>[]>;
    emit: (value: unknown) => void;
}) {
    const internal = ref<unknown>(options.defaultValue ?? (options.multiple ? [] : null));
    // Options chosen in this component – their labels stay known when the items change
    const picked = ref<ListOption<T>[]>([]) as Ref<ListOption<T>[]>;
    const current = computed(() => (options.model() !== undefined ? options.model() : internal.value));
    const selected = computed(() =>
        listOptionsForValues(
            options.multiple
                ? ((current.value as unknown[] | null) ?? [])
                : listValues(current.value, options.items.value),
            indexListOptions(options.items.value, picked.value),
            options.accessors()
        )
    );
    const keys = computed(() => selected.value.map((option) => option.key));

    function commit(next: ListOption<T>[]) {
        picked.value = next;
        const values = next.map((option) => option.value);
        const value = options.multiple ? values : (values[0] ?? null);
        internal.value = value;
        options.emit(value);
    }
    /** Ark reports keys (and the matching collection items) */
    function commitKeys(nextKeys: string[], arkItems: ListOption<T>[] = []) {
        const index = indexListOptions(options.items.value, arkItems, selected.value);
        commit(nextKeys.map((key) => index.get(key)).filter((option) => option !== undefined));
    }
    return { selected, keys, commit, commitKeys };
}
