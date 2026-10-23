import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

test.describe('Splitter', () => {
    test('the handle is a named separator; arrow keys resize the panels', async ({ page }) => {
        await openStory(page, 'layout-splitter--playground');
        const handle = page.getByRole('separator', { name: 'Resize “Navigation”' });
        await expect(handle).toHaveAttribute('aria-valuenow', '30');
        const panel = page.getByText('Navigation', { exact: true });
        const before = (await panel.boundingBox())!.width;
        await handle.focus();
        for (let step = 0; step < 5; step++) await page.keyboard.press('ArrowRight');
        await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(30);
        expect((await panel.boundingBox())!.width).toBeGreaterThan(before);
    });
});

test.describe('ScrollPanel', () => {
    test('the region is focusable and scrolls with the keyboard', async ({ page }) => {
        await openStory(page, 'layout-scrollpanel--playground');
        const region = page.getByRole('region', { name: 'Terms of use' });
        await page.keyboard.press('Tab');
        await expect(region).toBeFocused();
        await page.keyboard.press('PageDown');
        await expect.poll(() => region.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
    });
});

test.describe('Image', () => {
    test('opens large; zoom and rotate; Escape returns focus', async ({ page }) => {
        await openStory(page, 'media-image--playground');
        const trigger = page.getByRole('button', { name: 'View larger: Server racks in the data center' });
        await trigger.click();
        const dialog = page.getByRole('dialog', { name: 'Server racks in the data center' });
        const image = dialog.getByRole('img', { name: 'Server racks in the data center' });
        await dialog.getByRole('button', { name: 'Zoom in' }).click();
        await dialog.getByRole('button', { name: 'Rotate' }).click();
        await expect(image).toHaveAttribute('style', /scale\(1\.5\) rotate\(90deg\)/);
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
    });
});

test.describe('Inplace', () => {
    test('the value becomes an editor; Enter saves and focus returns, Escape closes', async ({ page }) => {
        await openStory(page, 'forms-inplace--playground');
        await page.getByRole('button', { name: 'web-01 (edit)' }).click();
        const input = page.getByRole('textbox', { name: 'Server name' });
        await expect(input).toBeFocused();
        await input.fill('web-01-new');
        await page.keyboard.press('Enter');
        const display = page.getByRole('button', { name: 'web-01-new (edit)' });
        await expect(display).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(input).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(display).toBeFocused();
    });
});

test.describe('ScrollTop', () => {
    test('appears after scrolling and brings the page back up', async ({ page }) => {
        await openStory(page, 'navigation-scrolltop--playground');
        const button = page.getByRole('button', { name: 'Back to top', includeHidden: true });
        await expect(button).toHaveAttribute('aria-hidden', 'true');
        await page.evaluate(() => window.scrollTo(0, 1200));
        await expect(button).not.toHaveAttribute('aria-hidden');
        await button.click();
        await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
        await expect(button).toHaveAttribute('aria-hidden', 'true');
        // The next Tab starts at the top again, not at the (now hidden) button
        await page.keyboard.press('Tab');
        await expect(button).not.toBeFocused();
    });
});

test.describe('BlockUi', () => {
    test('the blocked content cannot be reached', async ({ page }) => {
        await openStory(page, 'layout-blockui--playground');
        await expect(page.getByText('Saving', { exact: true })).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Save' })).not.toBeFocused();
        await expect(page.getByRole('textbox', { name: 'Company' })).not.toBeFocused();
    });
});

test.describe('SpeedDial', () => {
    test('a menu button whose actions open above it', async ({ page }) => {
        await openStory(page, 'buttons-speeddial--playground');
        const trigger = page.getByRole('button', { name: 'Create new' });
        await expect(trigger).toHaveAttribute('aria-haspopup', 'menu');
        await trigger.focus();
        await page.keyboard.press('Enter');
        // Opened with Enter, Ark highlights the first action a frame later – only then does the arrow key move on
        await expect(page.getByRole('menuitem', { name: 'Create server' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menuitem', { name: 'Invite person' })).toHaveAttribute('data-highlighted', '');
        await nextFrame(page);
        await page.keyboard.press('Enter');
        await expect(page.getByText('Selected: user')).toBeVisible();
        await expect(trigger).toBeFocused();
    });
});
