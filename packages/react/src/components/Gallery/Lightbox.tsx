import { Dialog as ArkDialog } from '@ark-ui/react/dialog';
import {
    clampPan,
    dialog as dialogRecipe,
    gallery as galleryRecipe,
    iconButton as iconButtonRecipe,
    pinchZoom,
    stepZoom,
    swipeDirection,
    zoomLimits,
} from '@wirecore/wirelayer-recipes';
import {
    ChevronLeft,
    ChevronRight,
    Download,
    Maximize,
    Minimize,
    RotateCw,
    Scan,
    X,
    ZoomIn,
    ZoomOut,
} from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type WheelEvent } from 'react';
import { IconButton } from '../IconButton/IconButton.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import type { GalleryImage } from './Gallery.js';
import { GalleryVideo } from './GalleryVideo.js';

type Gesture =
    | { kind: 'pan'; x: number; y: number; from: { x: number; y: number } }
    | { kind: 'pinch'; distance: number; zoom: number }
    | { kind: 'swipe'; x: number; y: number };

/**
 * Lightbox of a Gallery (`tools`): one picture at a time – zoom (buttons, +/−, Ctrl+wheel, two fingers), move the
 * zoomed picture (drag, arrow keys), rotate, download, fill the screen; swipe or arrow keys change the picture
 */
export function GalleryLightbox({
    images,
    label,
    page,
    onPageChange,
}: {
    images: GalleryImage[];
    label: string;
    page: number;
    onPageChange: (page: number) => void;
}) {
    const gallery = useRecipe('gallery', galleryRecipe);
    const dialog = useRecipe('dialog', dialogRecipe);
    const iconButton = useRecipe('iconButton', iconButtonRecipe);
    const styles = gallery();
    const closeStyles = dialog();
    const button = iconButton({ variant: 'text', size: 'sm' });
    const { translations, dir } = useLocale();
    const t = translations.gallery;
    const item = images[page];
    const video = item?.type === 'video';
    const [zoom, setZoomValue] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [panning, setPanning] = useState(false);
    const [status, setStatus] = useState('');
    const [shownPage, setShownPage] = useState(page);
    if (shownPage !== page) {
        setShownPage(page);
        setZoomValue(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
    }

    const go = (step: number) => {
        const next = page + step;
        if (next < 0 || next >= images.length) return;
        onPageChange(next);
    };
    // Moving: the zoomed picture keeps covering the stage
    const stage = useRef<HTMLDivElement>(null);
    const image = useRef<HTMLImageElement>(null);
    const clamp = (next: { x: number; y: number }, scale = zoom, turn = rotation) => {
        if (!stage.current || !image.current) return { x: 0, y: 0 };
        const width = image.current.clientWidth;
        const height = image.current.clientHeight;
        return clampPan(next, scale, turn % 180 !== 0 ? { width: height, height: width } : { width, height }, {
            width: stage.current.clientWidth,
            height: stage.current.clientHeight,
        });
    };
    const setZoom = (next: number) => {
        setZoomValue(next);
        setOffset((current) => clamp(current, next));
        setStatus(t.zoom(Math.round(next * 100)));
    };
    const reset = () => {
        setZoomValue(1);
        setRotation(0);
        setOffset({ x: 0, y: 0 });
        setStatus(t.zoom(100));
    };
    const rotate = () => {
        const next = (rotation + 90) % 360;
        setRotation(next);
        setOffset((current) => clamp(current, zoom, next));
    };

    const pointers = useRef(new Map<number, { x: number; y: number }>());
    const gesture = useRef<Gesture | null>(null);
    const distance = () => {
        const [a, b] = [...pointers.current.values()];
        return a && b ? Math.hypot(a.x - b.x, a.y - b.y) : 0;
    };
    const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
        if (video) return;
        stage.current?.setPointerCapture?.(event.pointerId);
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (pointers.current.size === 2) gesture.current = { kind: 'pinch', distance: distance(), zoom };
        else if (zoom > 1) {
            gesture.current = { kind: 'pan', x: event.clientX, y: event.clientY, from: offset };
            setPanning(true);
        } else gesture.current = { kind: 'swipe', x: event.clientX, y: event.clientY };
    };
    const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
        const current = gesture.current;
        if (!pointers.current.has(event.pointerId) || !current) return;
        pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY });
        if (current.kind === 'pinch') {
            const next = pinchZoom(current.zoom, current.distance, distance());
            setZoomValue(next);
            setOffset((value) => clamp(value, next));
        } else if (current.kind === 'pan') {
            setOffset(
                clamp({
                    x: current.from.x + event.clientX - current.x,
                    y: current.from.y + event.clientY - current.y,
                })
            );
        }
    };
    const onPointerUp = (event: PointerEvent<HTMLDivElement>) => {
        if (!pointers.current.has(event.pointerId)) return;
        pointers.current.delete(event.pointerId);
        const current = gesture.current;
        if (current?.kind === 'swipe')
            go(swipeDirection(event.clientX - current.x, event.clientY - current.y, dir === 'rtl'));
        if (current?.kind === 'pinch') setStatus(t.zoom(Math.round(zoom * 100)));
        gesture.current = null;
        setPanning(false);
    };
    const onWheel = (event: WheelEvent<HTMLDivElement>) => {
        if (!event.ctrlKey || video) return;
        event.preventDefault();
        setZoom(stepZoom(zoom, event.deltaY < 0 ? 1 : -1));
    };

    // Fill the screen (Fullscreen API) with the dialog
    const content = useRef<HTMLDivElement>(null);
    const [screen, setScreen] = useState(false);
    // Rendered in the browser only (the dialog mounts when it opens)
    const [screenable] = useState(
        () => typeof document !== 'undefined' && !!document.documentElement.requestFullscreen
    );
    useEffect(() => {
        const onChange = () => setScreen(!!document.fullscreenElement);
        document.addEventListener('fullscreenchange', onChange);
        return () => document.removeEventListener('fullscreenchange', onChange);
    }, []);
    const toggleScreen = () => {
        if (document.fullscreenElement) void document.exitFullscreen();
        else void content.current?.requestFullscreen?.();
    };

    // Keyboard: arrows change the picture (or move a zoomed one), + − 0 zoom, R rotates, F fills the screen
    const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
        // The video player keeps its own keys
        if ((event.target as HTMLElement).closest('video')) return;
        if (event.ctrlKey || event.metaKey || event.altKey) return;
        const pan = (x: number, y: number) => setOffset((value) => clamp({ x: value.x + x, y: value.y + y }));
        const back = dir === 'rtl' ? 1 : -1;
        const keys: Record<string, () => void> = {
            ArrowLeft: () => (zoom > 1 ? pan(40, 0) : go(back)),
            ArrowRight: () => (zoom > 1 ? pan(-40, 0) : go(-back)),
            ArrowUp: () => zoom > 1 && pan(0, 40),
            ArrowDown: () => zoom > 1 && pan(0, -40),
            '+': () => setZoom(stepZoom(zoom, 1)),
            '=': () => setZoom(stepZoom(zoom, 1)),
            '-': () => setZoom(stepZoom(zoom, -1)),
            '0': reset,
            r: rotate,
            R: rotate,
            f: toggleScreen,
            F: toggleScreen,
        };
        const action = keys[event.key];
        if (!action) return;
        event.preventDefault();
        action();
    };

    return (
        <ArkDialog.Content ref={content} className={styles.lightbox()} onKeyDown={onKeyDown}>
            <div className={styles.header()}>
                <ArkDialog.Title className={styles.title()}>{label}</ArkDialog.Title>
                <span className={styles.counter()}>
                    {page + 1} / {images.length}
                </span>
                <ArkDialog.CloseTrigger className={closeStyles.close()} aria-label={t.close}>
                    <X className={closeStyles.closeIcon()} aria-hidden="true" />
                </ArkDialog.CloseTrigger>
            </div>
            <div role="group" aria-label={t.toolbar} className={styles.toolbar()}>
                <IconButton
                    icon={ChevronLeft}
                    label={translations.carousel.prevTrigger}
                    variant="text"
                    size="sm"
                    disabled={page <= 0}
                    onClick={() => go(-1)}
                />
                <IconButton
                    icon={ChevronRight}
                    label={translations.carousel.nextTrigger}
                    variant="text"
                    size="sm"
                    disabled={page >= images.length - 1}
                    onClick={() => go(1)}
                />
                {!video && (
                    <>
                        <IconButton
                            icon={ZoomOut}
                            label={t.zoomOut}
                            variant="text"
                            size="sm"
                            disabled={zoom <= zoomLimits.min}
                            onClick={() => setZoom(stepZoom(zoom, -1))}
                        />
                        <span className={styles.zoomValue()} aria-hidden="true">
                            {Math.round(zoom * 100)} %
                        </span>
                        <IconButton
                            icon={ZoomIn}
                            label={t.zoomIn}
                            variant="text"
                            size="sm"
                            disabled={zoom >= zoomLimits.max}
                            onClick={() => setZoom(stepZoom(zoom, 1))}
                        />
                        <IconButton icon={Scan} label={t.resetZoom} variant="text" size="sm" onClick={reset} />
                        <IconButton icon={RotateCw} label={t.rotate} variant="text" size="sm" onClick={rotate} />
                    </>
                )}
                {item && (
                    <a
                        href={item.download ?? item.fullSrc ?? item.src}
                        download
                        className={button.base()}
                        aria-label={t.download}
                    >
                        <Download className={button.icon()} aria-hidden="true" />
                    </a>
                )}
                {screenable && (
                    <IconButton
                        icon={screen ? Minimize : Maximize}
                        label={screen ? t.exitScreen : t.screen}
                        variant="text"
                        size="sm"
                        onClick={toggleScreen}
                    />
                )}
            </div>
            {/* Pointer gestures only; the buttons and keys do the same */}
            {item && (
                <div
                    ref={stage}
                    className={styles.zoomStage()}
                    data-zoomed={zoom > 1 || undefined}
                    data-panning={panning || undefined}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                    onWheel={onWheel}
                >
                    {video ? (
                        <GalleryVideo item={item} className={styles.zoomVideo()} />
                    ) : (
                        <img
                            ref={image}
                            src={item.fullSrc ?? item.src}
                            alt={item.alt}
                            draggable="false"
                            className={styles.zoomImage()}
                            data-panning={panning || undefined}
                            style={{
                                transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom}) rotate(${rotation}deg)`,
                            }}
                        />
                    )}
                </div>
            )}
            {item?.caption && <p className={styles.caption()}>{item.caption}</p>}
            <p className={styles.shortcuts()}>{t.shortcuts}</p>
            <p role="status" className={styles.status()}>
                {status}
            </p>
        </ArkDialog.Content>
    );
}
