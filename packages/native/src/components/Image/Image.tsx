import { image } from '@wirecore/wirelayer-recipes/native';
import { useState } from 'react';
import { Image as NativeImage, Pressable, type ImageProps as NativeImageProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { ImageViewer } from '../../utils/ImageViewer.js';

export interface ImageProps extends Omit<NativeImageProps, 'source' | 'src' | 'alt'> {
    src: string;
    /** Describes the picture (empty for decoration) */
    alt: string;
    /** A tap opens the picture full screen: pinch or buttons zoom, rotate */
    preview?: boolean;
    /** Larger file for the preview (default src) */
    previewSrc?: string;
    /** Shown when loading fails, also in the preview */
    fallbackSrc?: string;
    className?: string;
}

/** A picture with alternative text and fallback; with `preview` it opens full screen with zoom */
export function Image({
    src,
    alt,
    preview = false,
    previewSrc,
    fallbackSrc,
    className,
    onError,
    ...props
}: ImageProps) {
    const translations = useTranslations();
    const styles = image();
    const [failed, setFailed] = useState<string | null>(null);
    const [open, setOpen] = useState(false);
    const source = failed === src && fallbackSrc ? fallbackSrc : src;
    const picture = (
        <NativeImage
            {...props}
            source={{ uri: source }}
            alt={preview ? '' : alt}
            aria-hidden={preview || !alt || undefined}
            className={styles.base({ class: className })}
            onError={(event) => {
                setFailed(src);
                onError?.(event);
            }}
        />
    );
    if (!preview) return picture;
    return (
        <>
            <Pressable
                role="button"
                aria-label={translations.image.preview(alt)}
                {...({ 'aria-haspopup': 'dialog' } as object)}
                className={styles.trigger()}
                onPress={() => setOpen(true)}
            >
                {picture}
            </Pressable>
            <ImageViewer
                images={[{ src: failed === src && fallbackSrc ? fallbackSrc : (previewSrc ?? src), alt }]}
                page={0}
                open={open}
                onClose={() => setOpen(false)}
                label={alt}
            />
        </>
    );
}
