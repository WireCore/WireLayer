import { fireEvent, screen, waitFor, within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { el, frameworks, render } from './harness.js';

// Gallery lightbox, video slides and Image fallbacks

const pictures = [
    { src: '/reception.jpg', alt: 'Reception area', fullSrc: '/reception-large.jpg' },
    { src: '/office.jpg', alt: 'Open-plan office', download: '/office.zip' },
    {
        type: 'video',
        src: '/tour.mp4',
        alt: 'Tour',
        tracks: [{ src: '/tour.de.vtt', srclang: 'de', label: 'German', default: true }],
    },
];

describe.each(frameworks)('%s', (framework) => {
    describe('Gallery lightbox', () => {
        it('zooms, rotates and changes pictures with buttons and keys; announces the zoom', async () => {
            const onPage = vi.fn();
            await render(
                framework,
                el('Gallery', {
                    images: pictures,
                    label: 'Office',
                    tools: true,
                    [framework === 'vue' ? 'onUpdate:page' : 'onPageChange']: onPage,
                })
            );
            await userEvent.click(screen.getByRole('button', { name: 'Full screen' }));
            const dialog = await screen.findByRole('dialog', { name: 'Office' });
            const tools = within(dialog).getByRole('group', { name: 'Image tools' });
            const picture = within(dialog).getByRole('img', { name: 'Reception area' });
            expect(picture).toHaveAttribute('src', '/reception-large.jpg');
            expect(within(dialog).getByText('1 / 3')).toBeInTheDocument();
            await userEvent.click(within(tools).getByRole('button', { name: 'Zoom in' }));
            expect(within(dialog).getByRole('status')).toHaveTextContent('Zoom 150 %');
            expect(picture.style.transform).toContain('scale(1.5)');
            await userEvent.click(within(tools).getByRole('button', { name: 'Rotate' }));
            expect(picture.style.transform).toContain('rotate(90deg)');
            // Vue updates the DOM a tick later: wait for it after events fired by hand
            fireEvent.keyDown(picture, { key: '0' });
            await waitFor(() => expect(picture.style.transform).toContain('scale(1)'));
            fireEvent.keyDown(picture, { key: '+' });
            await waitFor(() => expect(picture.style.transform).toContain('scale(1.5)'));
            fireEvent.keyDown(picture, { key: '0' });
            await waitFor(() => expect(picture.style.transform).toContain('scale(1)'));
            fireEvent.keyDown(picture, { key: 'ArrowRight' });
            expect(onPage).toHaveBeenLastCalledWith(1);
            await waitFor(() => expect(within(dialog).getByText('2 / 3')).toBeInTheDocument());
            expect(within(tools).getByRole('link', { name: 'Download' })).toHaveAttribute('href', '/office.zip');
        });

        it('a video slide plays with its captions track', async () => {
            await render(framework, el('Gallery', { images: pictures, label: 'Office', defaultPage: 2 }));
            const video = document.querySelector('video[aria-label="Tour"]')!;
            expect(video).toHaveAttribute('controls');
            expect(video.querySelector('track')).toHaveAttribute('kind', 'captions');
            expect(video.querySelector('track')).toHaveAttribute('srclang', 'de');
        });
    });

    describe('Gallery loading more', () => {
        it('asks for more pictures near the end (hasMore), once per number of pictures', async () => {
            const onLoadMore = vi.fn();
            const images = pictures.slice(0, 2).concat({ src: '/kitchen.jpg', alt: 'Kitchen' } as never);
            await render(framework, el('Gallery', { images, label: 'Office', hasMore: true, onLoadMore }));
            expect(onLoadMore).not.toHaveBeenCalled();
            await userEvent.click(screen.getByRole('button', { name: 'Show image 2 of 3' }));
            await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(1));
            await userEvent.click(screen.getByRole('button', { name: 'Show image 3 of 3' }));
            expect(onLoadMore).toHaveBeenCalledTimes(1);
        });

        it('marks the gallery busy while loading', async () => {
            await render(framework, el('Gallery', { images: pictures, label: 'Office', loading: true }));
            expect(document.querySelector('[aria-busy="true"]')).not.toBeNull();
        });
    });

    describe('Image', () => {
        it('shows the fallback when the picture fails', async () => {
            await render(
                framework,
                el('Image', { src: '/missing.jpg', alt: 'Server room', fallbackSrc: '/placeholder.svg' })
            );
            const image = screen.getByRole('img', { name: 'Server room' });
            fireEvent.error(image);
            await waitFor(() => expect(image).toHaveAttribute('src', '/placeholder.svg'));
        });
    });

    // pdf.js is a stub here (setup.ts) – the document stays loading; the viewer itself is tested in e2e/pdf.spec.ts
    describe('PdfViewer', () => {
        it('loading: a busy named region, the toolbar waits for the document', async () => {
            await render(framework, el('PdfViewer', { src: '/document.pdf' }));
            const viewer = screen.getByRole('region', { name: 'PDF document' });
            expect(viewer).toHaveAttribute('aria-busy', 'true');
            expect(
                within(viewer)
                    .getAllByRole('status')
                    .map((status) => status.textContent)
            ).toContain('Loading PDF');
            const toolbar = within(viewer).getByRole('toolbar', { name: 'PDF tools' });
            expect(within(toolbar).getByRole('button', { name: 'Next page' })).toBeDisabled();
            expect(within(toolbar).getByRole('textbox', { name: 'Page' })).toBeDisabled();
            expect(within(toolbar).getByRole('button', { name: 'Download' })).toBeDisabled();
            expect(within(viewer).getByRole('document', { name: 'Document pages' })).toHaveAttribute('tabindex', '0');
        });

        it('side bar: the button opens it and reports it; controlled it stays as given', async () => {
            const onSidebar = vi.fn();
            const event = framework === 'vue' ? 'onUpdate:sidebar' : 'onSidebarChange';
            await render(framework, el('PdfViewer', { src: '/document.pdf', [event]: onSidebar }));
            const toggle = screen.getByRole('button', { name: 'Sidebar' });
            expect(toggle).toHaveAttribute('aria-expanded', 'false');
            await userEvent.click(toggle);
            expect(toggle).toHaveAttribute('aria-expanded', 'true');
            expect(onSidebar).toHaveBeenLastCalledWith(true);
            expect(screen.getByRole('tab', { name: 'Pages' })).toBeInTheDocument();
            await userEvent.click(screen.getByRole('tab', { name: 'Contents' }));
            expect(await screen.findByText('No table of contents')).toBeInTheDocument();
        });

        it('side bar controlled: a click reports the wish, the prop decides', async () => {
            const onSidebar = vi.fn();
            const event = framework === 'vue' ? 'onUpdate:sidebar' : 'onSidebarChange';
            await render(framework, el('PdfViewer', { src: '/document.pdf', sidebar: false, [event]: onSidebar }));
            await userEvent.click(screen.getByRole('button', { name: 'Sidebar' }));
            expect(onSidebar).toHaveBeenCalledWith(true);
            expect(screen.getByRole('button', { name: 'Sidebar' })).toHaveAttribute('aria-expanded', 'false');
        });

        it('toolbar: only the listed tools, none without toolbar', async () => {
            await render(framework, el('PdfViewer', { src: '/document.pdf', toolbar: ['zoom', 'download'] }));
            const toolbar = screen.getByRole('toolbar', { name: 'PDF tools' });
            expect(within(toolbar).getByRole('combobox', { name: 'Zoom' })).toBeInTheDocument();
            expect(within(toolbar).queryByRole('button', { name: 'Sidebar' })).toBeNull();
            expect(within(toolbar).queryByRole('textbox', { name: 'Page' })).toBeNull();
        });
    });
});
