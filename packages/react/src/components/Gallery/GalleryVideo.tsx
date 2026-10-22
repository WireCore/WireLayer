import type { GalleryImage } from './Gallery.js';

/** A video slide with its sources and text tracks (captions) */
/** `inactive`: on a slide out of view – not a Tab stop then (the slide is aria-hidden) */
export function GalleryVideo({
    item,
    className,
    inactive,
}: {
    item: GalleryImage;
    className: string;
    inactive?: boolean;
}) {
    return (
        <video
            tabIndex={inactive ? -1 : undefined}
            controls
            preload="metadata"
            poster={item.poster ?? item.thumbnail}
            aria-label={item.alt}
            className={className}
        >
            {(item.sources ?? [{ src: item.src }]).map((source) => (
                <source key={source.src} src={source.src} type={source.type} />
            ))}
            {(item.tracks ?? []).map((track) => (
                <track
                    key={track.src}
                    kind={track.kind ?? 'captions'}
                    src={track.src}
                    srcLang={track.srclang}
                    label={track.label}
                    default={track.default || undefined}
                />
            ))}
        </video>
    );
}
