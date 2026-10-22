<script setup lang="ts">
import {
    codeFileKind,
    codeTabs as codeTabsRecipe,
    toolbarIndexForKey,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, ref, useAttrs, useId, useTemplateRef } from 'vue';
import CopyButton from '../components/CopyButton/CopyButton.vue';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';
import CodeHighlight from './CodeHighlight.vue';
import { fileIcons } from './file-icons.js';
import type { CodeLanguageInput } from './highlight.js';

/** A file of CodeHighlightTabs */
export interface CodeFile {
    /** File name: the tab's text and icon, the language when `language` is not given */
    name: string;
    code: string;
    language?: string;
    /** Lines to mark (1-based) */
    highlightLines?: number[];
}

export interface CodeHighlightTabsProps {
    files: CodeFile[];
    /** Name of the shown file – use with v-model */
    modelValue?: string;
    defaultValue?: string;
    /** Accessible name of the tabs (default "Files") */
    label?: string;
    lineNumbers?: boolean;
    /** Copy button for the shown file (default true) */
    copyable?: boolean;
    /** Height limit of the code (CSS length) */
    maxHeight?: string;
    /** With `maxHeight`: cut off there, a button shows all of it */
    expandable?: boolean;
    /** Long lines wrap */
    wrap?: boolean;
    /** More grammars than the built-in ones (see CodeHighlight) */
    languages?: CodeLanguageInput[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof codeTabsRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CodeHighlightTabsProps>(), {
    modelValue: undefined,
    copyable: true,
    wrap: undefined,
    languages: () => [],
});
const emit = defineEmits<{ 'update:modelValue': [name: string] }>();
const codeTabs = useRecipe('codeTabs', codeTabsRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().codeHighlight;
const id = useId();
const styles = computed(() => codeTabs());
const list = useTemplateRef<HTMLElement>('list');
const internal = ref(props.defaultValue);
const activeName = computed(() => props.modelValue ?? internal.value ?? props.files[0]?.name);
const active = computed(() => props.files.find((file) => file.name === activeName.value) ?? props.files[0]);
const tabId = (index: number) => `${id}tab${index}`;

function select(name: string) {
    internal.value = name;
    emit('update:modelValue', name);
}
// Tabs pattern (APG): arrow keys move and select, Home/End jump
function onKeydown(event: KeyboardEvent, index: number) {
    const next = toolbarIndexForKey(event.key, index, props.files.length, list.value);
    if (next === undefined) return;
    event.preventDefault();
    select(props.files[next]!.name);
    void nextTick(() => list.value?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus());
}
</script>

<template>
    <!-- Several files: tabs with the file names (and an icon by type) above the shown code -->
    <div v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <div :class="styles.header()">
            <div ref="list" role="tablist" :aria-label="label ?? t.files" :class="styles.list()">
                <button
                    v-for="(file, index) in files"
                    :id="tabId(index)"
                    :key="file.name"
                    type="button"
                    role="tab"
                    :class="styles.tab()"
                    :aria-selected="file.name === active?.name"
                    :aria-controls="`${id}panel`"
                    :tabindex="file.name === active?.name ? 0 : -1"
                    @click="select(file.name)"
                    @keydown="onKeydown($event, index)"
                >
                    <component :is="fileIcons[codeFileKind(file.name)]" :class="styles.tabIcon()" aria-hidden="true" />
                    {{ file.name }}
                </button>
            </div>
            <div v-if="copyable && active" :class="styles.actions()">
                <CopyButton :value="active.code" :label="`${t.copy}: ${active.name}`" />
            </div>
        </div>
        <div
            v-if="active"
            :id="`${id}panel`"
            role="tabpanel"
            :aria-labelledby="tabId(files.indexOf(active))"
            :class="styles.panel()"
        >
            <CodeHighlight
                :key="active.name"
                :code="active.code"
                :language="active.language"
                :file-name="active.name"
                :highlight-lines="active.highlightLines"
                :line-numbers="lineNumbers"
                :max-height="maxHeight"
                :expandable="expandable"
                :wrap="wrap"
                :languages="languages"
                :header="false"
                :class="styles.panelCode()"
            />
        </div>
    </div>
</template>
