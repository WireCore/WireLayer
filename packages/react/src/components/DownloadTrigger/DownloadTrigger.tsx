import { useDownload, type DownloadableData } from '@ark-ui/react/download-trigger';
import { Download } from 'lucide-react';
import { useRef, useState, type MouseEvent } from 'react';
import { Button, type ButtonProps } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';

export interface DownloadTriggerProps extends Omit<ButtonProps, 'onError' | 'loading' | 'asChild'> {
    /** What to download: text, a Blob/File or a function that returns (a promise of) one */
    data?: DownloadableData | (() => DownloadableData | Promise<DownloadableData>);
    /** Address to fetch and save instead of `data` (same origin or CORS) */
    url?: string;
    /** File name, e.g. "bericht.csv" */
    fileName: string;
    /** MIME type of text data (default text/plain; a Blob keeps its own type) */
    mimeType?: string;
    /** The file was handed to the browser */
    onDownload?: () => void;
    /** Getting the data failed */
    onError?: (error: unknown) => void;
}

/** Button that saves text, a Blob or a fetched file; busy (aria-busy) while the data is prepared */
export function DownloadTrigger({
    data,
    url,
    fileName,
    mimeType,
    onDownload,
    onError,
    onClick,
    variant = 'outline',
    children,
    ...props
}: DownloadTriggerProps) {
    const t = useTranslations().downloadTrigger;
    const [loading, setLoading] = useState(false);
    const resolved = useRef<DownloadableData>('');
    const { download } = useDownload({
        fileName,
        mimeType: (mimeType ?? 'text/plain') as never,
        data: () => resolved.current,
    });

    const resolveData = async (): Promise<DownloadableData> => {
        if (url) {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
            return response.blob();
        }
        return typeof data === 'function' ? await data() : (data ?? '');
    };

    const handleClick = async (event: MouseEvent<HTMLButtonElement>) => {
        onClick?.(event);
        if (loading || event.defaultPrevented) return;
        setLoading(true);
        try {
            resolved.current = await resolveData();
            download();
            onDownload?.();
        } catch (error) {
            onError?.(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button {...props} variant={variant} loading={loading} leadingIcon={Download} onClick={handleClick}>
            {children ?? t.label}
        </Button>
    );
}
