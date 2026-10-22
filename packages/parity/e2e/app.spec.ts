import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('AppShell', () => {
    test('skip link jumps to main; on small screens the navigation is a drawer', async ({ page }) => {
        await openStory(page, 'layout-appshell--playground');
        await page.keyboard.press('Tab');
        const skip = page.getByRole('link', { name: 'Skip to content' });
        await expect(skip).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('main')).toBeFocused();
        await expect(page.getByRole('banner')).toBeVisible();
        await page.setViewportSize({ width: 600, height: 800 });
        const burger = page.getByRole('button', { name: 'Open navigation' });
        await burger.click();
        const drawer = page.getByRole('dialog', { name: 'Navigation' });
        await expect(drawer.getByRole('navigation', { name: 'Main navigation' })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(drawer).toBeHidden();
        await expect(burger).toBeFocused();
    });
});

test.describe('CommandPalette', () => {
    test('Ctrl+K opens; typing filters (also by keywords); Enter runs', async ({ page }) => {
        await openStory(page, 'navigation-commandpalette--playground');
        await page.keyboard.press('Control+k');
        const dialog = page.getByRole('dialog', { name: 'Commands' });
        const search = dialog.getByRole('combobox', { name: 'Commands' });
        await expect(search).toBeFocused();
        await search.fill('hosting');
        await expect(dialog.getByRole('option')).toHaveText(['Server']);
        await page.keyboard.press('Enter');
        await expect(dialog).toBeHidden();
        await expect(page.getByText('Ran: servers')).toBeVisible();
        await page.keyboard.press('Control+k');
        // The focus moves into the dialog once it is open – keys before that go to the page
        await expect(search).toBeFocused();
        await page.keyboard.type('xyz');
        await expect(page.getByText('Nothing found')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('dialog')).toHaveCount(0);
    });
});

test.describe('TagsInput', () => {
    test('Enter adds, Backspace selects and removes, the delete buttons are named', async ({ page }) => {
        await openStory(page, 'forms-tagsinput--playground');
        const input = page.getByRole('textbox', { name: 'Keywords' });
        await input.fill('linux');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: hosting, frankfurt, linux')).toBeVisible();
        await page.keyboard.press('Backspace');
        await page.keyboard.press('Backspace');
        await expect(page.getByText('Value: hosting, frankfurt')).toBeVisible();
        await page.getByRole('button', { name: 'Remove hosting' }).click();
        await expect(page.getByText('Value: frankfurt')).toBeVisible();
    });
});

test.describe('CopyButton', () => {
    test('copies and announces it', async ({ page, context }) => {
        await context.grantPermissions(['clipboard-write']);
        await openStory(page, 'buttons-copybutton--playground');
        await page.getByRole('button', { name: 'Copy IP address' }).click();
        await expect(page.getByRole('status')).toHaveText('Copied to clipboard');
    });
});

test.describe('HoverCard', () => {
    test('opens on keyboard focus too and closes with Escape', async ({ page }) => {
        await openStory(page, 'overlays-hovercard--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByText('Engineering · Frankfurt')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByText('Engineering · Frankfurt')).toBeHidden();
    });
});

test.describe('Date extensions', () => {
    test('MonthPicker: month and year in one go', async ({ page }) => {
        await openStory(page, 'forms-monthpicker--playground');
        const group = page.getByRole('group', { name: 'Billing month' });
        await expect(group.getByRole('spinbutton')).toHaveText(['10', '2026']);
        await group.getByRole('spinbutton', { name: 'Month' }).click();
        await page.keyboard.type('032027');
        await expect(page.getByText('Value: 2027-03')).toBeVisible();
    });

    test('DateRangePicker presets set the range', async ({ page }) => {
        await openStory(page, 'forms-daterangepicker--presets');
        await page.getByRole('button', { name: 'Open calendar' }).click();
        await page.getByRole('button', { name: 'Last 7 days' }).click();
        await expect(page.getByText(/From: \d{4}-\d{2}-\d{2} · To: \d{4}-\d{2}-\d{2}/)).toBeVisible();
        await expect(page.getByText('From: 2026-10-20 · To: 2026-10-24')).toHaveCount(0);
    });

    test('Calendar on the page: several days', async ({ page }) => {
        await openStory(page, 'forms-calendar--playground');
        await page.getByRole('button', { name: /^Friday, October 23, 2026/ }).click();
        await expect(page.getByText('Selected: 2026-10-20, 2026-10-22, 2026-10-23')).toBeVisible();
    });
});

test.describe('AppShell rail and resizing', () => {
    test('the rail shows icons with tooltips; the toggle unfolds it', async ({ page }) => {
        await openStory(page, 'layout-appshell--rail');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        const navbar = nav.locator('xpath=..');
        expect((await navbar.boundingBox())!.width).toBe(64);
        const server = nav.getByRole('link', { name: 'Server' });
        await server.hover();
        await expect(page.getByRole('tooltip')).toHaveText('Server');
        await page.getByRole('button', { name: 'Expand navigation' }).click();
        expect((await navbar.boundingBox())!.width).toBe(256);
        await expect(page.getByRole('button', { name: 'Collapse navigation' })).toBeVisible();
        await expect(nav.getByText('Server')).toBeVisible();
    });

    test('keyboard, drag and double click resize the navbar; the width is remembered', async ({ page }) => {
        await openStory(page, 'layout-appshell--resizable');
        await page.evaluate(() => localStorage.removeItem('wirecore-story-app-shell'));
        await page.reload();
        await page.locator('#storybook-root > *').first().waitFor();
        const handle = page.getByRole('separator', { name: 'Resize navigation' });
        const navbar = page.getByRole('navigation', { name: 'Main navigation' }).locator('xpath=..');
        await handle.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Shift+ArrowRight');
        await expect(handle).toHaveAttribute('aria-valuenow', '336');
        expect((await navbar.boundingBox())!.width).toBe(336);
        const box = (await handle.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + 200);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 - 50, box.y + 200, { steps: 5 });
        await page.mouse.up();
        await expect(handle).toHaveAttribute('aria-valuenow', '286');
        await page.reload();
        await expect(page.getByRole('separator', { name: 'Resize navigation' })).toHaveAttribute(
            'aria-valuenow',
            '286'
        );
        await page.getByRole('separator', { name: 'Resize navigation' }).dblclick();
        await expect(page.getByRole('separator', { name: 'Resize navigation' })).toHaveAttribute(
            'aria-valuenow',
            '256'
        );
    });
});

test.describe('Scroller', () => {
    test('the arrows scroll and appear while there is more', async ({ page }) => {
        await openStory(page, 'layout-scroller--playground');
        const region = page.getByRole('region', { name: 'Topics' });
        const end = page.locator('[data-side=end]');
        await expect(page.locator('[data-side=start]')).toHaveCount(0);
        await end.click();
        await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
        await expect(page.locator('[data-side=start]')).toBeVisible();
        // The focused row scrolls with the arrow keys
        await region.evaluate((element) => element.scrollTo({ left: 0 }));
        await region.focus();
        await page.keyboard.press('ArrowRight');
        await expect.poll(() => region.evaluate((element) => element.scrollLeft)).toBeGreaterThan(0);
    });
});

test.describe('Splitter', () => {
    test('Enter folds a collapsible panel, Shift uses the bigger step, double click resets', async ({ page }) => {
        await openStory(page, 'layout-splitter--pixels-and-collapsible');
        await page.evaluate(() => localStorage.removeItem('wirecore-story-splitter'));
        await page.reload();
        await page.locator('#storybook-root > *').first().waitFor();
        const handle = page.getByRole('separator', { name: 'Resize “Navigation”' });
        const start = Number(await handle.getAttribute('aria-valuenow'));
        // 220px of a 640px wide splitter
        expect(Math.round(start)).toBe(34);
        await handle.focus();
        await page.keyboard.press('Shift+ArrowRight');
        await expect.poll(async () => Math.round(Number(await handle.getAttribute('aria-valuenow')))).toBe(54);
        await page.keyboard.press('Enter');
        await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBe(0);
        await page.keyboard.press('Enter');
        await expect.poll(async () => Number(await handle.getAttribute('aria-valuenow'))).toBeGreaterThan(0);
        await handle.dblclick();
        await expect.poll(async () => Math.round(Number(await handle.getAttribute('aria-valuenow')))).toBe(34);
    });
});
