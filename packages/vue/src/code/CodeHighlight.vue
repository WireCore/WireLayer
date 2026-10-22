<script setup lang="ts">
import { WrapText } from '@lucide/vue';
import {
    codeDiffLine,
    codeFileKind,
    codeHighlight as codeHighlightRecipe,
    diffLines,
    languageFromFileName,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, ref, useAttrs, useId, watch } from 'vue';
import Button from '../components/Button/Button.vue';
import CopyButton from '../components/CopyButton/CopyButton.vue';
import { useRecipe } from '../recipes.js';
import { useTranslations } from '../locale.js';
import { fileIcons } from './file-icons.js';
import { plainLines, tokenize, tokenStyle, type CodeLanguageInput, type CodeToken } from './highlight.js';

export interface CodeHighlightProps {
    code: string;
    /** Language id or alias, e.g. "ts", "vue", "json", "bash" (default: from `fileName`, else plain text) */
    language?: string;
    /** File name or title above the code */
    title?: string;
    /** File name in the header with an icon by its type; also sets the language when `language` is not given */
    fileName?: string;
    lineNumbers?: boolean;
    /** Lines to mark (1-based) */
    highlightLines?: number[];
    /** Copy button in the header */
    copyable?: boolean;
    /** The header with title, language and buttons (default true) */
    header?: boolean;
    /** Height limit (CSS length); longer code scrolls – or, with `expandable`, opens with "Show all code" */
    maxHeight?: string;
    /** With `maxHeight`: the code is cut off there and a button shows all of it */
    expandable?: boolean;
    /** Long lines wrap instead of scrolling – use with v-model:wrap */
    wrap?: boolean;
    /** A button in the header switches line wrapping */
    wrapToggle?: boolean;
    /** Marks lines starting with "+" as added and "-" as removed (e.g. a patch) */
    diff?: boolean;
    /** Added lines (1-based) – shown with "+" in front */
    addedLines?: number[];
    /** Removed lines (1-based) – shown with "−" in front */
    removedLines?: number[];
    /**
     * More grammars than the built-in ones (Shiki registrations or loaders, e.g. `() => import('shiki/langs/ruby.mjs')`)
     * – their licence is the responsibility of the app
     */
    languages?: CodeLanguageInput[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof codeHighlightRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<CodeHighlightProps>(), {
    language: undefined,
    copyable: true,
    header: true,
    wrap: undefined,
    languages: () => [],
});
const emit = defineEmits<{ 'update:wrap': [wrap: boolean] }>();
const codeHighlight = useRecipe('codeHighlight', codeHighlightRecipe, () => props.classes);
const attrs = useAttrs();
const t = useTranslations().codeHighlight;
const id = useId();
const lang = computed(() => props.language ?? (props.fileName ? languageFromFileName(props.fileName) : 'text'));
const internalWrap = ref(false);
const wrapped = computed(() => props.wrap ?? internalWrap.value);
const expanded = ref(false);
const collapsed = computed(() => !!props.expandable && !!props.maxHeight && !expanded.value);
const styles = computed(() => codeHighlight({ wrap: wrapped.value, collapsed: collapsed.value }));
const caption = computed(() => props.title ?? props.fileName);
const fileIcon = computed(() => (props.fileName ? fileIcons[codeFileKind(props.fileName)] : undefined));

// Plain on the server and in the first render; coloured as soon as Shiki has the tokens
const lines = ref<CodeToken[][]>(plainLines(props.code));
let request = 0;
watch(
    () => [props.code, lang.value, props.languages] as const,
    async ([code, language, languages], _, onCleanup) => {
        lines.value = plainLines(code);
        if (typeof window === 'undefined') return;
        const current = ++request;
        let cancelled = false;
        onCleanup(() => (cancelled = true));
        const tokens = await tokenize(code, language, languages);
        if (!cancelled && current === request) lines.value = tokens;
    },
    { immediate: true }
);
const marked = computed(() => new Set(props.highlightLines ?? []));
const kinds = computed(() =>
    props.diff || props.addedLines?.length || props.removedLines?.length
        ? diffLines(props.code.split('\n'), {
              added: props.addedLines,
              removed: props.removedLines,
              fromMarkers: props.diff,
          })
        : []
);
const markers = computed(() => !!(props.addedLines?.length || props.removedLines?.length));
const lineClass = (index: number) => {
    const kind = kinds.value[index];
    return kind ? styles.value.line({ class: codeDiffLine({ diff: kind }) }) : styles.value.line();
};
const showHeader = computed(
    () => props.header && (!!caption.value || lang.value !== 'text' || props.copyable || props.wrapToggle)
);
function toggleWrap() {
    const next = !wrapped.value;
    internalWrap.value = next;
    emit('update:wrap', next);
}
</script>

<template>
    <!-- Code block with syntax colours; the scroll area is focusable, the copy button copies the plain code -->
    <figure v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }">
        <figcaption v-if="showHeader" :class="styles.header()">
            <component :is="fileIcon" v-if="fileIcon" :class="styles.fileIcon()" aria-hidden="true" />
            <span v-if="caption" :class="styles.title()">{{ caption }}</span>
            <span v-if="lang !== 'text'" :class="styles.language()">{{ lang }}</span>
            <button
                v-if="wrapToggle"
                type="button"
                :class="styles.tool()"
                :aria-pressed="wrapped"
                :aria-label="t.wrap"
                :title="t.wrap"
                @click="toggleWrap"
            >
                <WrapText :class="styles.toolIcon()" aria-hidden="true" />
            </button>
            <CopyButton v-if="copyable" :value="code" :label="caption ? `${t.copy}: ${caption}` : t.copy" />
        </figcaption>
        <pre
            :id="expandable ? `${id}code` : undefined"
            :class="styles.pre()"
            :style="maxHeight && !expanded ? { maxHeight } : undefined"
            tabindex="0"
        ><code :class="styles.code()"><span v-for="(line, index) in lines" :key="index" :class="lineClass(index)" :data-highlighted="marked.has(index + 1) || undefined" :data-diff="kinds[index]"><span v-if="lineNumbers" :class="styles.lineNumber()" aria-hidden="true">{{ index + 1 }}</span><span v-if="markers" :class="styles.diffMarker()" aria-hidden="true">{{ kinds[index] === 'add' ? '+' : kinds[index] === 'remove' ? '−' : '' }}</span><span v-if="kinds[index]" :class="styles.srOnly()">{{ kinds[index] === 'add' ? t.added : t.removed }}: </span><span :class="styles.lineContent()"><span v-for="(token, position) in line" :key="position" :style="tokenStyle(token)">{{ token.content }}</span></span></span></code></pre>
        <div v-if="expandable && maxHeight" :class="styles.expand()">
            <Button
                size="sm"
                variant="text"
                :aria-expanded="expanded"
                :aria-controls="`${id}code`"
                @click="expanded = !expanded"
                >{{ expanded ? t.showLess : t.showMore }}</Button
            >
        </div>
    </figure>
</template>
