<script setup lang="ts">
import { FileUpload, useFileUpload } from '@ark-ui/vue/file-upload';
import { FileText, RotateCw, Upload, X } from '@lucide/vue';
import {
    announce,
    dragFilesState,
    fileUpload as fileUploadRecipe,
    isPreviewableImage,
    UploadQueue,
    type RecipeClasses,
    type UploadFunction,
    type UploadState,
} from '@wirecore/wirelayer-recipes';
import { computed, normalizeClass, onBeforeUnmount, onMounted, ref, shallowRef, useAttrs } from 'vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import { useTranslations } from '../../locale.js';
import { useRecipe } from '../../recipes.js';

const translations = useTranslations();

export interface FileUploadProps {
    /** Visible label of the upload */
    label?: string;
    /** Allowed types, e.g. "application/pdf" or ["image/png", "image/jpeg"] (presets: FileTypes.images …) */
    accept?: string | string[];
    maxFiles?: number;
    /** Maximum size per file in bytes */
    maxFileSize?: number;
    /** Text in the drop zone */
    dropzoneText?: string;
    /** Label of the button that opens the file dialog */
    triggerLabel?: string;
    /** Allowed types and sizes, e.g. "PDF, max. 5 MB" */
    hint?: string;
    /** Drop zone (default) or only the button */
    variant?: 'dropzone' | 'button';
    /** Uploads a file: report progress with onProgress(0–100), stop when the signal aborts; resolve when done */
    upload?: UploadFunction;
    /** Starts the upload as soon as files are added (otherwise with "Upload all") */
    autoUpload?: boolean;
    /** Thumbnails for images (object URLs, released again) */
    preview?: boolean;
    /** Files can be dropped anywhere in the window */
    fullscreenDrop?: boolean;
    /** Ctrl+V inside the component adds files from the clipboard */
    paste?: boolean;
    /**
     * The chosen files – use with v-model:files to remove or replace files from outside (otherwise the component
     * keeps them itself; `clear()` empties it)
     */
    files?: File[];
    /** The list of the chosen files below the drop zone – false when the app shows the files itself */
    showFileList?: boolean;
    disabled?: boolean;
    invalid?: boolean;
    required?: boolean;
    name?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof fileUploadRecipe>;
}

defineOptions({ inheritAttrs: false });
const props = withDefaults(defineProps<FileUploadProps>(), {
    maxFiles: 1,
    variant: 'dropzone',
    files: undefined,
    showFileList: true,
    disabled: undefined,
    invalid: undefined,
    required: undefined,
});
const fileUpload = useRecipe('fileUpload', fileUploadRecipe, () => props.classes);
const emit = defineEmits<{
    /** The chosen files changed (rejected files: `filesReject`) */
    filesChange: [files: File[]];
    'update:files': [files: File[]];
    /** Files that were not taken, with the reasons as codes (FILE_INVALID_TYPE, FILE_TOO_LARGE, TOO_MANY_FILES …) */
    filesReject: [rejections: { file: File; errors: string[] }[]];
    /** A file finished uploading (or failed) */
    uploadComplete: [file: File, state: UploadState];
}>();
const attrs = useAttrs();
const styles = fileUpload();
const several = computed(() => props.maxFiles > 1);
const errorText = (error: string) => translations.fileUpload.errors[error] ?? error;
const t = translations.fileUpload;

const states = shallowRef(new Map<File, UploadState>());
const queue = new UploadQueue(
    (file, options) => props.upload!(file, options),
    (next) => {
        for (const [file, state] of next) {
            const before = states.value.get(file)?.status;
            if (state.status === before) continue;
            if (state.status === 'done') announce(t.uploaded(file));
            if (state.status === 'error') announce(t.failed(file), { politeness: 'assertive' });
            if (state.status === 'done' || state.status === 'error') emit('uploadComplete', file, state);
        }
        states.value = next;
    }
);
const pending = computed(() =>
    [...states.value.values()].some((state) => state.status === 'pending' || state.status === 'error')
);
const drag = ref<'none' | 'accept' | 'reject'>('none');
const windowDrag = ref<'none' | 'accept' | 'reject'>('none');

const api = useFileUpload(
    computed(() => ({
        accept: props.accept,
        maxFiles: props.maxFiles,
        maxFileSize: props.maxFileSize,
        disabled: props.disabled,
        invalid: props.invalid,
        required: props.required,
        name: props.name,
        acceptedFiles: props.files,
        translations: translations.fileUpload,
        onFileChange: (details: { acceptedFiles: File[] }) => {
            emit('filesChange', details.acceptedFiles);
            emit('update:files', details.acceptedFiles);
            if (!props.upload) return;
            const known = new Set(states.value.keys());
            for (const file of known) if (!details.acceptedFiles.includes(file)) queue.remove(file);
            const added = details.acceptedFiles.filter((file) => !known.has(file));
            queue.add(added);
            if (props.autoUpload) for (const file of added) void queue.start(file);
        },
        onFileReject: (details: { files: { file: File; errors: string[] }[] }) =>
            emit(
                'filesReject',
                details.files.map(({ file, errors }) => ({ file, errors: [...errors] }))
            ),
    }))
);
/** Look of a file by its upload: failed, done or as before */
const statusOf = (file: File) => {
    const status = states.value.get(file)?.status;
    return fileUpload({ uploadStatus: status === 'error' ? 'failed' : status === 'done' ? 'done' : undefined });
};
const statusText = (state: UploadState) =>
    state.status === 'uploading' ? t.status.uploading(state.progress) : t.status[state.status];

function onDrag(event: DragEvent) {
    drag.value = dragFilesState([...(event.dataTransfer?.items ?? [])], {
        accept: props.accept,
        maxFiles: props.maxFiles,
        current: props.maxFiles > 1 ? api.value.acceptedFiles.length : 0,
    });
}
function onPaste(event: ClipboardEvent) {
    if (!props.paste || !event.clipboardData?.files.length) return;
    event.preventDefault();
    const count = event.clipboardData.files.length;
    if (api.value.setClipboardFiles(event.clipboardData)) announce(t.pasted(count));
}

// Drop anywhere: an overlay while files are over the window; the drop goes to the upload
let depth = 0;
const hasFiles = (event: DragEvent) => [...(event.dataTransfer?.types ?? [])].includes('Files');
function onWindowEnter(event: DragEvent) {
    if (!hasFiles(event) || api.value.disabled) return;
    depth++;
    windowDrag.value = dragFilesState([...(event.dataTransfer?.items ?? [])], {
        accept: props.accept,
        maxFiles: props.maxFiles,
        current: props.maxFiles > 1 ? api.value.acceptedFiles.length : 0,
    });
}
function onWindowLeave(event: DragEvent) {
    if (!hasFiles(event)) return;
    depth = Math.max(0, depth - 1);
    if (!depth) windowDrag.value = 'none';
}
function onWindowOver(event: DragEvent) {
    if (hasFiles(event) && windowDrag.value !== 'none') event.preventDefault();
}
function onWindowDrop(event: DragEvent) {
    if (!hasFiles(event) || windowDrag.value === 'none') return;
    event.preventDefault();
    depth = 0;
    windowDrag.value = 'none';
    api.value.setClipboardFiles(event.dataTransfer);
}
const windowEvents = [
    ['dragenter', onWindowEnter],
    ['dragleave', onWindowLeave],
    ['dragover', onWindowOver],
    ['drop', onWindowDrop],
] as const;
onMounted(() => {
    if (!props.fullscreenDrop) return;
    for (const [type, listener] of windowEvents) window.addEventListener(type, listener);
});
onBeforeUnmount(() => {
    for (const [type, listener] of windowEvents) window.removeEventListener(type, listener);
    queue.dispose();
});

defineExpose({
    /** Opens the file dialog (e.g. from a button elsewhere) */
    open: () => api.value.openFilePicker(),
    /** Removes all files */
    clear: () => api.value.clearFiles(),
    /** Uploads every file that is not uploaded yet */
    uploadAll: () => queue.startAll(),
});
</script>

<template>
    <!--
        Drop files onto the zone or choose them with the button (the keyboard path). Accepted files are listed with a
        remove button each; rejected files are announced with the reason. With `upload` every file shows its
        progress and can be cancelled or retried.
    -->
    <FileUpload.RootProvider
        :value="api"
        v-bind="{ ...attrs, class: styles.base({ class: normalizeClass(attrs.class) }) }"
        @paste="onPaste"
    >
        <FileUpload.Label v-if="label" :class="styles.label()">{{ label }}</FileUpload.Label>
        <FileUpload.Trigger v-if="variant === 'button'" as-child>
            <Button variant="outline" size="sm" :leading-icon="Upload">
                {{ triggerLabel ?? translations.fileUpload.trigger(several) }}
            </Button>
        </FileUpload.Trigger>
        <!-- A labelled group, not a focusable zone with a button inside (nested interactive controls) -->
        <FileUpload.Dropzone
            v-else
            disable-click
            role="group"
            :class="fileUpload({ drag }).dropzone()"
            @dragenter="onDrag"
            @dragover="onDrag"
            @dragleave="drag = 'none'"
            @drop="drag = 'none'"
        >
            <Upload :class="styles.dropzoneIcon()" aria-hidden="true" />
            <span v-if="drag !== 'none'" :class="fileUpload({ drag }).dragText()">
                {{ drag === 'accept' ? t.dropAccept(several) : t.dropReject }}
            </span>
            <span v-else :class="styles.dropzoneText()">
                {{ dropzoneText ?? translations.fileUpload.dropzoneText(several) }}
            </span>
            <FileUpload.Trigger as-child>
                <Button variant="outline" size="sm">
                    {{ triggerLabel ?? translations.fileUpload.trigger(several) }}
                </Button>
            </FileUpload.Trigger>
            <span v-if="hint" :class="styles.hint()">{{ hint }}</span>
        </FileUpload.Dropzone>
        <span v-if="variant === 'button' && hint" :class="styles.hint()">{{ hint }}</span>
        <FileUpload.ItemGroup v-if="showFileList && api.acceptedFiles.length" :class="styles.list()">
            <FileUpload.Item
                v-for="file in api.acceptedFiles"
                :key="file.name"
                :file="file"
                :class="statusOf(file).item()"
            >
                <FileUpload.ItemPreview v-if="preview && isPreviewableImage(file)" type="image/*">
                    <FileUpload.ItemPreviewImage :class="styles.thumbnail()" />
                </FileUpload.ItemPreview>
                <FileText v-else :class="styles.itemIcon()" aria-hidden="true" />
                <div :class="styles.itemText()">
                    <FileUpload.ItemName :class="styles.itemName()" />
                    <FileUpload.ItemSizeText :class="styles.itemSize()" />
                    <template v-if="states.get(file)">
                        <div
                            v-if="states.get(file)!.status === 'uploading'"
                            role="progressbar"
                            :aria-label="t.progress(file)"
                            aria-valuemin="0"
                            aria-valuemax="100"
                            :aria-valuenow="states.get(file)!.progress"
                            :class="styles.itemProgress()"
                        >
                            <div
                                :class="styles.itemProgressRange()"
                                :style="{ width: `${states.get(file)!.progress}%` }"
                            />
                        </div>
                        <span :class="statusOf(file).itemStatus()">
                            {{ statusText(states.get(file)!) }}
                        </span>
                    </template>
                </div>
                <div v-if="states.get(file)" :class="styles.itemActions()">
                    <IconButton
                        v-if="states.get(file)!.status === 'uploading'"
                        :icon="X"
                        :label="t.cancel(file)"
                        variant="text"
                        size="sm"
                        @click="queue.cancel(file)"
                    />
                    <IconButton
                        v-if="states.get(file)!.status === 'error' || states.get(file)!.status === 'cancelled'"
                        :icon="RotateCw"
                        :label="t.retry(file)"
                        variant="text"
                        size="sm"
                        @click="queue.start(file)"
                    />
                </div>
                <FileUpload.ItemDeleteTrigger :class="styles.itemDelete()">
                    <X :class="styles.itemDeleteIcon()" aria-hidden="true" />
                </FileUpload.ItemDeleteTrigger>
            </FileUpload.Item>
        </FileUpload.ItemGroup>
        <Button
            v-if="upload && !autoUpload && pending"
            variant="primary"
            size="sm"
            :leading-icon="Upload"
            @click="queue.startAll()"
        >
            {{ several ? t.uploadAll : t.upload }}
        </Button>
        <!-- Live region exists before errors appear, so they are announced -->
        <div :class="styles.errors()" role="alert">
            <ul v-if="api.rejectedFiles.length">
                <li v-for="rejection in api.rejectedFiles" :key="rejection.file.name">
                    {{ rejection.file.name }}: {{ rejection.errors.map(errorText).join(', ') }}
                </li>
            </ul>
        </div>
        <FileUpload.HiddenInput />
        <Teleport v-if="fullscreenDrop && windowDrag !== 'none'" to="body">
            <div :class="styles.overlay()" :data-drag="windowDrag" aria-hidden="true">
                <Upload :class="styles.overlayIcon()" />
                {{ windowDrag === 'accept' ? t.fullscreen : t.dropReject }}
            </div>
        </Teleport>
    </FileUpload.RootProvider>
</template>
