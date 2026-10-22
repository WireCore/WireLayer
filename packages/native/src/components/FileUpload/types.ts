import type { IconComponent } from '../../utils/Icon.js';

/** A picked file: React Native has no File object – uploads read it from `uri` (fetch, FormData, expo-file-system) */
export interface NativeFile {
    /** Local URI of the file (file://, content://, blob: on the web) */
    uri: string;
    name: string;
    /** MIME type, e.g. "application/pdf" */
    type?: string;
    /** Size in bytes */
    size?: number;
}

/**
 * Where FileUpload gets files from – the app passes the pickers it ships with, e.g. `documentPicker()` from
 * `@wirecore/wirelayer-native/expo-document-picker` or `imageLibraryPicker()`/`cameraPicker()` from
 * `@wirecore/wirelayer-native/expo-image-picker` (optional peer dependencies), or its own.
 */
export interface FilePicker {
    /** Which kind of source – gives the default label ("Choose document", "Choose from photos", "Take photo") */
    kind?: 'documents' | 'photos' | 'camera';
    /** Own label of the source */
    label?: string;
    icon?: IconComponent;
    /** Opens the system picker; resolves with the chosen files ([] when cancelled) */
    pick: (options: { multiple: boolean; accept?: string[] }) => Promise<NativeFile[]>;
}
