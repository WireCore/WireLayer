import { Extension, type Editor } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet, type EditorView } from '@tiptap/pm/view';
import type { SuggestionOptions, SuggestionProps } from '@tiptap/suggestion';

// Editor features beyond the toolbar – the same in @wirecore/wirelayer-vue and @wirecore/wirelayer-react: image uploads by paste and
// drop with a preview, the headings for the table of contents, mention suggestions

const uploadKey = new PluginKey<DecorationSet>('wcImageUpload');

/** Shows a faded preview where a pasted or dropped image is being uploaded */
export const UploadPreview = Extension.create<{ className: string }>({
    name: 'wcImageUpload',
    addOptions: () => ({ className: '' }),
    addProseMirrorPlugins() {
        const className = this.options.className;
        return [
            new Plugin<DecorationSet>({
                key: uploadKey,
                state: {
                    init: () => DecorationSet.empty,
                    apply(tr, set) {
                        let next = set.map(tr.mapping, tr.doc);
                        const meta = tr.getMeta(uploadKey) as
                            { add: { id: string; pos: number; src: string } } | { remove: string } | undefined;
                        if (meta && 'add' in meta) {
                            const image = document.createElement('img');
                            image.src = meta.add.src;
                            image.alt = '';
                            image.className = className;
                            next = next.add(tr.doc, [Decoration.widget(meta.add.pos, image, { id: meta.add.id })]);
                        } else if (meta && 'remove' in meta) {
                            next = next.remove(next.find(undefined, undefined, (spec) => spec.id === meta.remove));
                        }
                        return next;
                    },
                },
                props: { decorations: (state) => uploadKey.getState(state) },
            }),
        ];
    },
});

let uploads = 0;

/** Image files of a paste or drop */
export const imageFiles = (list: FileList | null | undefined) =>
    [...(list ?? [])].filter((file) => file.type.startsWith('image/'));

/**
 * Uploads images and inserts them at `pos` once their address is there (a preview shows meanwhile). Calls `done`
 * with the number of inserted images and failures.
 */
export async function uploadImages(
    view: EditorView,
    files: File[],
    pos: number,
    upload: (file: File) => Promise<string>,
    done: (result: { inserted: number; failed: number }) => void
) {
    let inserted = 0;
    let failed = 0;
    await Promise.all(
        files.map(async (file) => {
            const id = `upload-${++uploads}`;
            const src = typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : '';
            view.dispatch(view.state.tr.setMeta(uploadKey, { add: { id, pos, src } }));
            try {
                const address = await upload(file);
                const set = uploadKey.getState(view.state);
                const at = set?.find(undefined, undefined, (spec) => spec.id === id)[0]?.from ?? pos;
                const node = view.state.schema.nodes.image?.create({ src: address, alt: '' });
                const tr = view.state.tr.setMeta(uploadKey, { remove: id });
                view.dispatch(node ? tr.insert(at, node) : tr);
                inserted++;
            } catch {
                view.dispatch(view.state.tr.setMeta(uploadKey, { remove: id }));
                failed++;
            } finally {
                if (src) URL.revokeObjectURL(src);
            }
        })
    );
    done({ inserted, failed });
}

/** Paste and drop of image files: uploads them (editorProps of Tiptap) */
export function imageDropProps(
    upload: () => ((file: File) => Promise<string>) | undefined,
    done: (result: { inserted: number; failed: number }) => void
) {
    return {
        handlePaste(view: EditorView, event: ClipboardEvent) {
            const files = imageFiles(event.clipboardData?.files);
            const uploader = upload();
            if (!files.length || !uploader) return false;
            event.preventDefault();
            void uploadImages(view, files, view.state.selection.from, uploader, done);
            return true;
        },
        handleDrop(view: EditorView, event: DragEvent, _slice: unknown, moved: boolean) {
            const files = imageFiles(event.dataTransfer?.files);
            const uploader = upload();
            if (moved || !files.length || !uploader) return false;
            event.preventDefault();
            const pos = view.posAtCoords({ left: event.clientX, top: event.clientY })?.pos ?? view.state.selection.from;
            void uploadImages(view, files, pos, uploader, done);
            return true;
        },
    };
}

/** A heading of the document for the table of contents */
export interface EditorHeading {
    level: number;
    text: string;
    pos: number;
}

/** The headings of the document in order */
export function editorHeadings(editor: Editor): EditorHeading[] {
    const headings: EditorHeading[] = [];
    editor.state.doc.descendants((node, pos) => {
        if (node.type.name === 'heading' && node.textContent.trim())
            headings.push({ level: Number(node.attrs.level), text: node.textContent, pos });
        return node.type.name !== 'heading';
    });
    return headings;
}

/** Jumps to a heading: scrolls it into view and puts the caret at its end */
export function goToHeading(editor: Editor, heading: EditorHeading) {
    const end = heading.pos + 1 + heading.text.length;
    editor.chain().focus().setTextSelection(end).scrollIntoView().run();
}

/** A person or thing to mention */
export interface EditorMention {
    id: string;
    label: string;
}

/** State of the mention suggestions (the component renders the listbox) */
export interface MentionState {
    open: boolean;
    items: EditorMention[];
    active: number;
    rect: { left: number; top: number } | null;
    /** Inserts a suggestion (a click on an option) */
    choose: ((item: EditorMention) => void) | null;
}

export const closedMentions: MentionState = { open: false, items: [], active: 0, rect: null, choose: null };

/**
 * Suggestion options of Tiptap's Mention: items from `find`, the state goes to `update`; arrows move, Enter/Tab
 * choose, Escape closes
 */
export function mentionSuggestion(
    find: () => ((query: string) => EditorMention[] | Promise<EditorMention[]>) | undefined,
    update: (state: MentionState) => void
): Omit<SuggestionOptions<EditorMention>, 'editor'> {
    return {
        char: '@',
        items: async ({ query }) => (await find()?.(query)) ?? [],
        render: () => {
            let state = closedMentions;
            let props: SuggestionProps<EditorMention> | undefined;
            const set = (next: Partial<MentionState>) => {
                state = { ...state, ...next };
                update(state);
            };
            const rect = () => {
                const box = props?.clientRect?.();
                return box ? { left: box.left, top: box.bottom + 4 } : null;
            };
            return {
                onStart: (next) => {
                    props = next;
                    set({
                        open: true,
                        items: next.items,
                        active: 0,
                        rect: rect(),
                        choose: (item) => props?.command(item),
                    });
                },
                onUpdate: (next) => {
                    props = next;
                    set({
                        items: next.items,
                        active: Math.min(state.active, Math.max(0, next.items.length - 1)),
                        rect: rect(),
                    });
                },
                onKeyDown: ({ event }) => {
                    if (!state.open) return false;
                    const count = state.items.length;
                    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                        if (!count) return true;
                        const step = event.key === 'ArrowDown' ? 1 : -1;
                        set({ active: (state.active + step + count) % count });
                        return true;
                    }
                    if ((event.key === 'Enter' || event.key === 'Tab') && count) {
                        const item = state.items[state.active]!;
                        props?.command(item);
                        return true;
                    }
                    if (event.key === 'Escape') {
                        set({ open: false });
                        return true;
                    }
                    return false;
                },
                onExit: () => {
                    props = undefined;
                    state = closedMentions;
                    update(closedMentions);
                },
            };
        },
    };
}
