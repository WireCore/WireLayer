<script setup lang="ts">
import { useStore, type AnyFieldApi } from '@tanstack/vue-form';
import { ArrowDown, ArrowUp, Plus, Trash2 } from '@lucide/vue';
import { formList as formListRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useTemplateRef } from 'vue';
import Button from '../components/Button/Button.vue';
import IconButton from '../components/IconButton/IconButton.vue';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

export interface FormListProps {
    /** The TanStack Form field of the array (`<form.Field name="contacts" mode="array" v-slot="{ field }">`) */
    field: AnyFieldApi;
    /** Visible name of the list (legend), e.g. "Contacts" */
    label: string;
    /** The value of a new entry, e.g. `() => ({ name: '', email: '' })` */
    newItem: () => unknown;
    /** Name of an entry by position (1-based), e.g. (n) => `Contact ${n}` – names the buttons and announcements */
    itemLabel?: (position: number) => string;
    /** Text of the add button (default "Add entry") */
    addLabel?: string;
    /** Fewest entries: remove is disabled at this count */
    min?: number;
    /** Most entries: add is disabled at this count */
    max?: number;
    /** Up/down buttons and Alt+↑/↓ to move entries (default true) */
    reorderable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formListRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FormListProps>(), { min: 0, reorderable: true });
const formList = useRecipe('formList', formListRecipe, () => props.classes);
defineSlots<{
    /** One entry: its fields (e.g. `<form.Field :name="`contacts[${index}].name`">`) */
    item(props: {
        index: number;
        /** Name of the entry, e.g. "Contact 2" */
        itemLabel: string;
        remove: () => void;
        moveUp: () => void;
        moveDown: () => void;
    }): unknown;
}>();
const attrs = useAttrs();
const translations = useTranslations();
const t = translations.formList;
const styles = formList();
const list = useTemplateRef<HTMLElement>('list');
const value = useStore(props.field.store, (state) => state.value as unknown[] | undefined);
const count = computed(() => value.value?.length ?? 0);
const atMax = computed(() => props.max !== undefined && count.value >= props.max);
const atMin = computed(() => count.value <= props.min);
const status = ref('');
const itemName = (index: number) => (props.itemLabel ?? t.item)(index + 1);
const hidden = visuallyHidden();

const CONTROLS = 'input, select, textarea, button:not(:disabled), [tabindex]';
/** All controls, also disabled ones – to find the same control in another entry */
const ALL_CONTROLS = 'input, select, textarea, button, [tabindex]';
const items = () => [...(list.value?.querySelectorAll<HTMLElement>(':scope > li') ?? [])];
/** After the update: focus in entry `index` – what `pick` chooses, else its first control */
async function focusItem(index: number, pick?: (item: HTMLElement) => HTMLElement | null | undefined) {
    await nextTick();
    const item = items()[index];
    if (item) (pick?.(item) ?? item.querySelector<HTMLElement>(CONTROLS))?.focus();
}
const moveButton = (item: HTMLElement) =>
    item.querySelector<HTMLElement>('[data-action=up]:not(:disabled)') ??
    item.querySelector<HTMLElement>('[data-action=down]:not(:disabled)');

function add() {
    if (atMax.value) return;
    const index = count.value;
    props.field.pushValue(props.newItem());
    status.value = t.added(itemName(index));
    void focusItem(index);
}
async function remove(index: number) {
    if (atMin.value) return;
    const name = itemName(index);
    props.field.removeValue(index);
    status.value = t.removed(name);
    await nextTick();
    // The entry now in its place, the one before, or the add button
    const all = items();
    const next = all[Math.min(index, all.length - 1)];
    (
        next?.querySelector<HTMLElement>('[data-action="remove"]:not(:disabled)') ??
        list.value?.parentElement?.querySelector<HTMLElement>('[data-action="add"]')
    )?.focus();
}
/** Moves entry `index` by `step`; the focus follows the entry (its move button, or what `pick` chooses) */
function move(index: number, step: -1 | 1, pick: (item: HTMLElement) => HTMLElement | null | undefined = moveButton) {
    const target = index + step;
    if (target < 0 || target >= count.value) return;
    props.field.moveValue(index, target);
    status.value = t.moved(itemName(index), target + 1);
    void focusItem(target, pick);
}
// Alt+↑/↓ inside an entry moves it; the focus stays on the same control of the moved entry
function onItemKey(index: number, event: KeyboardEvent) {
    if (!props.reorderable || !event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    const controls = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>(ALL_CONTROLS)];
    const position = controls.indexOf(event.target as HTMLElement);
    move(index, event.key === 'ArrowUp' ? -1 : 1, (item) => {
        const same = item.querySelectorAll<HTMLElement>(ALL_CONTROLS)[position];
        return same && !same.matches(':disabled') ? same : moveButton(item);
    });
}
</script>

<template>
    <!--
        Repeated entries of a form: numbered list with move up/down (also Alt+↑/↓) and remove per entry, an add button,
        min/max limits; changes are announced and the focus follows the entry.
    -->
    <fieldset v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <legend :class="styles.legend()">{{ label }}</legend>
        <ol ref="list" :class="styles.list()">
            <li
                v-for="(_, index) in value ?? []"
                :key="index"
                :class="styles.item()"
                :aria-label="itemName(index)"
                @keydown="onItemKey(index, $event)"
            >
                <span :class="styles.index()" aria-hidden="true">{{ index + 1 }}</span>
                <div :class="styles.body()">
                    <slot
                        name="item"
                        :index="index"
                        :item-label="itemName(index)"
                        :remove="() => remove(index)"
                        :move-up="() => move(index, -1)"
                        :move-down="() => move(index, 1)"
                    />
                </div>
                <div :class="styles.actions()">
                    <template v-if="reorderable">
                        <IconButton
                            :icon="ArrowUp"
                            :label="t.moveUp(itemName(index))"
                            variant="text"
                            size="sm"
                            data-action="up"
                            :disabled="index === 0"
                            @click="move(index, -1)"
                        />
                        <IconButton
                            :icon="ArrowDown"
                            :label="t.moveDown(itemName(index))"
                            variant="text"
                            size="sm"
                            data-action="down"
                            :disabled="index === count - 1"
                            @click="move(index, 1)"
                        />
                    </template>
                    <IconButton
                        :icon="Trash2"
                        :label="t.remove(itemName(index))"
                        variant="text"
                        size="sm"
                        data-action="remove"
                        :disabled="atMin"
                        @click="remove(index)"
                    />
                </div>
            </li>
        </ol>
        <div :class="styles.footer()">
            <Button variant="outline" size="sm" :leading-icon="Plus" data-action="add" :disabled="atMax" @click="add">{{
                addLabel ?? t.add
            }}</Button>
            <span v-if="max !== undefined || min > 0" :class="styles.hint()">{{
                [min > 0 ? t.min(min) : '', max !== undefined ? t.max(max) : ''].filter(Boolean).join(' · ')
            }}</span>
        </div>
        <span role="status" :class="hidden">{{ status }}</span>
    </fieldset>
</template>
