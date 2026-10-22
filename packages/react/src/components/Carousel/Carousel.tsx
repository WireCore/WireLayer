import { Carousel as ArkCarousel } from '@ark-ui/react/carousel';
import {
    carousel as carouselRecipe,
    carouselBreakpoint,
    iconButton as iconButtonRecipe,
    type CarouselBreakpoint,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface CarouselProps<T> {
    items: T[];
    /** Accessible name of the carousel region, e.g. "References" */
    label: string;
    /** Renders one slide */
    children: (item: T, index: number) => ReactNode;
    /** Slides in view at once – fractions show a part of the next one (e.g. 1.5) */
    slidesPerPage?: number;
    /** Slides one step moves (default: a page) */
    slidesToScroll?: number | 'auto';
    /** Slides side by side (default) or on top of each other (give a `height`) */
    orientation?: 'horizontal' | 'vertical';
    /** Height of the slides area (CSS length) – needed when vertical */
    height?: string;
    /** Settings from a width of the carousel on (a container query), e.g. [{ minWidth: 640, slidesPerPage: 2 }] */
    breakpoints?: CarouselBreakpoint[];
    /** The slides can be dragged with the mouse, too (touch swipes anyway) */
    allowMouseDrag?: boolean;
    /** Gap between slides (CSS length) */
    spacing?: string;
    loop?: boolean;
    /** Turns pages by itself (default every 4 s) – always with a pause button (WCAG 2.2.2) */
    autoplay?: boolean | { delay: number };
    /** Dots below the slides, one per page */
    indicators?: boolean;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof carouselRecipe>;
}

/**
 * Region "carousel" with slides labelled "Image n of m". Previous/next buttons, one dot per page (arrow keys
 * move between pages there); autoplay only with a pause button.
 */
export function Carousel<T>({
    classes,
    items,
    label,
    children,
    slidesPerPage = 1,
    slidesToScroll,
    orientation = 'horizontal',
    height,
    breakpoints,
    allowMouseDrag = false,
    spacing = '16px',
    loop = false,
    autoplay = false,
    indicators = true,
    page,
    defaultPage = 0,
    onPageChange,
    className,
    style,
}: CarouselProps<T>) {
    const carousel = useRecipe('carousel', carouselRecipe, classes);
    const iconButton = useRecipe('iconButton', iconButtonRecipe);
    const styles = carousel({ vertical: orientation === 'vertical' });
    const button = iconButton({ variant: 'outline', size: 'sm' });
    const translations = useTranslations();
    const [internal, setInternal] = useState(defaultPage);
    // Breakpoints follow the width of the carousel itself (measured in the browser; the base settings before that)
    const root = useRef<HTMLDivElement>(null);
    const [width, setWidth] = useState(0);
    const watchWidth = !!breakpoints?.length;
    useEffect(() => {
        if (!watchWidth || typeof ResizeObserver === 'undefined' || !root.current) return;
        const observer = new ResizeObserver(([entry]) => setWidth(entry?.contentRect.width ?? 0));
        observer.observe(root.current);
        return () => observer.disconnect();
    }, [watchWidth]);
    const settings = carouselBreakpoint(width, { slidesPerPage, slidesPerMove: slidesToScroll, spacing }, breakpoints);
    return (
        <ArkCarousel.Root
            ref={root}
            className={styles.base({ class: className })}
            style={style}
            aria-label={label}
            slideCount={items.length}
            slidesPerPage={settings.slidesPerPage}
            slidesPerMove={settings.slidesPerMove}
            orientation={orientation}
            allowMouseDrag={allowMouseDrag}
            spacing={settings.spacing}
            loop={loop}
            autoplay={autoplay}
            page={page ?? internal}
            translations={translations.carousel}
            onPageChange={(details) => {
                setInternal(details.page);
                onPageChange?.(details.page);
            }}
        >
            <ArkCarousel.ItemGroup className={styles.itemGroup()} tabIndex={0} style={height ? { height } : undefined}>
                {items.map((item, index) => (
                    <ArkCarousel.Item key={index} index={index} className={styles.item()}>
                        {children(item, index)}
                    </ArkCarousel.Item>
                ))}
            </ArkCarousel.ItemGroup>
            <ArkCarousel.Control className={styles.control()}>
                {autoplay && (
                    <ArkCarousel.AutoplayTrigger className={button.base()}>
                        <ArkCarousel.AutoplayIndicator fallback={<Play className={button.icon()} aria-hidden="true" />}>
                            <Pause className={button.icon()} aria-hidden="true" />
                        </ArkCarousel.AutoplayIndicator>
                    </ArkCarousel.AutoplayTrigger>
                )}
                <ArkCarousel.PrevTrigger className={button.base()}>
                    <ChevronLeft className={button.icon()} aria-hidden="true" />
                </ArkCarousel.PrevTrigger>
                <ArkCarousel.Context>
                    {(api) => (
                        <ArkCarousel.IndicatorGroup className={styles.indicatorGroup()}>
                            {(indicators ? api.pageSnapPoints : []).map((_, index) => (
                                <ArkCarousel.Indicator
                                    key={index}
                                    index={index}
                                    className={styles.indicator()}
                                    aria-current={index === api.page ? 'true' : undefined}
                                />
                            ))}
                        </ArkCarousel.IndicatorGroup>
                    )}
                </ArkCarousel.Context>
                <ArkCarousel.NextTrigger className={button.base()}>
                    <ChevronRight className={button.icon()} aria-hidden="true" />
                </ArkCarousel.NextTrigger>
            </ArkCarousel.Control>
        </ArkCarousel.Root>
    );
}
