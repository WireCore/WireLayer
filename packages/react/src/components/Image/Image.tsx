import { Dialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import {
    dialog as dialogRecipe,
    imagePreview as imagePreviewRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Maximize2, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState, type ComponentProps, type SyntheticEvent } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ImageProps extends Omit<ComponentProps<'img'>, 'src' | 'alt'> {
    src: string;
    /** Describes the picture (WCAG 1.1.1) */
    alt: string;
    /** Opens the picture large on click, with zoom and rotation */
    preview?: boolean;
    /** Larger file for the preview; defaults to src */
    previewSrc?: string;
    /** Shown instead when the picture cannot be loaded (also in the preview) */
    fallbackSrc?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof imagePreviewRecipe>;
}

export function Image({
    classes,
    src: srcProp,
    alt,
    preview = false,
    previewSrc: previewProp,
    fallbackSrc,
    className,
    onError,
    ...props
}: ImageProps) {
    const dialog = useRecipe('dialog', dialogRecipe);
    const imagePreview = useRecipe('imagePreview', imagePreviewRecipe, classes);
    const styles = imagePreview();
    const backdrop = dialog().backdrop();
    const translations = useTranslations();
    const t = translations.image;
    const [zoom, setZoom] = useState(1);
    const [rotation, setRotation] = useState(0);
    // A picture that fails shows the fallback (once per source)
    const [failed, setFailed] = useState<string | null>(null);
    const src = fallbackSrc && failed === srcProp ? fallbackSrc : srcProp;
    const [previewFailed, setPreviewFailed] = useState(false);
    const previewSrc = fallbackSrc && previewFailed ? fallbackSrc : previewProp;
    const fallback = fallbackSrc
        ? {
              onError: (event: SyntheticEvent<HTMLImageElement, Event>) => {
                  onError?.(event);
                  if (failed !== srcProp) setFailed(srcProp);
              },
          }
        : onError
          ? { onError }
          : {};
    if (!preview)
        return <img {...props} {...fallback} src={src} alt={alt} className={styles.image({ class: className })} />;
    // With preview: a button around the picture opens a dialog (zoom, rotate; Escape closes)
    return (
        <Dialog.Root
            lazyMount
            unmountOnExit
            onOpenChange={(details) => {
                if (!details.open) return;
                setZoom(1);
                setRotation(0);
            }}
        >
            <Dialog.Trigger className={styles.trigger()} aria-label={t.preview(alt)}>
                <img {...props} {...fallback} src={src} alt="" className={styles.image({ class: className })} />
                <span className={styles.hint()} aria-hidden="true">
                    <Maximize2 className={styles.hintIcon()} />
                </span>
            </Dialog.Trigger>
            <Portal>
                <Dialog.Backdrop className={backdrop} />
                <Dialog.Positioner className={styles.positioner()}>
                    <Dialog.Content className={styles.content()} aria-label={alt}>
                        <div className={styles.toolbar()}>
                            <IconButton
                                icon={ZoomIn}
                                label={t.zoomIn}
                                variant="text"
                                size="sm"
                                disabled={zoom >= 4}
                                onClick={() => setZoom((value) => Math.min(4, value + 0.5))}
                            />
                            <IconButton
                                icon={ZoomOut}
                                label={t.zoomOut}
                                variant="text"
                                size="sm"
                                disabled={zoom <= 0.5}
                                onClick={() => setZoom((value) => Math.max(0.5, value - 0.5))}
                            />
                            <IconButton
                                icon={RotateCw}
                                label={t.rotate}
                                variant="text"
                                size="sm"
                                onClick={() => setRotation((value) => (value + 90) % 360)}
                            />
                            <Dialog.CloseTrigger asChild>
                                <IconButton icon={X} label={t.close} variant="text" size="sm" />
                            </Dialog.CloseTrigger>
                        </div>
                        <div className={styles.stage()}>
                            <img
                                src={previewSrc ?? src}
                                alt={alt}
                                {...(fallbackSrc ? { onError: () => setPreviewFailed(true) } : {})}
                                className={styles.preview()}
                                style={{ transform: `scale(${zoom}) rotate(${rotation}deg)` }}
                            />
                        </div>
                    </Dialog.Content>
                </Dialog.Positioner>
            </Portal>
        </Dialog.Root>
    );
}
