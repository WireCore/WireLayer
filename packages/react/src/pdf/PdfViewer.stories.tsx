/// <reference types="vite/client" />
import type { Meta, StoryObj } from '@storybook/react-vite';
// pdf.js's stylesheet (text and annotation layers) and its worker as a URL – the setup an app does once
import 'pdfjs-dist/legacy/web/pdf_viewer.css';
import workerSrc from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import { useRef, useState } from 'react';
import { Button } from '../components/Button/Button.js';
import { PdfViewer, type PdfViewerHandle } from './PdfViewer.js';

// Sample documents (apps/storybook/public/pdf, made by apps/storybook/scripts/sample-pdf.ts); pdf.js's character
// maps and standard fonts come from pdfjs-dist (staticDirs in .storybook/main.ts)
const assets = { workerSrc, cMapUrl: 'pdfjs/cmaps/', standardFontDataUrl: 'pdfjs/standard_fonts/' };

const meta = {
    title: 'Media/PdfViewer',
    component: PdfViewer,
    args: { src: 'pdf/sample.pdf', ...assets, height: '560px' },
    parameters: { layout: 'padded' },
    render: (args) => <PdfViewer {...args} className="max-w-4xl" />,
} satisfies Meta<typeof PdfViewer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Side bar with thumbnails and the outline (a tree – choosing an entry jumps there) */
export const Sidebar: Story = { args: { sidebar: true } };

function ControlledViewer(args: Story['args']) {
    const [page, setPage] = useState(1);
    const [zoom, setZoom] = useState<number | 'page-width' | 'page-fit'>(1);
    const [pages, setPages] = useState(0);
    const viewer = useRef<PdfViewerHandle>(null);
    return (
        <div className="flex max-w-4xl flex-col gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => viewer.current?.goToPage(3)}>
                    Go to contact page
                </Button>
                <Button size="sm" variant="outline" onClick={() => viewer.current?.search('offer')}>
                    Search for “offer”
                </Button>
                <Button size="sm" variant="outline" onClick={() => setZoom(1.5)}>
                    150%
                </Button>
                <Button size="sm" variant="outline" onClick={() => void viewer.current?.download()}>
                    Download
                </Button>
                <span className="text-sm text-muted">{`Page ${page} of ${pages} · Zoom ${zoom}`}</span>
            </div>
            <PdfViewer
                {...args}
                src={args?.src ?? 'pdf/sample.pdf'}
                ref={viewer}
                page={page}
                onPageChange={setPage}
                zoom={zoom}
                onZoomChange={setZoom}
                onLoaded={(details) => setPages(details.numPages)}
            />
        </div>
    );
}

/** Page and zoom bound to the app (controlled), methods via ref: goToPage, search, download, print */
export const Controlled: Story = { render: (args) => <ControlledViewer {...args} /> };

function LayerViewer(args: Story['args']) {
    const [textLayer, setTextLayer] = useState(true);
    return (
        <div className="flex max-w-4xl flex-col gap-3">
            <Button
                size="sm"
                variant="outline"
                className="self-start"
                aria-pressed={!textLayer}
                onClick={() => setTextLayer(!textLayer)}
            >
                Hide text layer
            </Button>
            <PdfViewer {...args} src={args?.src ?? 'pdf/sample.pdf'} textLayer={textLayer} />
        </div>
    );
}

/** Text layer switched at runtime: the pages are drawn again, page and zoom stay */
export const Layers: Story = { name: 'Layers', render: (args) => <LayerViewer {...args} /> };

/** Only some tools; without the side bar, rotation, printing and full screen */
export const FewTools: Story = { args: { toolbar: ['page', 'zoom', 'search', 'download'], height: '420px' } };

/** A protected PDF asks for its password in a dialog – here: wirecore */
export const Password: Story = { args: { src: 'pdf/sample-password.pdf' } };

function LocalFileViewer(args: Story['args']) {
    const [file, setFile] = useState<File>();
    return (
        <div className="flex max-w-4xl flex-col gap-3">
            <label className="flex flex-col gap-1 text-sm">
                Choose a PDF file
                <input type="file" accept="application/pdf" onChange={(event) => setFile(event.target.files?.[0])} />
            </label>
            {file && <PdfViewer {...args} src={file} />}
        </div>
    );
}

/** A file chosen on the device (File/Blob) – nothing is uploaded */
export const LocalFile: Story = { render: (args) => <LocalFileViewer {...args} /> };

/** The document cannot be loaded: the message replaces the pages */
export const LoadError: Story = { args: { src: 'pdf/does-not-exist.pdf' } };
