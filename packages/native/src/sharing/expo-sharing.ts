// shareFile on expo-file-system and expo-sharing (optional peer dependencies) – React Native has no downloads; files
// the components create (DataTable export, a PDF) go to the system share sheet instead.
import { File, Paths } from 'expo-file-system';
import { isAvailableAsync, shareAsync } from 'expo-sharing';

/** A file to share: the DataTable export (`onExport`) has this shape */
export interface ShareableFile {
    /** Name with extension, e.g. "server.csv" */
    filename: string;
    mimeType: string;
    /** Text (CSV) or bytes (xlsx, PDF) */
    data: string | Uint8Array;
}

/**
 * Writes the file to the app's cache and opens the share sheet (save to Files, mail, other apps):
 * `<DataTable onExport={shareFile} … />`. Resolves false when the device cannot share.
 */
export async function shareFile(file: ShareableFile, options: { dialogTitle?: string } = {}): Promise<boolean> {
    if (!(await isAvailableAsync())) return false;
    const target = new File(Paths.cache, file.filename);
    await target.write(file.data);
    await shareAsync(target.uri, { mimeType: file.mimeType, dialogTitle: options.dialogTitle });
    return true;
}

/**
 * Opens the share sheet for a file that is already on the device or online (`file://…` or `https://…`), e.g. the
 * `src` of a PdfViewer: `<PdfViewer onShare={shareUri} … />`. Remote files are downloaded to the cache first.
 */
export async function shareUri(uri: string, options: { mimeType?: string; dialogTitle?: string } = {}) {
    if (!(await isAvailableAsync())) return false;
    let local = uri;
    if (/^https?:/i.test(uri)) {
        const name = decodeURIComponent(uri.split(/[?#]/)[0]!.split('/').pop() || 'download');
        const downloaded = await File.downloadFileAsync(uri, new File(Paths.cache, name), { idempotent: true });
        local = downloaded.uri;
    }
    await shareAsync(local, { mimeType: options.mimeType, dialogTitle: options.dialogTitle });
    return true;
}
