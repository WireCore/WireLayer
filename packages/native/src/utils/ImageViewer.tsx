import {
    clampPan,
    image as imageRecipe,
    pinchZoom,
    stepZoom,
    swipeDirection,
    visuallyHidden,
    zoomLimits,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react-native';
import { useRef, useState, type ComponentRef } from 'react';
import { I18nManager, Image, Modal, Platform, Pressable, Text, View, type GestureResponderEvent } from 'react-native';
import { useTranslations } from '../locale.js';
import { Icon, type IconComponent } from './Icon.js';
import { useEscape } from './useEscape.js';
import { useReducedMotion } from './useReducedMotion.js';

export interface ViewerImage {
    src: string;
    alt: string;
}

const distance = (event: GestureResponderEvent) => {
    const [a, b] = event.nativeEvent.touches;
    return a && b ? Math.hypot(a.pageX - b.pageX, a.pageY - b.pageY) : 0;
};

/**
 * Full-screen view of one or more pictures: pinch and buttons zoom, a finger moves the zoomed picture, a swipe
 * (not zoomed) or the arrow buttons change it. Every gesture has a button (WCAG 2.5.1); zoom is announced.
 */
export function ImageViewer({
    images,
    page,
    onPageChange,
    open,
    onClose,
    label,
    closeLabel,
}: {
    images: ViewerImage[];
    page: number;
    onPageChange?: (page: number) => void;
    open: boolean;
    onClose: () => void;
    /** Accessible name of the dialog */
    label: string;
    closeLabel?: string;
}) {
    const translations = useTranslations();
    const styles = imageRecipe();
    const reducedMotion = useReducedMotion();
    const [view, setView] = useState({ page, zoom: 1, rotation: 0, x: 0, y: 0 });
    // A new page starts unzoomed
    const state = view.page === page ? view : { page, zoom: 1, rotation: 0, x: 0, y: 0 };
    const [stage, setStage] = useState({ width: 0, height: 0 });
    const gesture = useRef({ zoom: 1, distance: 0, x: 0, y: 0, startX: 0, startY: 0 });
    const closeButton = useRef<ComponentRef<typeof Pressable>>(null);
    useEscape(open, onClose);

    const current = images[page];
    const set = (changes: Partial<typeof state>) => {
        const next = { ...state, ...changes };
        const offset = clampPan({ x: next.x, y: next.y }, next.zoom, stage, stage);
        setView({ ...next, ...offset });
    };
    const go = (direction: 1 | -1) => {
        const next = page + direction;
        if (next >= 0 && next < images.length) onPageChange?.(next);
    };

    // Gestures (responder system): two fingers zoom, one moves the zoomed picture or swipes to the next one
    const point = (event: GestureResponderEvent) => ({ x: event.nativeEvent.pageX, y: event.nativeEvent.pageY });
    const gestures = {
        onStartShouldSetResponder: () => true,
        onMoveShouldSetResponder: () => true,
        onResponderGrant: (event: GestureResponderEvent) => {
            const { x, y } = point(event);
            gesture.current = {
                zoom: state.zoom,
                distance: distance(event),
                x: state.x,
                y: state.y,
                startX: x,
                startY: y,
            };
        },
        onResponderMove: (event: GestureResponderEvent) => {
            if (event.nativeEvent.touches.length === 2) {
                const now = distance(event);
                if (!gesture.current.distance) gesture.current.distance = now;
                set({ zoom: pinchZoom(gesture.current.zoom, gesture.current.distance, now) });
            } else if (state.zoom > 1) {
                const { x, y } = point(event);
                set({
                    x: gesture.current.x + x - gesture.current.startX,
                    y: gesture.current.y + y - gesture.current.startY,
                });
            }
        },
        onResponderRelease: (event: GestureResponderEvent) => {
            if (state.zoom > 1 || gesture.current.distance) return;
            const { x, y } = point(event);
            const direction = swipeDirection(x - gesture.current.startX, y - gesture.current.startY, I18nManager.isRTL);
            if (direction) go(direction);
        },
    };

    const tool = (icon: IconComponent, name: string, onPress: () => void, disabled = false) => (
        <Pressable
            role="button"
            aria-label={name}
            disabled={disabled}
            aria-disabled={disabled || undefined}
            className={styles.tool()}
            onPress={onPress}
        >
            <Icon icon={icon} className={styles.toolIcon()} />
        </Pressable>
    );

    return (
        <Modal
            visible={open}
            animationType={reducedMotion ? 'none' : 'fade'}
            onRequestClose={onClose}
            onShow={() => {
                if (Platform.OS === 'web') closeButton.current?.focus();
            }}
            statusBarTranslucent
        >
            <View role="dialog" aria-modal aria-label={label} className={styles.preview()}>
                <View className={styles.stage()} onLayout={(event) => setStage(event.nativeEvent.layout)} {...gestures}>
                    {current && (
                        <Image
                            source={{ uri: current.src }}
                            alt={current.alt}
                            resizeMode="contain"
                            style={{
                                width: stage.width,
                                height: stage.height,
                                transform: [
                                    { translateX: state.x },
                                    { translateY: state.y },
                                    { scale: state.zoom },
                                    { rotate: `${state.rotation}deg` },
                                ],
                            }}
                        />
                    )}
                </View>
                <View className={styles.toolbar()} role="toolbar" aria-label={translations.gallery.toolbar}>
                    {images.length > 1 &&
                        tool(ChevronLeft, translations.carousel.prevTrigger, () => go(-1), page === 0)}
                    {images.length > 1 &&
                        tool(ChevronRight, translations.carousel.nextTrigger, () => go(1), page === images.length - 1)}
                    {tool(
                        ZoomOut,
                        translations.image.zoomOut,
                        () => set({ zoom: stepZoom(state.zoom, -1) }),
                        state.zoom <= zoomLimits.min
                    )}
                    {tool(
                        ZoomIn,
                        translations.image.zoomIn,
                        () => set({ zoom: stepZoom(state.zoom, 1) }),
                        state.zoom >= zoomLimits.max
                    )}
                    {tool(RotateCw, translations.image.rotate, () => set({ rotation: (state.rotation + 90) % 360 }))}
                    <Pressable
                        ref={closeButton}
                        role="button"
                        aria-label={closeLabel ?? translations.image.close}
                        className={styles.tool()}
                        onPress={onClose}
                    >
                        <Icon icon={X} className={styles.toolIcon()} />
                    </Pressable>
                </View>
                <View className={styles.status()} pointerEvents="none">
                    <Text className={styles.statusText()} aria-hidden>
                        {images.length > 1 ? `${page + 1} / ${images.length} · ` : ''}
                        {Math.round(state.zoom * 100)} %
                    </Text>
                    <Text role="status" className={visuallyHidden()}>
                        {state.zoom !== 1 ? translations.gallery.zoom(Math.round(state.zoom * 100)) : ''}
                    </Text>
                </View>
            </View>
        </Modal>
    );
}
