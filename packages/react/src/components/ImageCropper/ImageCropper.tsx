import { ImageCropper as ArkImageCropper, useImageCropper } from '@ark-ui/react/image-cropper';
import { blobToCanvas, imageCropper as imageCropperRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { FlipHorizontal2, RotateCcw, RotateCcwSquare, RotateCwSquare, ZoomIn, ZoomOut } from 'lucide-react';
import { useImperativeHandle, type ComponentProps, type Ref } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface ImageCropperProps extends Omit<ComponentProps<'div'>, 'children' | 'ref'> {
    /** Image URL (an object URL of a chosen file works, too) */
    src: string;
    /** Width / height of the crop area, e.g. 1 or 16 / 9 (free without) */
    aspectRatio?: number;
    /** Rectangle (default) or circle (e.g. for avatars) */
    cropShape?: 'rectangle' | 'circle';
    /** Zoom factor (controlled) */
    zoom?: number;
    onZoomChange?: (zoom: number) => void;
    /** Rotation in degrees (controlled) */
    rotation?: number;
    onRotationChange?: (rotation: number) => void;
    /** The crop area changed (in px of the shown image) */
    onCropChange?: (crop: { x: number; y: number; width: number; height: number }) => void;
    /** Smallest and largest zoom (default 1 and 5) */
    minZoom?: number;
    maxZoom?: number;
    /** Buttons for zoom, rotation, mirroring and reset (default true) */
    toolbar?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof imageCropperRecipe>;
    /** Methods: getCroppedImage, getCanvas, reset */
    ref?: Ref<ImageCropperHandle>;
}

/** Methods of an ImageCropper (ref) */
export interface ImageCropperHandle {
    /** The cropped image as Blob (default, PNG) or data URL – zoom, rotation and mirroring applied */
    getCroppedImage(options?: {
        type?: string;
        quality?: number;
        maxSize?: { width: number; height: number };
        output?: 'blob' | 'dataUrl';
    }): Promise<Blob | string | null>;
    /** The cropped image on a canvas */
    getCanvas(options?: { maxSize?: { width: number; height: number } }): Promise<HTMLCanvasElement | null>;
    reset(): void;
}

const handles = ['nw', 'ne', 'sw', 'se'] as const;

/**
 * The image with a crop area (a slider): arrow keys move it, Alt+arrows resize it, + and − zoom; drag the area or
 * its corners, drag the image to pan. The toolbar does the same with buttons.
 */
export function ImageCropper({
    classes,
    src,
    aspectRatio,
    cropShape = 'rectangle',
    zoom,
    onZoomChange,
    rotation,
    onRotationChange,
    onCropChange,
    minZoom = 1,
    maxZoom = 5,
    toolbar = true,
    className,
    ref,
    ...props
}: ImageCropperProps) {
    const imageCropper = useRecipe('imageCropper', imageCropperRecipe, classes);
    const styles = imageCropper();
    const t = useTranslations().imageCropper;
    const api = useImageCropper({
        aspectRatio,
        cropShape,
        zoom,
        rotation,
        minZoom,
        maxZoom,
        translations: {
            rootLabel: t.label,
            rootRoleDescription: t.roleDescription,
            previewLoading: t.loading,
            previewDescription: ({ zoom: factor, rotation: degrees }) => t.description(factor, degrees),
            selectionLabel: ({ shape }) => t.selection(shape === 'circle'),
            selectionRoleDescription: t.selectionRoleDescription,
            selectionInstructions: t.instructions,
            selectionValueText: ({ width, height, x, y }) => t.selectionValue(width, height, x, y),
        },
        onZoomChange: (details) => onZoomChange?.(details.zoom),
        onRotationChange: (details) => onRotationChange?.(details.rotation),
        onCropChange: (details) => onCropChange?.(details.crop),
    });
    useImperativeHandle(ref, () => ({
        getCroppedImage: (options) => api.getCroppedImage(options),
        getCanvas: async (options) => {
            const blob = await api.getCroppedImage({ ...options, output: 'blob' });
            return blob instanceof Blob ? blobToCanvas(blob) : null;
        },
        reset: () => api.reset(),
    }));
    return (
        <div {...props} className={styles.base({ class: className })}>
            <ArkImageCropper.RootProvider value={api} className={styles.root()}>
                <ArkImageCropper.Viewport className={styles.viewport()}>
                    <ArkImageCropper.Image src={src} className={styles.image()} />
                    <ArkImageCropper.Selection className={styles.selection()}>
                        {handles.map((position) => (
                            <ArkImageCropper.Handle key={position} position={position} className={styles.handle()} />
                        ))}
                        <ArkImageCropper.Grid axis="horizontal" className={styles.grid()} />
                        <ArkImageCropper.Grid axis="vertical" className={styles.grid()} />
                    </ArkImageCropper.Selection>
                </ArkImageCropper.Viewport>
            </ArkImageCropper.RootProvider>
            {toolbar && (
                <div role="group" aria-label={t.toolbar} className={styles.toolbar()}>
                    <IconButton
                        icon={ZoomOut}
                        label={t.zoomOut}
                        variant="text"
                        size="sm"
                        onClick={() => api.zoomBy(-0.1)}
                    />
                    <span className={styles.zoom()} aria-hidden="true">
                        {`${Math.round(api.zoom * 100)} %`}
                    </span>
                    <IconButton
                        icon={ZoomIn}
                        label={t.zoomIn}
                        variant="text"
                        size="sm"
                        onClick={() => api.zoomBy(0.1)}
                    />
                    <IconButton
                        icon={RotateCcwSquare}
                        label={t.rotateLeft}
                        variant="text"
                        size="sm"
                        onClick={() => api.rotateBy(-90)}
                    />
                    <IconButton
                        icon={RotateCwSquare}
                        label={t.rotateRight}
                        variant="text"
                        size="sm"
                        onClick={() => api.rotateBy(90)}
                    />
                    <IconButton
                        icon={FlipHorizontal2}
                        label={t.flip}
                        variant="text"
                        size="sm"
                        onClick={() => api.flipHorizontally()}
                    />
                    <IconButton icon={RotateCcw} label={t.reset} variant="text" size="sm" onClick={() => api.reset()} />
                </div>
            )}
        </div>
    );
}
