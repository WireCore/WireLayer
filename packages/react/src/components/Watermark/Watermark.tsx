import { watermark as watermarkRecipe, watermarkBackground, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import type { ComponentProps } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface WatermarkProps extends ComponentProps<'div'> {
    /** Text of the watermark; several lines as an array */
    text?: string | string[];
    /** Image URL drawn instead of the text (e.g. a logo) */
    image?: string;
    /** Size of the image in px (default 120 × 64) */
    imageWidth?: number;
    imageHeight?: number;
    /** Rotation in degrees (default -22) */
    rotate?: number;
    /** Space between the repetitions in px: [horizontal, vertical] (default [96, 72]) */
    gap?: [number, number];
    /** Font size in px (default 16) */
    fontSize?: number;
    /** Text colour – a real colour, CSS variables do not work inside the image (default mid grey) */
    color?: string;
    /** Opacity 0–1 (default 0.15) */
    opacity?: number;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof watermarkRecipe>;
}

/** Content with a repeated text or image on top: decoration only (aria-hidden), clicks go through */
export function Watermark({
    classes,
    text,
    image,
    imageWidth,
    imageHeight,
    rotate,
    gap,
    fontSize,
    color,
    opacity,
    className,
    children,
    ...props
}: WatermarkProps) {
    const watermark = useRecipe('watermark', watermarkRecipe, classes);
    const styles = watermark();
    const background = watermarkBackground({
        text,
        image,
        imageWidth,
        imageHeight,
        rotate,
        gap,
        fontSize,
        color,
        opacity,
    });
    return (
        <div {...props} className={styles.base({ class: className })}>
            {children}
            <div className={styles.layer()} style={background} aria-hidden="true" />
        </div>
    );
}
