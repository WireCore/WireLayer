import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import { Portal } from '@ark-ui/react/portal';
import {
    dialog as dialogRecipe,
    gallery as galleryRecipe,
    iconButton as iconButtonRecipe,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { Carousel } from '../Carousel/Carousel.js';
import { GalleryVideo } from './GalleryVideo.js';
import { GalleryLightbox } from './Lightbox.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** A text track of a video slide (captions, subtitles, descriptions) */
export interface GalleryTrack {
    src: string;
    kind?: 'captions' | 'subtitles' | 'descriptions' | 'chapters';
    /** Language of the track, e.g. "de" */
    srclang: string;
    /** Name in the player's menu, e.g. "German" */
    label: string;
    default?: boolean;
}

export interface GalleryImage {
    src: string;
    /** Describes the picture (WCAG 1.1.1); empty only for pure decoration. Names the video of a video slide */
    alt: string;
    /** Smaller file for the thumbnail; defaults to src */
    thumbnail?: string;
    caption?: string;
    /** Larger file for the lightbox (`tools`); defaults to src */
    fullSrc?: string;
    /** A video instead of a picture: `src` (or `sources`) is the video, `thumbnail`/`poster` its picture */
    type?: 'image' | 'video';
    /** Video files in several formats, e.g. [{ src: 'film.webm', type: 'video/webm' }] */
    sources?: { src: string; type?: string }[];
    /** Picture shown before the video plays */
    poster?: string;
    /** Captions and other text tracks of the video (WCAG 1.2.2) */
    tracks?: GalleryTrack[];
    /** File the download button offers (`tools`); defaults to fullSrc or src */
    download?: string;
}

export interface GalleryProps {
    images: GalleryImage[];
    /** Accessible name of the gallery, also the title of the fullscreen view */
    label: string;
    /** Row of thumbnails below the picture (instead of the dots); it follows the shown picture */
    thumbnails?: boolean;
    /** Button that opens the pictures large in a dialog */
    fullscreen?: boolean;
    /**
     * The large view is a lightbox: zoom (buttons, + and −, Ctrl+wheel, two fingers), move the zoomed picture,
     * rotate, download, fill the screen, swipe; keyboard shortcuts are shown in it
     */
    tools?: boolean;
    /** Pictures load when they come near the view (loading="lazy") */
    lazy?: boolean;
    /** More pictures can be loaded: showing one of the last two calls onLoadMore (they are added at the end) */
    hasMore?: boolean;
    /** The next pictures are loading (aria-busy) */
    loading?: boolean;
    /** Load the next pictures (hasMore) */
    onLoadMore?: () => void;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof galleryRecipe>;
}

/** Carousel of pictures with thumbnails (aria-current marks the shown one) and an optional fullscreen dialog */
export function Gallery({
    classes,
    images,
    label,
    thumbnails = true,
    fullscreen = true,
    tools = false,
    lazy = false,
    hasMore = false,
    loading = false,
    onLoadMore,
    page,
    defaultPage = 0,
    onPageChange,
    className,
    style,
}: GalleryProps) {
    const dialog = useRecipe('dialog', dialogRecipe);
    const gallery = useRecipe('gallery', galleryRecipe, classes);
    const iconButton = useRecipe('iconButton', iconButtonRecipe);
    const styles = gallery();
    const button = iconButton({ variant: 'outline', size: 'sm' });
    const closeStyles = dialog();
    const translations = useTranslations();
    const [internal, setInternal] = useState(defaultPage);
    const current = page ?? internal;
    const change = (next: number) => {
        setInternal(next);
        onPageChange?.(next);
    };
    const lazyImage = lazy ? ({ loading: 'lazy', decoding: 'async' } as const) : {};
    // The thumbnail of the shown picture scrolls into view
    const strip = useRef<HTMLDivElement>(null);
    const shown = useRef(current);
    useEffect(() => {
        if (shown.current === current) return;
        shown.current = current;
        strip.current
            ?.querySelector<HTMLElement>('[aria-current="true"]')
            ?.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
    }, [current]);
    // Near the end: ask for more pictures, once per number of pictures
    const asked = useRef(-1);
    useEffect(() => {
        if (!hasMore || loading || current < images.length - 2 || asked.current === images.length) return;
        asked.current = images.length;
        onLoadMore?.();
    }, [current, images.length, hasMore, loading, onLoadMore]);

    return (
        <div className={styles.base({ class: className })} style={style} aria-busy={loading || undefined}>
            <ArkDialog.Root lazyMount unmountOnExit>
                <div className={styles.stage()}>
                    <Carousel
                        items={images}
                        label={label}
                        page={current}
                        indicators={!thumbnails}
                        onPageChange={change}
                    >
                        {(item, index) => (
                            <figure className={styles.figure()}>
                                {item.type === 'video' ? (
                                    <GalleryVideo item={item} className={styles.video()} inactive={index !== current} />
                                ) : (
                                    <img src={item.src} alt={item.alt} className={styles.image()} {...lazyImage} />
                                )}
                                {item.caption && <figcaption className={styles.caption()}>{item.caption}</figcaption>}
                            </figure>
                        )}
                    </Carousel>
                    {fullscreen && (
                        <ArkDialog.Trigger
                            className={button.base({ class: styles.fullscreenTrigger() })}
                            aria-label={translations.gallery.fullscreen}
                        >
                            <Maximize2 className={button.icon()} aria-hidden="true" />
                        </ArkDialog.Trigger>
                    )}
                </div>
                <Portal>
                    <ArkDialog.Backdrop className={closeStyles.backdrop()} />
                    <ArkDialog.Positioner className={styles.positioner()}>
                        {tools ? (
                            <GalleryLightbox images={images} label={label} page={current} onPageChange={change} />
                        ) : (
                            <ArkDialog.Content className={styles.content()}>
                                <div className={styles.header()}>
                                    <ArkDialog.Title className={styles.title()}>{label}</ArkDialog.Title>
                                    <ArkDialog.CloseTrigger
                                        className={closeStyles.close()}
                                        aria-label={translations.gallery.close}
                                    >
                                        <X className={closeStyles.closeIcon()} aria-hidden="true" />
                                    </ArkDialog.CloseTrigger>
                                </div>
                                <Carousel items={images} label={label} page={current} onPageChange={change}>
                                    {(item, index) => (
                                        <figure className={styles.figure()}>
                                            {item.type === 'video' ? (
                                                <GalleryVideo
                                                    item={item}
                                                    className={styles.video()}
                                                    inactive={index !== current}
                                                />
                                            ) : (
                                                <img
                                                    src={item.src}
                                                    alt={item.alt}
                                                    className={styles.fullscreenImage()}
                                                />
                                            )}
                                            {item.caption && (
                                                <figcaption className={styles.caption()}>{item.caption}</figcaption>
                                            )}
                                        </figure>
                                    )}
                                </Carousel>
                            </ArkDialog.Content>
                        )}
                    </ArkDialog.Positioner>
                </Portal>
            </ArkDialog.Root>
            {thumbnails && (
                <div
                    ref={strip}
                    role="group"
                    aria-label={translations.gallery.thumbnails}
                    className={styles.thumbnails()}
                >
                    {images.map((image, index) => (
                        <button
                            key={index}
                            type="button"
                            className={styles.thumbnail()}
                            aria-label={translations.gallery.thumbnail(index, images.length)}
                            aria-current={index === current ? 'true' : undefined}
                            onClick={() => change(index)}
                        >
                            <img
                                src={image.thumbnail ?? image.poster ?? image.src}
                                alt=""
                                className={styles.thumbnailImage()}
                                {...lazyImage}
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
