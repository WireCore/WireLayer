<script setup lang="ts">
import { useFieldContext } from '@ark-ui/vue/field';
import {
    Baseline,
    Bold,
    Code,
    CodeXml,
    Heading2,
    Heading3,
    Highlighter,
    Image as ImageIcon,
    Italic,
    Link,
    List,
    ListChecks,
    ListCollapse,
    ListOrdered,
    Minus,
    Pilcrow,
    Redo2,
    SquareCode,
    Strikethrough,
    Subscript as SubscriptIcon,
    Superscript as SuperscriptIcon,
    Table,
    TextAlignCenter,
    TextAlignEnd,
    TextAlignJustify,
    TextAlignStart,
    TextQuote,
    Underline,
    Undo2,
} from '@lucide/vue';
import type { AnyExtension } from '@tiptap/core';
import { Details, DetailsContent, DetailsSummary } from '@tiptap/extension-details';
import Image from '@tiptap/extension-image';
import { InvisibleCharacters } from '@tiptap/extension-invisible-characters';
import { TaskItem, TaskList } from '@tiptap/extension-list';
import { Mention } from '@tiptap/extension-mention';
import { Subscript } from '@tiptap/extension-subscript';
import { Superscript } from '@tiptap/extension-superscript';
import { TableKit } from '@tiptap/extension-table';
import { TextAlign } from '@tiptap/extension-text-align';
import { BackgroundColor, Color, TextStyle } from '@tiptap/extension-text-style';
import { CharacterCount, Placeholder } from '@tiptap/extensions';
import StarterKit from '@tiptap/starter-kit';
import { EditorContent, useEditor } from '@tiptap/vue-3';
import { BubbleMenu, FloatingMenu } from '@tiptap/vue-3/menus';
import {
    announce,
    countText,
    editor as editorRecipe,
    editorColorToken,
    editorColorTokens,
    editorColorValue,
    type EditorColorToken,
    type RecipeClasses,
    input as inputRecipe,
    prose as proseRecipe,
    sanitizeEditorHtml,
    toolbarIndexForKey,
} from '@wirecore/wirelayer-recipes';
import { computed, nextTick, normalizeClass, onBeforeUnmount, ref, useAttrs, useId, useTemplateRef, watch } from 'vue';
import Button from '../components/Button/Button.vue';
import Checkbox from '../components/Checkbox/Checkbox.vue';
import {
    closedMentions,
    editorHeadings,
    goToHeading,
    imageDropProps,
    mentionSuggestion,
    UploadPreview,
    type EditorMention,
    type MentionState,
} from './features.js';
import {
    defaultBubbleTools,
    defaultFloatingTools,
    defaultTools,
    insertImage,
    selectedImage,
    updateImage,
    isBarTool,
    setLink,
    tableActions,
    tools,
    type BarTool,
    type EditorTool,
    type TableAction,
} from './tools.js';
import { useTranslations } from '../locale.js';
import { useRecipe } from '../recipes.js';

const translations = useTranslations();

export interface EditorProps {
    /** HTML – use with v-model; an empty editor gives '' */
    modelValue?: string;
    defaultValue?: string;
    /** Toolbar buttons in order, '|' for a separator */
    toolbar?: (EditorTool | '|')[];
    disabled?: boolean;
    invalid?: boolean;
    /** Read only: the content can be read and selected, not changed (no toolbar) */
    readonly?: boolean;
    /**
     * Uploads an image file and gives its address – adds "Choose file" to the image bar and uploads pasted or dropped
     * images (with a preview meanwhile)
     */
    uploadImage?: (file: File) => Promise<string>;
    /** Text of the empty editor */
    placeholder?: string;
    /** The toolbar stays at the top while the page scrolls (offset: CSS variable --wc-editor-top) */
    stickyToolbar?: boolean;
    /** Characters and words below the editor */
    counter?: boolean;
    /** Maximum number of characters (shown in the counter) */
    maxLength?: number;
    /** Menu at selected text – true for the default tools or a list of tools; Alt+F10 moves into it */
    bubbleMenu?: boolean | EditorTool[];
    /** Menu in an empty line – true for the default tools or a list of tools; Alt+F10 moves into it */
    floatingMenu?: boolean | EditorTool[];
    /** The headings as links above the text */
    tableOfContents?: boolean;
    /** Suggestions after "@" (people, documents …) – inserted as a mention */
    mentions?: (query: string) => EditorMention[] | Promise<EditorMention[]>;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof editorRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<EditorProps>(), {
    modelValue: undefined,
    defaultValue: '',
    toolbar: () => defaultTools,
    disabled: undefined,
    invalid: undefined,
    uploadImage: undefined,
    bubbleMenu: false,
    floatingMenu: false,
    mentions: undefined,
});
const input = useRecipe('input', inputRecipe);
const prose = useRecipe('prose', proseRecipe);
const emit = defineEmits<{ 'update:modelValue': [html: string] }>();
const attrs = useAttrs();
const field = useFieldContext();
const editorStyles = useRecipe('editor', editorRecipe, () => props.classes);
const styles = computed(() => editorStyles({ sticky: props.stickyToolbar }));
const linkInput = input({ size: 'sm' });
const id = useId();
const t = translations.editor;
const toolTitle = (tool: EditorTool) => {
    const shortcut = tools[tool].shortcut;
    return shortcut ? `${t[tool]} (${t.shortcut(shortcut.letter, shortcut.shift)})` : t[tool];
};
const icons = {
    bold: Bold,
    italic: Italic,
    underline: Underline,
    strike: Strikethrough,
    heading2: Heading2,
    heading3: Heading3,
    bulletList: List,
    orderedList: ListOrdered,
    taskList: ListChecks,
    blockquote: TextQuote,
    code: Code,
    codeBlock: SquareCode,
    horizontalRule: Minus,
    link: Link,
    image: ImageIcon,
    table: Table,
    undo: Undo2,
    redo: Redo2,
    alignLeft: TextAlignStart,
    alignCenter: TextAlignCenter,
    alignRight: TextAlignEnd,
    alignJustify: TextAlignJustify,
    textColor: Baseline,
    backgroundColor: Highlighter,
    subscript: SubscriptIcon,
    superscript: SuperscriptIcon,
    details: ListCollapse,
    invisibleCharacters: Pilcrow,
    source: CodeXml,
};

const bubbleTools = computed(() =>
    props.bubbleMenu === true ? defaultBubbleTools : props.bubbleMenu || ([] as EditorTool[])
);
const floatingTools = computed(() =>
    props.floatingMenu === true ? defaultFloatingTools : props.floatingMenu || ([] as EditorTool[])
);
const menus = computed(() => bubbleTools.value.length > 0 || floatingTools.value.length > 0);
const allTools = computed(() => [
    ...new Set([
        ...props.toolbar.filter((item): item is EditorTool => item !== '|'),
        ...bubbleTools.value,
        ...floatingTools.value,
    ]),
]);

const mention = ref<MentionState>(closedMentions);
const isDisabled = computed(() => !!(props.disabled ?? field?.value.disabled));
const isInvalid = computed(() => !!(props.invalid ?? field?.value.invalid));
const contentAttributes = computed(() => {
    const label = attrs['aria-label'] as string | undefined;
    const classes = [styles.value.content(), prose()];
    if (props.placeholder) classes.push(styles.value.placeholder());
    if (allTools.value.includes('invisibleCharacters')) classes.push(styles.value.invisible());
    const attributes: Record<string, string> = {
        id: `${id}content`,
        role: 'textbox',
        'aria-multiline': 'true',
        class: classes.join(' '),
    };
    if (field?.value) attributes['aria-labelledby'] = field.value.ids.label;
    else if (label) attributes['aria-label'] = label;
    if (field?.value.ariaDescribedby) attributes['aria-describedby'] = field.value.ariaDescribedby;
    if (isInvalid.value) attributes['aria-invalid'] = 'true';
    if (field?.value.required) attributes['aria-required'] = 'true';
    if (isDisabled.value) {
        attributes['aria-disabled'] = 'true';
        attributes['data-disabled'] = '';
    }
    if (props.readonly) {
        attributes['aria-readonly'] = 'true';
        attributes.tabindex = '0';
    }
    if (menus.value) attributes['aria-keyshortcuts'] = 'Alt+F10';
    if (props.mentions) {
        attributes['aria-autocomplete'] = 'list';
        if (mention.value.open) {
            attributes['aria-controls'] = `${id}mentions`;
            if (mention.value.items.length) attributes['aria-activedescendant'] = `${id}mention${mention.value.active}`;
        }
    }
    return attributes;
});

// Alt+F10 moves into the bubble menu (text selected) or the floating menu (empty line)
const bubble = useTemplateRef<HTMLElement>('bubble');
const floating = useTemplateRef<HTMLElement>('floating');
function focusMenu(): boolean {
    const current = editor.value;
    if (!current) return false;
    const menu = current.state.selection.empty ? floating.value : bubble.value;
    const parent = menu?.parentElement;
    if (!menu || !parent?.isConnected || parent.style.visibility === 'hidden') return false;
    menu.querySelector<HTMLElement>('button:not(:disabled)')?.focus();
    return true;
}
function onMenuKeydown(event: KeyboardEvent) {
    if (event.key === 'Escape') {
        event.preventDefault();
        editor.value?.commands.focus();
        return;
    }
    onToolbarKeydown(event);
}

const extensions: AnyExtension[] = [
    StarterKit.configure({
        heading: { levels: [2, 3] },
        link: { openOnClick: false, defaultProtocol: 'https' },
        // Would append an empty paragraph on load and report a change before the user typed
        trailingNode: false,
    }),
    // Checkboxes named by their text and state
    TaskList,
    TaskItem.configure({
        nested: true,
        a11y: { checkboxLabel: (node, checked) => t.taskItem(node.textContent, checked) },
    }),
    TableKit.configure({ table: { resizable: false } }),
    Image,
    TextAlign.configure({ types: ['heading', 'paragraph'] }),
    TextStyle,
    Color,
    BackgroundColor,
    Subscript,
    Superscript,
    Details.configure({
        persist: true,
        renderToggleButton: ({ element, isOpen }) => {
            element.setAttribute('aria-label', t.detailsToggle(isOpen));
            element.setAttribute('aria-expanded', String(isOpen));
        },
    }),
    DetailsSummary,
    DetailsContent,
    InvisibleCharacters.configure({ visible: false, injectCSS: false }),
    UploadPreview.configure({ className: styles.value.uploading() }),
];
if (props.placeholder) extensions.push(Placeholder.configure({ placeholder: () => props.placeholder ?? '' }));
if (props.counter || props.maxLength) extensions.push(CharacterCount.configure({ limit: props.maxLength }));
if (props.mentions)
    extensions.push(
        Mention.configure({
            suggestion: mentionSuggestion(
                () => props.mentions,
                (state) => (mention.value = state)
            ),
        })
    );

// Re-read the toolbar state after every transaction (selection or content changed)
const tick = ref(0);
const editor = useEditor({
    content: props.modelValue ?? props.defaultValue,
    editable: !isDisabled.value && !props.readonly,
    extensions,
    editorProps: {
        attributes: contentAttributes.value,
        handleKeyDown: (_view, event) => event.altKey && event.key === 'F10' && focusMenu(),
        ...imageDropProps(
            () => props.uploadImage,
            ({ inserted, failed }) => announce(failed ? t.imageFailed : inserted ? t.imageUploaded : '')
        ),
    },
    onUpdate: ({ editor }) => emit('update:modelValue', editor.isEmpty ? '' : editor.getHTML()),
    onTransaction: () => tick.value++,
});

watch(contentAttributes, (attributes) => editor.value?.setOptions({ editorProps: { attributes } }));
watch([isDisabled, () => props.readonly], ([disabled, readonly]) => editor.value?.setEditable(!disabled && !readonly));
watch(
    () => props.modelValue,
    (html) => {
        const current = editor.value;
        if (!current || html === undefined || html === (current.isEmpty ? '' : current.getHTML())) return;
        current.commands.setContent(html, { emitUpdate: false });
    }
);
onBeforeUnmount(() => editor.value?.destroy());

// HTML source mode: a text field with the HTML; leaving it cleans the HTML and puts it back into the editor
const sourceMode = ref(false);
const source = ref('');
const sourceField = useTemplateRef<HTMLTextAreaElement>('sourceField');
function toggleSource() {
    const current = editor.value;
    if (!current) return;
    if (!sourceMode.value) {
        source.value = current.isEmpty ? '' : current.getHTML();
        sourceMode.value = true;
        void nextTick(() => sourceField.value?.focus());
        return;
    }
    sourceMode.value = false;
    current.commands.setContent(sanitizeEditorHtml(source.value), { emitUpdate: true });
    current.commands.focus();
}

const state = computed(() => {
    void tick.value;
    const current = editor.value;
    return Object.fromEntries(
        allTools.value.map((tool) => [
            tool,
            {
                active: tool === 'source' ? sourceMode.value : !!current && !!tools[tool].isActive?.(current),
                disabled:
                    !current ||
                    isDisabled.value ||
                    !!props.readonly ||
                    (sourceMode.value && tool !== 'source') ||
                    !tools[tool].can(current),
            },
        ])
    ) as Record<EditorTool, { active: boolean; disabled: boolean }>;
});
const buttons = computed(() => props.toolbar.filter((item): item is EditorTool => item !== '|'));

// Roving tabindex: the toolbar is one tab stop, arrow keys move inside it
const focused = ref<EditorTool>();
const tabStop = computed(() =>
    focused.value && !state.value[focused.value]?.disabled
        ? focused.value
        : buttons.value.find((tool) => !state.value[tool].disabled)
);
function onToolbarKeydown(event: KeyboardEvent) {
    const enabled = [...(event.currentTarget as HTMLElement).querySelectorAll<HTMLElement>('button:not(:disabled)')];
    const next = toolbarIndexForKey(
        event.key,
        enabled.indexOf(event.target as HTMLElement),
        enabled.length,
        event.currentTarget as HTMLElement
    );
    if (next === undefined) return;
    event.preventDefault();
    enabled[next]?.focus();
}

// Link, image, table and colours open a bar below the toolbar; Escape closes it and returns to the button
const bar = ref<BarTool | null>(null);
const barButton = ref<HTMLButtonElement>();
const linkUrl = ref('');
const linkField = useTemplateRef<HTMLInputElement>('linkField');
const imageUrl = ref('');
const imageAlt = ref('');
const imageDecorative = ref(false);
// An image is selected: the bar edits its address and alternative text instead of inserting a new one
const imageEditing = ref(false);
const imageAltField = useTemplateRef<HTMLInputElement>('imageAltField');
const uploading = ref(false);
const imageField = useTemplateRef<HTMLInputElement>('imageField');
const fileInput = useTemplateRef<HTMLInputElement>('fileInput');
const tableBar = useTemplateRef<HTMLElement>('tableBar');
const colorBar = useTemplateRef<HTMLElement>('colorBar');
async function toggleBar(tool: BarTool, button: HTMLButtonElement) {
    barButton.value = button;
    if (bar.value === tool) return closeBar();
    linkUrl.value = (editor.value?.getAttributes('link').href as string | undefined) ?? '';
    const image = editor.value ? selectedImage(editor.value) : null;
    imageEditing.value = !!image;
    imageUrl.value = image?.src ?? '';
    imageAlt.value = image?.alt ?? '';
    imageDecorative.value = !!image && !image.alt;
    bar.value = tool;
    await nextTick();
    if (tool === 'link') linkField.value?.focus();
    else if (tool === 'image') (imageEditing.value ? imageAltField : imageField).value?.focus();
    else if (tool === 'table') tableBar.value?.querySelector<HTMLButtonElement>('button:not(:disabled)')?.focus();
    else colorBar.value?.querySelector<HTMLButtonElement>('[aria-pressed=true]')?.focus();
}
function closeBar() {
    bar.value = null;
    barButton.value?.focus();
}
function onBarKey(event: KeyboardEvent) {
    if (event.key !== 'Escape' || event.defaultPrevented) return;
    event.preventDefault();
    event.stopPropagation();
    closeBar();
}
function applyLink(href: string) {
    if (editor.value) setLink(editor.value, href);
    bar.value = null;
}
const canInsertImage = computed(() => !!imageUrl.value.trim() && (!!imageAlt.value.trim() || imageDecorative.value));
function applyImage() {
    if (!editor.value || !canInsertImage.value) return;
    (imageEditing.value ? updateImage : insertImage)(
        editor.value,
        imageUrl.value,
        imageDecorative.value ? '' : imageAlt.value.trim()
    );
    bar.value = null;
}
async function onFile(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file || !props.uploadImage) return;
    uploading.value = true;
    try {
        imageUrl.value = await props.uploadImage(file);
    } finally {
        uploading.value = false;
    }
}
const tableState = computed(() => {
    void tick.value;
    const current = editor.value;
    return Object.fromEntries(
        (Object.keys(tableActions) as TableAction[]).map((action) => [
            action,
            !current || isDisabled.value || !tableActions[action].can(current),
        ])
    ) as Record<TableAction, boolean>;
});
function runTable(action: TableAction) {
    if (editor.value) tableActions[action].run(editor.value);
}

// Colours from the token palette (text in the colour, background as a tint)
const currentColor = computed(() => {
    void tick.value;
    const style = editor.value?.getAttributes('textStyle') ?? {};
    return {
        textColor: editorColorToken(style.color as string | undefined),
        backgroundColor: editorColorToken(style.backgroundColor as string | undefined),
    };
});
function applyColor(kind: 'textColor' | 'backgroundColor', token: EditorColorToken | undefined) {
    const current = editor.value;
    if (!current) return;
    const chain = current.chain().focus();
    if (kind === 'textColor') (token ? chain.setColor(editorColorValue(token, 'text')) : chain.unsetColor()).run();
    else (token ? chain.setBackgroundColor(editorColorValue(token, 'background')) : chain.unsetBackgroundColor()).run();
    bar.value = null;
}
const swatchStyle = (kind: 'textColor' | 'backgroundColor', token: EditorColorToken) =>
    kind === 'textColor'
        ? { color: editorColorValue(token, 'text') }
        : { backgroundColor: editorColorValue(token, 'background') };

// Counter and table of contents
const counts = computed(() => {
    void tick.value;
    const current = editor.value;
    if (!current) return { characters: 0, words: 0 };
    const storage = current.storage.characterCount;
    return storage
        ? { characters: storage.characters(), words: storage.words() }
        : countText(current.state.doc.textContent);
});
const atLimit = computed(() => props.maxLength !== undefined && counts.value.characters >= props.maxLength);
const headings = computed(() => {
    void tick.value;
    return props.tableOfContents && editor.value ? editorHeadings(editor.value) : [];
});

function onToolClick(tool: EditorTool, event: MouseEvent) {
    if (tool === 'source') return toggleSource();
    if (isBarTool(tool)) return toggleBar(tool, event.currentTarget as HTMLButtonElement);
    if (editor.value) tools[tool].run(editor.value);
}
function chooseMention(item: EditorMention) {
    mention.value.choose?.(item);
}
</script>

<template>
    <!--
        Rich-text editor (Tiptap): a toolbar (role="toolbar", one tab stop, arrow keys inside; toggle buttons with
        aria-pressed) above a multi-line textbox. Shortcuts as usual (Strg+B …). Gives HTML.
    -->
    <div
        :class="styles.base({ class: normalizeClass(attrs.class) })"
        :style="attrs.style"
        :data-invalid="isInvalid || undefined"
        :data-disabled="isDisabled || undefined"
    >
        <div
            v-if="!readonly"
            role="toolbar"
            :aria-label="t.toolbar"
            :class="styles.toolbar()"
            @keydown="onToolbarKeydown"
        >
            <template v-for="(item, index) in toolbar" :key="index">
                <span v-if="item === '|'" role="separator" aria-orientation="vertical" :class="styles.separator()" />
                <button
                    v-else
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t[item]"
                    :title="toolTitle(item)"
                    :aria-keyshortcuts="tools[item].shortcut?.aria"
                    :aria-pressed="tools[item].isActive && !isBarTool(item) ? state[item].active : undefined"
                    :aria-expanded="isBarTool(item) ? bar === item : undefined"
                    :aria-controls="isBarTool(item) && bar === item ? `${id}${item}` : undefined"
                    :disabled="state[item].disabled"
                    :tabindex="item === tabStop ? 0 : -1"
                    @focus="focused = item"
                    @mousedown.prevent
                    @click="onToolClick(item, $event)"
                >
                    <component :is="icons[item]" :class="styles.toolIcon()" aria-hidden="true" />
                </button>
            </template>
        </div>
        <div v-if="bar === 'link'" :id="`${id}link`" :class="styles.linkBar()" @keydown="onBarKey">
            <div :class="linkInput.base({ class: styles.linkField() })">
                <input
                    ref="linkField"
                    v-model="linkUrl"
                    type="url"
                    placeholder="https://"
                    :aria-label="t.linkUrl"
                    :class="linkInput.control()"
                    @keydown.enter.prevent="applyLink(linkUrl)"
                />
            </div>
            <Button size="sm" @click="applyLink(linkUrl)">{{ t.linkApply }}</Button>
            <Button v-if="state.link?.active" size="sm" variant="outline" @click="applyLink('')">
                {{ t.linkRemove }}
            </Button>
            <Button size="sm" variant="text" @click="closeBar">{{ t.linkCancel }}</Button>
        </div>
        <div v-if="bar === 'image'" :id="`${id}image`" :class="styles.linkBar()" @keydown="onBarKey">
            <div :class="linkInput.base({ class: styles.linkField() })">
                <input
                    ref="imageField"
                    v-model="imageUrl"
                    type="url"
                    placeholder="https://"
                    :aria-label="t.imageUrl"
                    :class="linkInput.control()"
                    @keydown.enter.prevent="applyImage"
                />
            </div>
            <div :class="linkInput.base({ class: styles.imageAlt() })">
                <input
                    ref="imageAltField"
                    v-model="imageAlt"
                    type="text"
                    :placeholder="t.imageAlt"
                    :aria-label="t.imageAlt"
                    :disabled="imageDecorative"
                    :class="linkInput.control()"
                    @keydown.enter.prevent="applyImage"
                />
            </div>
            <Checkbox :checked="imageDecorative" @update:checked="imageDecorative = $event === true">{{
                t.imageDecorative
            }}</Checkbox>
            <template v-if="uploadImage">
                <input
                    ref="fileInput"
                    type="file"
                    accept="image/*"
                    tabindex="-1"
                    aria-hidden="true"
                    :class="styles.fileInput()"
                    @change="onFile"
                />
                <Button size="sm" variant="outline" :loading="uploading" @click="fileInput?.click()">
                    {{ t.imageUpload }}
                </Button>
            </template>
            <Button size="sm" :disabled="!canInsertImage" @click="applyImage">{{
                imageEditing ? t.imageUpdate : t.imageInsert
            }}</Button>
            <Button size="sm" variant="text" @click="closeBar">{{ t.linkCancel }}</Button>
        </div>
        <div
            v-if="bar === 'table'"
            :id="`${id}table`"
            ref="tableBar"
            role="group"
            :aria-label="t.tableBar"
            :class="styles.linkBar()"
            @keydown="onBarKey"
        >
            <Button
                v-for="action in Object.keys(tableActions) as TableAction[]"
                :key="action"
                size="sm"
                :variant="action === 'insertTable' ? 'primary' : action === 'deleteTable' ? 'outline' : 'text'"
                :disabled="tableState[action]"
                @mousedown.prevent
                @click="runTable(action)"
            >
                {{ t.tableActions[action] }}
            </Button>
        </div>
        <div
            v-if="bar === 'textColor' || bar === 'backgroundColor'"
            :id="`${id}${bar}`"
            ref="colorBar"
            role="group"
            :aria-label="t[bar]"
            :class="styles.palette()"
            @keydown="onBarKey"
        >
            <span :class="styles.paletteLabel()" aria-hidden="true">{{ t[bar] }}</span>
            <button
                type="button"
                :class="styles.swatch()"
                :aria-label="t.colorDefault"
                :title="t.colorDefault"
                :aria-pressed="!currentColor[bar]"
                @mousedown.prevent
                @click="applyColor(bar, undefined)"
            >
                A
            </button>
            <button
                v-for="token in editorColorTokens"
                :key="token"
                type="button"
                :class="styles.swatch()"
                :style="swatchStyle(bar, token)"
                :aria-label="t.colors[token]"
                :title="t.colors[token]"
                :aria-pressed="currentColor[bar] === token"
                @mousedown.prevent
                @click="applyColor(bar, token)"
            >
                A
            </button>
        </div>
        <nav v-if="tableOfContents && headings.length" :aria-label="t.tableOfContents" :class="styles.toc()">
            <span :class="styles.tocTitle()" aria-hidden="true">{{ t.tableOfContents }}</span>
            <ul :class="styles.tocList()">
                <li v-for="heading in headings" :key="heading.pos">
                    <button
                        type="button"
                        :class="styles.tocLink()"
                        :data-level="heading.level"
                        @click="editor && goToHeading(editor, heading)"
                    >
                        {{ heading.text }}
                    </button>
                </li>
            </ul>
        </nav>
        <textarea
            v-if="sourceMode"
            ref="sourceField"
            v-model="source"
            :class="styles.source()"
            :aria-label="t.sourceField"
            spellcheck="false"
        />
        <EditorContent :editor="editor" :hidden="sourceMode || undefined" />
        <BubbleMenu v-if="editor && bubbleTools.length" :editor="editor">
            <div ref="bubble" role="toolbar" :aria-label="t.bubbleMenu" :class="styles.menu()" @keydown="onMenuKeydown">
                <button
                    v-for="(item, index) in bubbleTools"
                    :key="item"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t[item]"
                    :title="toolTitle(item)"
                    :aria-pressed="tools[item].isActive && !isBarTool(item) ? state[item].active : undefined"
                    :disabled="state[item].disabled"
                    :tabindex="index === 0 ? 0 : -1"
                    @mousedown.prevent
                    @click="onToolClick(item, $event)"
                >
                    <component :is="icons[item]" :class="styles.toolIcon()" aria-hidden="true" />
                </button>
            </div>
        </BubbleMenu>
        <FloatingMenu v-if="editor && floatingTools.length" :editor="editor">
            <div
                ref="floating"
                role="toolbar"
                :aria-label="t.floatingMenu"
                :class="styles.menu()"
                @keydown="onMenuKeydown"
            >
                <button
                    v-for="(item, index) in floatingTools"
                    :key="item"
                    type="button"
                    :class="styles.tool()"
                    :aria-label="t[item]"
                    :title="toolTitle(item)"
                    :aria-pressed="tools[item].isActive && !isBarTool(item) ? state[item].active : undefined"
                    :disabled="state[item].disabled"
                    :tabindex="index === 0 ? 0 : -1"
                    @mousedown.prevent
                    @click="onToolClick(item, $event)"
                >
                    <component :is="icons[item]" :class="styles.toolIcon()" aria-hidden="true" />
                </button>
            </div>
        </FloatingMenu>
        <template v-if="mentions">
            <ul
                v-if="mention.open"
                :id="`${id}mentions`"
                role="listbox"
                :aria-label="t.suggestions"
                :class="styles.suggestions()"
                :style="mention.rect ? { left: `${mention.rect.left}px`, top: `${mention.rect.top}px` } : undefined"
            >
                <li
                    v-for="(item, index) in mention.items"
                    :id="`${id}mention${index}`"
                    :key="item.id"
                    role="option"
                    :aria-selected="index === mention.active"
                    :data-highlighted="index === mention.active || undefined"
                    :class="styles.suggestion()"
                    @mousedown.prevent
                    @click="chooseMention(item)"
                >
                    {{ item.label }}
                </li>
                <li v-if="!mention.items.length" role="option" aria-disabled="true" :class="styles.suggestion()">
                    {{ t.noSuggestions }}
                </li>
            </ul>
            <span role="status" :class="styles.status()">{{
                mention.open ? t.suggestionCount(mention.items.length) : ''
            }}</span>
        </template>
        <div v-if="counter || maxLength !== undefined" :class="styles.footer()">
            <span :class="styles.limit()" :data-over="atLimit">{{ t.characters(counts.characters, maxLength) }}</span>
            <span>{{ t.words(counts.words) }}</span>
            <span v-if="maxLength !== undefined" role="status" :class="styles.status()">{{
                atLimit ? t.limitReached : ''
            }}</span>
        </div>
    </div>
</template>
