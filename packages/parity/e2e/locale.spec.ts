import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

// The Storybook toolbar "Language" wraps every story in LocaleProvider and sets lang/dir on <html>; English is the
// default, German is built in
const german = (page: Parameters<typeof openStory>[0], id: string) => openStory(page, id, 'dark', 'wirecore', 'de-DE');
const rtl = (page: Parameters<typeof openStory>[0], id: string) => openStory(page, id, 'dark', 'wirecore', 'he-IL');
// Arabic is not built in – the Storybook registers it (registerLocale) like an app would
const arabic = (page: Parameters<typeof openStory>[0], id: string) => openStory(page, id, 'dark', 'wirecore', 'ar-EG');

test.describe('German', () => {
    test('texts and date format follow the locale', async ({ page }) => {
        await german(page, 'forms-datepicker--playground');
        await expect(page.locator('html')).toHaveAttribute('lang', 'de-DE');
        await expect(page.getByRole('button', { name: 'Kalender öffnen' })).toBeVisible();
        // de-DE: day.month.year
        const segments = page.getByRole('group', { name: 'Maintenance date' }).getByRole('spinbutton');
        await expect(segments.first()).toHaveAccessibleName(/Tag/);
    });

    test('pagination names and summary in German', async ({ page }) => {
        await german(page, 'data-pagination--playground');
        await expect(page.getByRole('navigation', { name: 'Seitennavigation' })).toBeVisible();
        await expect(page.getByRole('button', { name: 'Nächste Seite' })).toBeVisible();
        await expect(page.getByText(/^1–\d+ von \d+$/)).toBeVisible();
    });
});

test.describe('Right to left', () => {
    test('the switch thumb moves to the left when on', async ({ page }) => {
        await rtl(page, 'forms-switch--playground');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        const thumb = page.locator('[data-scope="switch"][data-part="thumb"]').first();
        const before = (await thumb.boundingBox())!.x;
        await page.getByRole('switch').first().focus();
        await page.keyboard.press('Space');
        await expect.poll(async () => (await thumb.boundingBox())!.x).toBeLessThan(before);
    });

    test('pagination: "previous" sits right of "next", its chevron points right', async ({ page }) => {
        await rtl(page, 'data-pagination--playground');
        const previous = (await page.getByRole('button', { name: 'Previous page' }).boundingBox())!;
        const next = (await page.getByRole('button', { name: 'Next page' }).boundingBox())!;
        expect(previous.x).toBeGreaterThan(next.x);
        const scale = await page
            .getByRole('button', { name: 'Previous page' })
            .locator('svg')
            .evaluate((icon) => getComputedStyle(icon).scale);
        expect(scale).toBe('-1 1');
    });

    test('menubar: arrow left goes to the next menu', async ({ page }) => {
        await rtl(page, 'navigation-menubar--playground');
        const file = page.getByRole('menuitem', { name: 'File' });
        await file.focus();
        await page.keyboard.press('ArrowLeft');
        await expect(page.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(file).toBeFocused();
    });

    test('a drawer at the end side opens on the left', async ({ page }) => {
        await rtl(page, 'overlays-drawer--playground');
        await page.getByRole('button').first().click();
        const dialog = page.getByRole('dialog', { name: 'Filter' });
        await expect(dialog).toBeVisible();
        await expect.poll(async () => (await dialog.boundingBox())!.x).toBeLessThan(10);
    });
});

test.describe('Arabic (registered language, right to left)', () => {
    test('pagination: Arabic names, "previous" right of "next"', async ({ page }) => {
        await arabic(page, 'data-pagination--playground');
        await expect(page.locator('html')).toHaveAttribute('lang', 'ar-EG');
        await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
        await expect(page.getByRole('navigation', { name: 'التنقل بين الصفحات' })).toBeVisible();
        const previous = (await page.getByRole('button', { name: 'الصفحة السابقة' }).boundingBox())!;
        const next = (await page.getByRole('button', { name: 'الصفحة التالية' }).boundingBox())!;
        expect(previous.x).toBeGreaterThan(next.x);
    });

    test('date picker: Arabic texts, the calendar opens', async ({ page }) => {
        await arabic(page, 'forms-datepicker--playground');
        await page.getByRole('button', { name: 'فتح التقويم' }).click();
        await expect(page.getByRole('button', { name: 'الشهر التالي' })).toBeVisible();
    });
});
