import { gallery } from '@wirecore/wirelayer-recipes/native';
import { Maximize2 } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import {
    FlatList,
    Image,
    Platform,
    Pressable,
    ScrollView,
    Text,
    View,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    type ViewProps,
} from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { ImageViewer } from '../../utils/ImageViewer.js';
import { useControllable } from '../../utils/useControllable.js';

export interface GalleryImage {
    src: string;
    /** Describes the picture */
    alt: string;
    /** Smaller file for the thumbnail */
    thumbnail?: string;
    caption?: string;
    /** Larger file for the full screen view */
    fullSrc?: string;
}

export interface GalleryProps extends ViewProps {
    images: GalleryImage[];
    /** Accessible name, also the title of the full screen view */
    label: string;
    /** Row of thumbnails below (default true) */
    thumbnails?: boolean;
    /** Button for the full screen view with zoom (default true) */
    fullscreen?: boolean;
    /** More pictures can be loaded – asked for near the end */
    hasMore?: boolean;
    /** Pictures are loading (busy) */
    loading?: boolean;
    /** Called once per length when the second-to-last picture is shown */
    onLoadMore?: () => void;
    page?: number;
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    className?: string;
}

/**
 * Pictures to swipe through with thumbnails and a full screen view (pinch zoom, buttons for every gesture).
 * The thumbnails are buttons ("Show image 2 of 8"), the current one is marked.
 */
export function Gallery({
    images,
    label,
    thumbnails = true,
    fullscreen = true,
    hasMore = false,
    loading = false,
    onLoadMore,
    page: pageProp,
    defaultPage = 0,
    onPageChange,
    className,
    ...props
}: GalleryProps) {
    const translations = useTranslations();
    const styles = gallery();
    const [page, setPage] = useControllable(pageProp, defaultPage, onPageChange);
    const [width, setWidth] = useState(0);
    const [open, setOpen] = useState(false);
    const list = useRef<ComponentRef<typeof FlatList<GalleryImage>>>(null);
    const asked = useRef(-1);
    const current = Math.min(page, Math.max(0, images.length - 1));

    // Keep the swiped list on the page (thumbnails, buttons, the full screen view)
    useEffect(() => {
        if (width) list.current?.scrollToOffset({ offset: current * width, animated: false });
    }, [current, width]);
    // Load more near the end (once per length)
    useEffect(() => {
        if (!hasMore || loading || current < images.length - 2 || asked.current === images.length) return;
        asked.current = images.length;
        onLoadMore?.();
    }, [current, images.length, hasMore, loading, onLoadMore]);

    const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        if (!width) return;
        const next = Math.round(event.nativeEvent.contentOffset.x / width);
        if (next !== current) setPage(next);
    };
    const shown = images[current];

    return (
        <View
            role="group"
            aria-label={label}
            aria-busy={loading}
            {...props}
            className={styles.base({ class: className })}
        >
            <View className={styles.stage()} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
                <FlatList
                    ref={list}
                    // Web: the swiped list takes the focus, the arrow keys change the picture
                    {...((Platform.OS === 'web'
                        ? {
                              tabIndex: 0,
                              role: 'group',
                              'aria-label': translations.carousel.item(current, images.length),
                              onKeyDown: (event: { key: string; preventDefault(): void }) => {
                                  const keys: Record<string, number> = {
                                      ArrowRight: current + 1,
                                      ArrowLeft: current - 1,
                                      Home: 0,
                                      End: images.length - 1,
                                  };
                                  const next = keys[event.key];
                                  if (next === undefined) return;
                                  event.preventDefault();
                                  setPage(Math.min(Math.max(0, next), images.length - 1));
                              },
                          }
                        : {}) as object)}
                    data={images}
                    horizontal
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    keyExtractor={(item, index) => `${index}${item.src}`}
                    onMomentumScrollEnd={onScrollEnd}
                    getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
                    renderItem={({ item, index }) => (
                        <View
                            className={styles.slide()}
                            style={{ width, aspectRatio: 4 / 3 }}
                            aria-hidden={index !== current}
                        >
                            <Image
                                source={{ uri: item.src }}
                                alt={item.alt}
                                resizeMode="cover"
                                className={styles.image()}
                            />
                        </View>
                    )}
                />
            </View>
            <View className={styles.bar()}>
                <Text className={styles.counter()} aria-live="polite">
                    {translations.carousel.item(current, images.length)}
                </Text>
                {fullscreen && (
                    <Pressable
                        role="button"
                        aria-label={translations.gallery.fullscreen}
                        {...({ 'aria-haspopup': 'dialog' } as object)}
                        className={styles.fullscreen()}
                        onPress={() => setOpen(true)}
                    >
                        <Icon icon={Maximize2} className={styles.fullscreenIcon()} />
                    </Pressable>
                )}
            </View>
            {!!shown?.caption && <Text className={styles.caption()}>{shown.caption}</Text>}
            {thumbnails && images.length > 1 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} className={styles.thumbs()}>
                    <View role="group" aria-label={translations.gallery.thumbnails} className={styles.thumbList()}>
                        {images.map((item, index) => {
                            const thumbStyles = gallery({ current: index === current });
                            return (
                                <Pressable
                                    key={`${index}${item.src}`}
                                    role="button"
                                    aria-label={translations.gallery.thumbnail(index, images.length)}
                                    {...({ 'aria-current': index === current ? 'true' : undefined } as object)}
                                    className={thumbStyles.thumb()}
                                    onPress={() => setPage(index)}
                                >
                                    <Image
                                        source={{ uri: item.thumbnail ?? item.src }}
                                        alt=""
                                        aria-hidden
                                        className={thumbStyles.thumbImage()}
                                    />
                                </Pressable>
                            );
                        })}
                    </View>
                </ScrollView>
            )}
            <ImageViewer
                images={images.map((item) => ({ src: item.fullSrc ?? item.src, alt: item.alt }))}
                page={current}
                onPageChange={setPage}
                open={open}
                onClose={() => setOpen(false)}
                label={label}
                closeLabel={translations.gallery.close}
            />
        </View>
    );
}
