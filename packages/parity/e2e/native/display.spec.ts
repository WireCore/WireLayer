import { expect, test } from '@playwright/test';
import { openStory } from '../story.ts';

// Display and navigation components of @wirecore/wirelayer-native (RN part 2) in the browser (react-native-web)

test.describe('BottomNavigation', () => {
    test('tabs with the current one selected; the badge is part of the name', async ({ page }) => {
        await openStory(page, 'navigation-bottomnavigation--playground');
        const bar = page.getByRole('tablist', { name: 'Navigation' });
        await expect(bar.getByRole('tab')).toHaveCount(4);
        await expect(bar.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'true');
        await bar.getByRole('tab', { name: 'Alerts 4' }).click();
        await expect(bar.getByRole('tab', { name: 'Alerts 4' })).toHaveAttribute('aria-selected', 'true');
        await expect(bar.getByRole('tab', { name: 'Alerts 4' })).toHaveAttribute('aria-current', 'page');
        await expect(bar.getByRole('tab', { name: 'Home' })).toHaveAttribute('aria-selected', 'false');
        await expect(page.getByText('Alerts', { exact: true }).first()).toBeVisible();
    });
});

test.describe('Carousel', () => {
    test('arrow keys, Home and End turn the pages; dots and buttons too', async ({ page }) => {
        await openStory(page, 'media-carousel--playground');
        const carousel = page.getByRole('region', { name: 'What our customers say' });
        const viewport = carousel.getByLabel('1 / 4');
        await viewport.focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByText('Page 2')).toBeVisible();
        await expect(carousel.getByRole('group', { name: 'Image 2 of 4' })).not.toHaveAttribute('aria-hidden', 'true');
        await expect(carousel.getByRole('button', { name: 'Show image 2' })).toHaveAttribute('aria-current', 'true');
        await page.keyboard.press('End');
        await expect(page.getByText('Page 4')).toBeVisible();
        await expect(carousel.getByRole('button', { name: 'Next image' })).toBeDisabled();
        await page.keyboard.press('Home');
        await expect(page.getByText('Page 1')).toBeVisible();
        await carousel.getByRole('button', { name: 'Show image 3' }).click();
        await expect(page.getByText('Page 3')).toBeVisible();
        await carousel.getByRole('button', { name: 'Previous image' }).click();
        await expect(page.getByText('Page 2')).toBeVisible();
    });

    test('autoplay has a pause button; with reduced motion it does not start by itself', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await openStory(page, 'media-carousel--autoplay');
        await expect(page.getByRole('button', { name: 'Play automatically' })).toBeVisible();
        await page.getByRole('button', { name: 'Play automatically' }).click();
        await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
        await expect(page.getByText('Page 2')).toBeVisible({ timeout: 6000 });
        await page.getByRole('button', { name: 'Pause' }).click();
        await expect(page.getByRole('button', { name: 'Play automatically' })).toBeVisible();
    });
});

test.describe('Pagination', () => {
    test('page buttons, arrows and the summary', async ({ page }) => {
        await openStory(page, 'data-pagination--playground');
        const nav = page.getByRole('navigation', { name: 'Pagination' });
        await expect(nav.getByRole('button', { name: 'Page 1 of 24' })).toHaveAttribute('aria-current', 'page');
        await expect(nav.getByRole('button', { name: 'Previous page' })).toBeDisabled();
        await nav.getByRole('button', { name: 'Page 2 of 24' }).click();
        await expect(nav.getByText('11–20 of 240')).toBeVisible();
        await nav.getByRole('button', { name: 'Page 24 of 24' }).click();
        await expect(nav.getByRole('button', { name: 'Next page' })).toBeDisabled();
        await expect(nav.getByText('231–240 of 240')).toBeVisible();
        await nav.getByRole('button', { name: 'Previous page' }).click();
        await expect(page.getByText('Page 23, 10 per page')).toBeVisible();
    });

    test('compact with the page size in a sheet keeps the first item in view', async ({ page }) => {
        await openStory(page, 'data-pagination--compact');
        const nav = page.getByRole('navigation', { name: 'Pagination' });
        await expect(nav.getByText('Page 1 of 24')).toBeVisible();
        await nav.getByRole('button', { name: 'Next page' }).click();
        await nav.getByRole('button', { name: 'Next page' }).click();
        await expect(nav.getByText('Page 3 of 24')).toBeVisible();
        await nav.getByRole('button', { name: /^Per page/ }).click();
        await page.getByRole('dialog', { name: 'Per page' }).getByRole('radio', { name: '25' }).click();
        // Item 21 (first of page 3 with 10) is on page 1 with 25
        await expect(nav.getByText('Page 1 of 10')).toBeVisible();
        await expect(page.getByText('Page 1, 25 per page')).toBeVisible();
    });
});

test.describe('Truncate', () => {
    test('"Show more" shows the whole text', async ({ page }) => {
        await openStory(page, 'data-truncate--playground');
        const toggle = page.getByRole('button', { name: 'Show more' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(page.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    });
});

test.describe('Timeline', () => {
    test('a feed loads older entries', async ({ page }) => {
        await openStory(page, 'data-timeline--feed');
        const feed = page.getByRole('feed', { name: 'Backups' });
        await expect(feed.getByRole('article')).toHaveCount(3);
        await expect(feed.getByRole('article').first()).toHaveAttribute('aria-setsize', '-1');
        await page.getByRole('button', { name: 'Load older entries' }).click();
        await expect(feed.getByRole('article')).toHaveCount(6);
        await expect(page.getByRole('button', { name: 'Load older entries' })).toHaveCount(0);
        await expect(feed.getByRole('article').first()).toHaveAttribute('aria-setsize', '6');
    });
});

test.describe('Image', () => {
    test('the preview opens full screen, zooms with the buttons and closes with Escape', async ({ page }) => {
        await openStory(page, 'media-image--playground');
        await page.getByRole('button', { name: 'View larger: Server racks in the data center' }).click();
        const viewer = page.getByRole('dialog', { name: 'Server racks in the data center' });
        await expect(viewer.getByRole('button', { name: 'Close' })).toBeFocused();
        await expect(viewer.getByRole('button', { name: 'Zoom out' })).toBeDisabled();
        await viewer.getByRole('button', { name: 'Zoom in' }).click();
        await expect(viewer.getByRole('status')).toHaveText('Zoom 150 %');
        await page.keyboard.press('Escape');
        await expect(viewer).toBeHidden();
    });
});
