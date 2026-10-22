import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('Carousel', () => {
    test('buttons and dots turn the pages, arrow keys move between the dots', async ({ page }) => {
        await openStory(page, 'media-carousel--playground');
        const carousel = page.getByRole('region', { name: 'Case studies' });
        await expect(carousel).toHaveAttribute('aria-roledescription', 'carousel');
        await expect(carousel.getByRole('button', { name: 'Previous image' })).toBeDisabled();
        await carousel.getByRole('button', { name: 'Next image' }).click();
        await expect(page.getByText('Page: 2')).toBeVisible();
        const second = carousel.getByRole('button', { name: 'Show image 2' });
        await expect(second).toHaveAttribute('aria-current', 'true');
        await second.focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByText('Page: 3')).toBeVisible();
        await expect(carousel.getByRole('button', { name: 'Show image 3' })).toBeFocused();
        await page.keyboard.press('End');
        await expect(page.getByText('Page: 5')).toBeVisible();
        await expect(carousel.getByRole('button', { name: 'Next image' })).toBeDisabled();
    });

    test('autoplay can be paused (WCAG 2.2.2)', async ({ page }) => {
        await openStory(page, 'media-carousel--autoplay');
        await page.getByRole('button', { name: 'Pause' }).click();
        await expect(page.getByRole('button', { name: 'Play automatically' })).toBeVisible();
    });
});

test.describe('Gallery', () => {
    test('thumbnails choose the picture and mark the current one', async ({ page }) => {
        await openStory(page, 'media-gallery--playground');
        const thumbnails = page.getByRole('group', { name: 'Thumbnails' });
        await expect(thumbnails.getByRole('button', { name: 'Show image 1 of 4' })).toHaveAttribute(
            'aria-current',
            'true'
        );
        await thumbnails.getByRole('button', { name: 'Show image 3 of 4' }).click();
        await expect(page.getByText('Image: 3')).toBeVisible();
        await expect(thumbnails.getByRole('button', { name: 'Show image 3 of 4' })).toHaveAttribute(
            'aria-current',
            'true'
        );
        await expect(page.getByRole('img', { name: 'Server racks in the data center' })).toBeInViewport();
    });

    test('fullscreen opens a dialog at the same picture, Escape returns focus', async ({ page }) => {
        await openStory(page, 'media-gallery--playground');
        await page
            .getByRole('group', { name: 'Thumbnails' })
            .getByRole('button', { name: 'Show image 2 of 4' })
            .click();
        await page.getByRole('button', { name: 'Full screen' }).click();
        const dialog = page.getByRole('dialog', { name: 'Our office' });
        await expect(dialog).toBeVisible();
        await expect(dialog.getByRole('img', { name: 'Open-plan office with rows of desks' })).toBeInViewport();
        await dialog.getByRole('button', { name: 'Next image' }).click();
        await expect(dialog.getByRole('img', { name: 'Server racks in the data center' })).toBeInViewport();
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: 'Full screen' })).toBeFocused();
        await expect(page.getByText('Image: 3')).toBeVisible();
    });
});

test.describe('Chart', () => {
    test('the canvas is an image named by the title, the data opens as a table', async ({ page }) => {
        await openStory(page, 'data-chart--playground');
        await expect(page.getByRole('img', { name: 'Revenue by quarter (k€)' })).toBeVisible();
        await page.getByText('Data as table').click();
        const table = page.getByRole('table', { name: 'Revenue by quarter (k€)' });
        await expect(table.getByRole('columnheader')).toHaveText(['Category', '2025', '2026']);
        await expect(table.getByRole('row', { name: 'Q4' })).toContainText('241');
    });

    test('recolors when the mode changes', async ({ page }) => {
        await openStory(page, 'data-chart--playground', 'dark');
        const canvas = page.getByRole('img', { name: 'Revenue by quarter (k€)' });
        await page.waitForTimeout(1200);
        const dark = await canvas.screenshot();
        await page.evaluate(() => (document.documentElement.dataset.mode = 'light'));
        await expect.poll(async () => Buffer.compare(await canvas.screenshot(), dark)).not.toBe(0);
    });
});

test.describe('Gallery lightbox', () => {
    test('keys zoom, rotate and change pictures; the zoom is announced', async ({ page }) => {
        await openStory(page, 'media-gallery--lightbox');
        await page.getByRole('button', { name: 'Full screen' }).click();
        const dialog = page.getByRole('dialog', { name: 'Our office' });
        const picture = dialog.getByRole('img', { name: 'Reception area with a counter' });
        await expect(picture).toBeVisible();
        await page.keyboard.press('+');
        await expect(dialog.getByRole('status')).toHaveText('Zoom 150 %');
        await expect(picture).toHaveAttribute('style', /scale\(1\.5\)/);
        await page.keyboard.press('r');
        await expect(picture).toHaveAttribute('style', /rotate\(90deg\)/);
        await page.keyboard.press('0');
        await page.keyboard.press('ArrowRight');
        await expect(dialog.getByText('2 / 4')).toBeVisible();
        await expect(dialog.getByRole('img', { name: 'Open-plan office with rows of desks' })).toBeVisible();
        await expect(dialog.getByRole('link', { name: 'Download' })).toHaveAttribute('download', '');
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
    });

    test('a swipe changes the picture', async ({ page }) => {
        await openStory(page, 'media-gallery--lightbox');
        await page.getByRole('button', { name: 'Full screen' }).click();
        const dialog = page.getByRole('dialog', { name: 'Our office' });
        const stage = dialog.locator('[data-zoomed], img').first();
        const box = (await stage.boundingBox())!;
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 5 });
        await page.mouse.up();
        await expect(dialog.getByText('2 / 4')).toBeVisible();
    });
});

test.describe('Carousel layouts', () => {
    test('vertical: the next button moves the slides up; part slides show 1.5 per page', async ({ page }) => {
        await openStory(page, 'media-carousel--vertical');
        const carousel = page.getByRole('region', { name: 'Case studies' });
        await expect(carousel).toHaveAttribute('data-orientation', 'vertical');
        await carousel.getByRole('button', { name: 'Next image' }).click();
        await expect(page.getByText('Page: 2')).toBeVisible();

        await openStory(page, 'media-carousel--part-slides');
        const first = page.getByRole('group', { name: 'Image 1 of 5' });
        const group = (await first.locator('xpath=..').boundingBox())!;
        const slide = (await first.boundingBox())!;
        // 1.5 slides per page: a slide takes about two thirds of the width
        expect(slide.width / group.width).toBeGreaterThan(0.6);
        expect(slide.width / group.width).toBeLessThan(0.7);
    });
});
