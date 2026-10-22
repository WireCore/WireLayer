import {
    clampPdfPage,
    clampPdfZoom,
    pdfFileName,
    pdfViewer,
    pdfZoomStep,
    PDF_ZOOM_MAX,
    PDF_ZOOM_MIN,
    type PdfZoom,
} from '@wirecore/wirelayer-recipes/native';
import { ChevronLeft, ChevronRight, Download, Share2, ZoomIn, ZoomOut } from 'lucide-react-native';
import { useEffect, useRef, useState, type ComponentRef } from 'react';
import { Linking, Platform, Text, View, type ViewProps } from 'react-native';
import Pdf from 'react-native-pdf';
import { withUniwind } from 'uniwind';
import { Button } from '../components/Button/Button.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { useLocale } from '../locale.js';
import { useAnnouncer } from '../utils/announce.js';
import { Loader } from '../utils/Loader.js';
import { useControllable } from '../utils/useControllable.js';

const StyledPdf = withUniwind(Pdf);

/** Where the PDF comes from: a URL or file path, a request with headers, or a bundled asset (`require('./a.pdf')`) */
export type PdfSource = string | { uri: string; headers?: Record<string, string>; cache?: boolean } | number;

export interface PdfViewerProps extends Omit<ViewProps, 'children'> {
    /** The PDF: `https://…`, `file://…`, `{ uri, headers }` or a bundled asset */
    src: PdfSource;
    /** Shown page (1-based); controlled together with onPageChange */
    page?: number;
    /** Page at the start (uncontrolled) */
    defaultPage?: number;
    onPageChange?: (page: number) => void;
    /** Zoom factor (1 = page width, 0.5–4) or `page-width`/`page-fit`; controlled together with onZoomChange */
    zoom?: PdfZoom;
    /** Zoom at the start (uncontrolled, default `page-width`) */
    defaultZoom?: PdfZoom;
    onZoomChange?: (zoom: PdfZoom) => void;
    /** Bar with page x of y, previous/next, zoom and share (default true) */
    toolbar?: boolean;
    /** Swipe page by page instead of scrolling through all pages */
    paging?: boolean;
    /** Pages side by side (swipe sideways) instead of below each other */
    horizontal?: boolean;
    /** Password of a protected PDF */
    password?: string;
    /** Headers of the request when `src` is a URL (e.g. authorization) – merged into `{ uri, headers }` */
    headers?: Record<string, string>;
    /**
     * Accepts invalid TLS certificates of the server (react-native-pdf `trustAllCerts`). Default false – only for
     * development servers with self-signed certificates
     */
    trustAllCerts?: boolean;
    /** Accessible name of the document (default "PDF document") */
    label?: string;
    /** File name for sharing (default: from the URL) */
    fileName?: string;
    /**
     * Shows a share button: gets the local file (react-native-pdf keeps a downloaded copy) – e.g. `shareUri` from
     * `@wirecore/wirelayer-native/expo-sharing`, which opens the system share sheet (save, mail, open in another app)
     */
    onShare?: (file: { uri: string; fileName: string }) => void;
    /** A tap on a link inside the PDF (default: Linking.openURL for http(s) and mailto) */
    onLinkPress?: (url: string) => void;
    onLoaded?: (details: { numPages: number }) => void;
    onError?: (error: unknown) => void;
    className?: string;
}

/** The downloaded copy as a file URI (react-native-pdf reports a plain path) */
const localUri = (path: string | undefined) =>
    !path ? undefined : /^[a-z]+:\/\//i.test(path) ? path : `file://${path}`;

const remoteUri = (src: PdfSource) => (typeof src === 'string' ? src : typeof src === 'number' ? undefined : src.uri);

/**
 * PDF pages with react-native-pdf (optional peer dependency, with react-native-blob-util): page x of y, previous/next,
 * zoom (pinch or buttons) and sharing. Needs a development build (config plugins) – not Expo Go; on the web
 * (react-native-web) it shows a note and a link to the file instead.
 */
export function PdfViewer({
    src,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    zoom: zoomProp,
    defaultZoom = 'page-width',
    onZoomChange,
    toolbar = true,
    paging = false,
    horizontal = false,
    password,
    headers,
    trustAllCerts = false,
    label,
    fileName,
    onShare,
    onLinkPress,
    onLoaded,
    onError,
    className,
    ...props
}: PdfViewerProps) {
    const { translations, locale } = useLocale();
    const t = translations.pdfViewer;
    const styles = pdfViewer();
    const { announce, region } = useAnnouncer();
    const [page, setPage] = useControllable(pageProp, defaultPage, onPageChange);
    const [zoom, setZoom] = useControllable(zoomProp, defaultZoom, onZoomChange);
    const [count, setCount] = useState(0);
    const [file, setFile] = useState<string | undefined>(undefined);
    const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
    const [attempt, setAttempt] = useState(0);
    const pdf = useRef<ComponentRef<typeof Pdf>>(null);
    const name = pdfFileName(remoteUri(src) ?? '', fileName, t.fileName);
    const uri = remoteUri(src);

    // A page set from outside (controlled) is shown by the viewer, too
    useEffect(() => {
        if (count && pageProp !== undefined) pdf.current?.setPage(clampPdfPage(pageProp, count));
    }, [pageProp, count]);

    if (Platform.OS === 'web') {
        return (
            <View {...props} role="group" aria-label={label ?? t.label} className={styles.base({ class: className })}>
                <View className={styles.state()}>
                    <Text className={styles.stateText()}>{t.unsupported}</Text>
                    {!!uri && (
                        <Button
                            variant="outline"
                            size="sm"
                            leadingIcon={Download}
                            onPress={() => void Linking.openURL(uri)}
                        >
                            {t.download}
                        </Button>
                    )}
                </View>
            </View>
        );
    }

    const scale = typeof zoom === 'number' ? (clampPdfZoom(zoom) as number) : 1;
    const source =
        typeof src === 'number'
            ? src
            : typeof src === 'string'
              ? { uri: src, cache: true, ...(headers ? { headers } : {}) }
              : { cache: true, ...src, ...(headers ? { headers: { ...src.headers, ...headers } } : {}) };
    const go = (next: number) => {
        const target = clampPdfPage(next, count);
        pdf.current?.setPage(target);
        setPage(target);
    };
    const zoomBy = (direction: 1 | -1) => {
        const next = pdfZoomStep(scale, direction);
        setZoom(next);
        announce(`${t.zoom} ${Math.round(next * 100)} %`);
    };

    return (
        <View {...props} role="group" aria-label={label ?? t.label} className={styles.base({ class: className })}>
            {region}
            {toolbar && (
                <View role="toolbar" aria-label={t.toolbar} className={styles.toolbar()}>
                    <View className={styles.group()}>
                        <IconButton
                            icon={ChevronLeft}
                            label={t.previousPage}
                            variant="text"
                            size="sm"
                            disabled={status !== 'ready' || page <= 1}
                            onPress={() => go(page - 1)}
                        />
                        <Text className={styles.status()} aria-live="polite">
                            {count ? t.pageStatus(page, count) : t.page}
                        </Text>
                        <IconButton
                            icon={ChevronRight}
                            label={t.nextPage}
                            variant="text"
                            size="sm"
                            disabled={status !== 'ready' || page >= count}
                            onPress={() => go(page + 1)}
                        />
                    </View>
                    <View className={styles.group()}>
                        <IconButton
                            icon={ZoomOut}
                            label={t.zoomOut}
                            variant="text"
                            size="sm"
                            disabled={status !== 'ready' || scale <= PDF_ZOOM_MIN}
                            onPress={() => zoomBy(-1)}
                        />
                        <Text className={styles.zoom()}>
                            {new Intl.NumberFormat(locale, { style: 'percent' }).format(scale)}
                        </Text>
                        <IconButton
                            icon={ZoomIn}
                            label={t.zoomIn}
                            variant="text"
                            size="sm"
                            disabled={status !== 'ready' || scale >= PDF_ZOOM_MAX}
                            onPress={() => zoomBy(1)}
                        />
                        {!!onShare && (
                            <IconButton
                                icon={Share2}
                                label={t.share}
                                variant="text"
                                size="sm"
                                disabled={!file && !uri}
                                onPress={() => onShare({ uri: localUri(file) ?? uri!, fileName: name })}
                            />
                        )}
                    </View>
                </View>
            )}
            <View
                className={styles.document()}
                aria-busy={status === 'loading'}
                aria-label={count ? `${label ?? t.label}, ${t.pageStatus(page, count)}` : (label ?? t.label)}
            >
                {status === 'error' ? (
                    <View className={styles.state()} role="alert">
                        <Text className={styles.errorText()}>{t.error}</Text>
                        <Button
                            variant="outline"
                            size="sm"
                            onPress={() => {
                                setStatus('loading');
                                setAttempt((value) => value + 1);
                            }}
                        >
                            {translations.dataSource.retry}
                        </Button>
                    </View>
                ) : (
                    <StyledPdf
                        key={attempt}
                        ref={pdf}
                        source={source}
                        page={page}
                        scale={scale}
                        minScale={PDF_ZOOM_MIN}
                        maxScale={PDF_ZOOM_MAX}
                        fitPolicy={zoom === 'page-fit' ? 2 : 0}
                        enablePaging={paging}
                        horizontal={horizontal}
                        password={password}
                        trustAllCerts={trustAllCerts}
                        className={styles.pdf()}
                        renderActivityIndicator={() => (
                            <View className={styles.state()}>
                                <Loader className={styles.spinner()} />
                                <Text className={styles.stateText()}>{t.loading}</Text>
                            </View>
                        )}
                        onLoadComplete={(pages, path) => {
                            setCount(pages);
                            setFile(path);
                            setStatus('ready');
                            announce(t.loaded(pages));
                            onLoaded?.({ numPages: pages });
                        }}
                        onPageChanged={(current) => {
                            if (current !== page) setPage(current);
                        }}
                        onScaleChanged={(next) => {
                            if (Math.abs(next - scale) > 0.01) setZoom(clampPdfZoom(next) as number);
                        }}
                        onPressLink={(url) => {
                            if (onLinkPress) onLinkPress(url);
                            else if (/^(https?|mailto):/i.test(url)) void Linking.openURL(url);
                        }}
                        onError={(error) => {
                            setStatus('error');
                            announce(t.error);
                            onError?.(error);
                        }}
                    />
                )}
            </View>
        </View>
    );
}
