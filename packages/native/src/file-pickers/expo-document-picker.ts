// FileUpload source for expo-document-picker (optional peer dependency): `pickers={[documentPicker()]}`
import { getDocumentAsync } from 'expo-document-picker';
import { FileText } from 'lucide-react-native';
import type { FilePicker } from '../components/FileUpload/types.js';

export type { FilePicker, NativeFile } from '../components/FileUpload/types.js';

export interface DocumentPickerOptions {
    /** Own label instead of "Choose document" */
    label?: string;
    /** Copies the file into the app's cache, so it can be read right away (default true, as in Expo) */
    copyToCacheDirectory?: boolean;
}

/** Documents from the system's file picker (Files on iOS, the document picker on Android, the file dialog on the web) */
export function documentPicker(options: DocumentPickerOptions = {}): FilePicker {
    return {
        kind: 'documents',
        label: options.label,
        icon: FileText,
        async pick({ multiple, accept }) {
            const result = await getDocumentAsync({
                type: accept?.length ? accept : '*/*',
                multiple,
                copyToCacheDirectory: options.copyToCacheDirectory ?? true,
            });
            if (result.canceled) return [];
            return result.assets.map((asset) => ({
                uri: asset.uri,
                name: asset.name,
                type: asset.mimeType,
                size: asset.size,
            }));
        },
    };
}
