import {
    carousel,
    carouselBreakpoint,
    visuallyHidden,
    type CarouselBreakpoint,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight, Pause, Play } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import {
    FlatList,
    Platform,
    Pressable,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
} from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { announce } from '../LiveAnnouncer/LiveAnnouncer.js';

export interface CarouselProps<T> {
    items: T[];
    /** Accessible name of the carousel */
    label: string;
    /** Renders one slide */
    children: (item: T, index: number) => ReactNode;
    /** Slides visible at once (default 1); fractions show part of the next one */
    slidesPerPage?: number;
    /** Slides per step (default a page) */
    slidesToScroll?: number | 'auto';
    /** Settings by the width of the carousel */
    breakpoints?: CarouselBreakpoint[];
    /** Space between the slides in pt (default 16) */
    spacing?: number | string;
    /** After the last page comes the first */
    loop?: boolean;
    /** Turns the pages by itself (default every 4 s) – always with a pause button, not with reduced motion */
    autoplay?: boolean | { delay: number };
    /** Dots, one per page (default true) */
    indicators?: boolean;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    className?: string;
}

const toNumber = (value: number | string | undefined, fallback: number) =>
    typeof value === 'number' ? value : value ? Number.parseFloat(value) || fallback : fallback;

/**
 * Slides to swipe through (FlatList with paging): arrow buttons, dots, autoplay with pause (WCAG 2.2.2), the arrow
 * keys on the web. Slides outside the page are hidden from screen readers; iOS and Android announce the new slide.
 */
export function Carousel<T>({
    items,
    label,
    children,
    slidesPerPage = 1,
    slidesToScroll,
    breakpoints,
    spacing = 16,
    loop = false,
    autoplay = false,
    indicators = true,
    page: pageProp,
    defaultPage = 0,
    onPageChange,
    className,
}: CarouselProps<T>) {
    const translations = useTranslations();
    const t = translations.carousel;
    const styles = carousel();
    const reducedMotion = useReducedMotion();
    const [width, setWidth] = useState(0);
    const [page, setPage] = useControllable(pageProp, defaultPage, onPageChange);
    const settings = carouselBreakpoint(
        width,
        { slidesPerPage, slidesPerMove: slidesToScroll, spacing: String(spacing) },
        breakpoints
    );
    const perPage = Math.max(1, settings.slidesPerPage ?? 1);
    const gap = toNumber(settings.spacing, 16);
    const step =
        settings.slidesPerMove === 'auto' || !settings.slidesPerMove ? Math.floor(perPage) : settings.slidesPerMove;
    const pages = Math.max(1, Math.ceil((items.length - Math.floor(perPage)) / step) + 1);
    const current = Math.min(page, pages - 1);
    const slideWidth = width ? (width - gap * (Math.ceil(perPage) - 1)) / perPage : 0;
    const list = useRef<ComponentRef<typeof FlatList<T>>>(null);
    // null: the default – plays unless reduced motion is on; the button decides from then on
    const [playing, setPlaying] = useState<boolean | null>(null);
    const running = (playing ?? !reducedMotion) && !!autoplay && pages > 1;
    const delay = typeof autoplay === 'object' ? autoplay.delay : 4000;

    const go = (target: number, announced = true) => {
        const next = loop ? (target + pages) % pages : Math.min(Math.max(0, target), pages - 1);
        if (next === current) return;
        setPage(next);
        if (announced && Platform.OS !== 'web') announce(t.item(next * step, items.length));
    };

    useEffect(() => {
        if (!width) return;
        list.current?.scrollToOffset({ offset: current * step * (slideWidth + gap), animated: !reducedMotion });
    }, [current, width, step, slideWidth, gap, reducedMotion]);

    // Autoplay: one page further every `delay` ms – the latest page through a ref
    const latest = useRef({ current, go });
    useEffect(() => {
        latest.current = { current, go };
    });
    useEffect(() => {
        if (!running) return;
        const timer = setInterval(() => {
            const { current: now, go: move } = latest.current;
            move(now + 1 >= pages && !loop ? 0 : now + 1, false);
        }, delay);
        return () => clearInterval(timer);
    }, [running, delay, pages, loop]);

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const distance = step * (slideWidth + gap);
        if (!distance) return;
        const next = Math.round(event.nativeEvent.contentOffset.x / distance);
        if (next !== current) go(next);
    };
    const arrow = (icon: IconComponent, name: string, target: number, disabled: boolean) => (
        <Pressable
            role="button"
            aria-label={name}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            className={carousel({ disabled }).arrow()}
            onPress={() => go(target)}
        >
            <Icon icon={icon} className={styles.arrowIcon()} />
        </Pressable>
    );
    const visible = (index: number) => index >= current * step && index < current * step + Math.ceil(perPage);

    return (
        <View
            role="region"
            aria-label={label}
            {...({ 'aria-roledescription': 'carousel' } as object)}
            className={styles.base({ class: className })}
        >
            <View className={styles.viewport()} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                <FlatList
                    ref={list}
                    // Web: the scrolling list takes the focus (axe: a scrollable region must be reachable); the arrow keys turn the pages
                    {...((Platform.OS === 'web'
                        ? {
                              tabIndex: 0,
                              role: 'group',
                              'aria-label': t.progressText({ page: current, totalPages: pages }),
                              onKeyDown: (event: { key: string; preventDefault(): void }) => {
                                  const keys: Record<string, number> = {
                                      ArrowRight: current + 1,
                                      ArrowLeft: current - 1,
                                      Home: 0,
                                      End: pages - 1,
                                  };
                                  if (!(event.key in keys)) return;
                                  event.preventDefault();
                                  go(keys[event.key]!);
                              },
                          }
                        : {}) as object)}
                    data={items}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    snapToInterval={step * (slideWidth + gap) || undefined}
                    decelerationRate="fast"
                    disableIntervalMomentum
                    onScrollBeginDrag={() => setPlaying(false)}
                    onMomentumScrollEnd={onScrollEnd}
                    keyExtractor={(_, index) => String(index)}
                    renderItem={({ item, index }) => (
                        <View
                            role="group"
                            aria-label={t.item(index, items.length)}
                            {...({ 'aria-roledescription': 'slide' } as object)}
                            aria-hidden={!visible(index)}
                            style={{ width: slideWidth, marginRight: index === items.length - 1 ? 0 : gap }}
                        >
                            {children(item, index)}
                        </View>
                    )}
                />
            </View>
            <View className={styles.controls()}>
                <View className={styles.arrows()}>
                    {arrow(ChevronLeft, t.prevTrigger, current - 1, !loop && current === 0)}
                    {arrow(ChevronRight, t.nextTrigger, current + 1, !loop && current === pages - 1)}
                </View>
                {indicators && pages > 1 && (
                    <View className={styles.dots()}>
                        {Array.from({ length: pages }, (_, index) => {
                            const dot = carousel({ current: index === current });
                            return (
                                <Pressable
                                    key={index}
                                    role="button"
                                    aria-label={t.indicator(index)}
                                    {...({ 'aria-current': index === current ? 'true' : undefined } as object)}
                                    hitSlop={10}
                                    className={dot.dot()}
                                    onPress={() => go(index)}
                                >
                                    <View className={dot.dotMark()} />
                                </Pressable>
                            );
                        })}
                    </View>
                )}
                {!!autoplay && (
                    <Pressable
                        role="button"
                        aria-label={running ? t.autoplayStop : t.autoplayStart}
                        className={styles.play()}
                        onPress={() => setPlaying(!running)}
                    >
                        <Icon icon={running ? Pause : Play} className={styles.playIcon()} />
                    </Pressable>
                )}
            </View>
            {/* The web hears the new slide while it does not turn by itself */}
            {Platform.OS === 'web' && (
                <Text aria-live={running ? 'off' : 'polite'} className={visuallyHidden()}>
                    {t.item(current * step, items.length)}
                </Text>
            )}
        </View>
    );
}
