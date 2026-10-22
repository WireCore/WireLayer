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
