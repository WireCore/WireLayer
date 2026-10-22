// FileUpload sources for expo-image-picker (optional peer dependency):
// `pickers={[imageLibraryPicker(), cameraPicker()]}`
import {
    launchCameraAsync,
    launchImageLibraryAsync,
    requestCameraPermissionsAsync,
    type ImagePickerAsset,
    type ImagePickerResult,
} from 'expo-image-picker';
import { Camera, Image } from 'lucide-react-native';
import type { FilePicker, NativeFile } from '../components/FileUpload/types.js';

export type { FilePicker, NativeFile } from '../components/FileUpload/types.js';

export interface ImagePickerOptions {
    /** Own label instead of "Choose from photos" / "Take photo" */
    label?: string;
    /** Videos too (default: images only) */
    videos?: boolean;
    /** JPEG quality 0–1 (default 0.8) */
    quality?: number;
}

const toFiles = (result: ImagePickerResult): NativeFile[] =>
    result.canceled
        ? []
        : result.assets.map((asset: ImagePickerAsset) => ({
              uri: asset.uri,
              name: asset.fileName ?? asset.uri.split('/').pop() ?? 'image',
              type: asset.mimeType,
              size: asset.fileSize,
          }));

/** Photos (and videos) from the photo library */
export function imageLibraryPicker(options: ImagePickerOptions = {}): FilePicker {
    return {
        kind: 'photos',
        label: options.label,
        icon: Image,
        async pick({ multiple }) {
            return toFiles(
                await launchImageLibraryAsync({
                    mediaTypes: options.videos ? ['images', 'videos'] : ['images'],
                    allowsMultipleSelection: multiple,
                    quality: options.quality ?? 0.8,
                })
            );
        },
    };
}

/** A new photo from the camera – asks for the permission first */
export function cameraPicker(options: ImagePickerOptions = {}): FilePicker {
    return {
        kind: 'camera',
        label: options.label,
        icon: Camera,
        async pick() {
            const permission = await requestCameraPermissionsAsync();
            if (!permission.granted) return [];
            return toFiles(
                await launchCameraAsync({
                    mediaTypes: options.videos ? ['images', 'videos'] : ['images'],
                    quality: options.quality ?? 0.8,
                })
            );
        },
    };
}
