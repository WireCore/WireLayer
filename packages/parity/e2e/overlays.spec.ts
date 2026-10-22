import { expect, test } from '@playwright/test';
import { openStory } from './story.js';

test.describe('Menu', () => {
    test('opens with Enter, moves with the arrow keys, selects and returns focus to the trigger', async ({ page }) => {
        await openStory(page, 'overlays-menu--playground');
        const trigger = page.getByRole('button', { name: 'Actions' });
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menu')).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Edit' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menuitem', { name: 'Duplicate' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menu')).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(page.getByText('Selected: duplicate')).toBeVisible();
    });

    test('closes with Escape', async ({ page }) => {
        await openStory(page, 'overlays-menu--playground');
        await page.getByRole('button', { name: 'Actions' }).focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menu')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toBeHidden();
        await expect(page.getByRole('button', { name: 'Actions' })).toBeFocused();
    });
});

test.describe('Dialog', () => {
    test('traps focus while open and returns it to the trigger on Escape', async ({ page }) => {
        await openStory(page, 'overlays-dialog--playground');
        const trigger = page.getByRole('button', { name: 'Delete server' });
        await trigger.focus();
        await page.keyboard.press('Enter');
        const dialog = page.getByRole('alertdialog', { name: 'Delete server?' });
        await expect(dialog).toBeVisible();
        // Focus moves into the dialog and Tab cycles inside it (close, Cancel, Delete, close …)
        for (let i = 0; i < 5; i++) {
            expect(await dialog.evaluate((node) => node.contains(document.activeElement))).toBe(true);
            await page.keyboard.press('Tab');
        }
        await page.keyboard.press('Escape');
        await expect(dialog).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('closes from a footer button', async ({ page }) => {
        await openStory(page, 'overlays-dialog--playground');
        await page.getByRole('button', { name: 'Delete server' }).click();
        await page.getByRole('button', { name: 'Cancel' }).click();
        await expect(page.getByRole('alertdialog')).toBeHidden();
    });
});

test.describe('Dialog variants', () => {
    test('non-modal: the page stays usable, focus is not trapped, no backdrop', async ({ page }) => {
        await openStory(page, 'overlays-dialog--non-modal');
        await page.getByRole('button', { name: 'Open notes' }).click();
        const dialog = page.getByRole('dialog', { name: 'Notes' });
        await expect(dialog).toBeVisible();
        await expect(dialog).not.toHaveAttribute('aria-modal', 'true');
        await expect(page.locator('[data-scope=dialog][data-part=backdrop]')).toHaveCount(0);
        await page.getByRole('button', { name: /Click on the page/ }).click();
        await expect(page.getByRole('button', { name: 'Click on the page (1)' })).toBeFocused();
        await expect(dialog).toBeVisible();
    });

    test('moves with Alt + arrow keys and by dragging the header; maximize fills the screen', async ({ page }) => {
        await openStory(page, 'overlays-dialog--non-modal');
        await page.getByRole('button', { name: 'Open notes' }).click();
        const dialog = page.getByRole('dialog', { name: 'Notes' });
        await expect(dialog).toBeVisible();
        // Measured after the opening animation (it scales the dialog)
        await dialog.evaluate((node) => Promise.all(node.getAnimations().map((animation) => animation.finished)));
        const before = (await dialog.boundingBox())!;
        await dialog.getByRole('button', { name: 'Maximize' }).focus();
        await page.keyboard.press('Alt+ArrowLeft');
        await page.keyboard.press('Alt+ArrowLeft');
        await page.keyboard.press('Alt+Shift+ArrowUp');
        await expect.poll(async () => (await dialog.boundingBox())!.x).toBeCloseTo(before.x - 20, 0);
        expect((await dialog.boundingBox())!.y).toBeCloseTo(before.y - 50, 0);

        const moved = (await dialog.boundingBox())!;
        await page.mouse.move(moved.x + 20, moved.y + 12);
        await page.mouse.down();
        await page.mouse.move(moved.x - 80, moved.y + 62, { steps: 5 });
        await page.mouse.up();
        await expect.poll(async () => (await dialog.boundingBox())!.x).toBeCloseTo(moved.x - 100, 0);

        await dialog.getByRole('button', { name: 'Maximize' }).click();
        const viewport = page.viewportSize()!;
        await expect.poll(async () => (await dialog.boundingBox())!.width).toBe(viewport.width);
        await dialog.getByRole('button', { name: 'Restore' }).click();
        await expect.poll(async () => (await dialog.boundingBox())!.width).toBeLessThan(viewport.width);
    });

    test('stacked dialogs: each closes on its own, the focus goes back step by step', async ({ page }) => {
        await openStory(page, 'overlays-dialog--stacked');
        const trigger = page.getByRole('button', { name: 'Settings' });
        await trigger.click();
        const first = page.getByRole('dialog', { name: 'Settings' });
        await expect(first).toBeVisible();
        const inner = first.getByRole('button', { name: 'Reset …' });
        await inner.click();
        const second = page.getByRole('alertdialog', { name: 'Really reset?' });
        await expect(second).toBeVisible();
        await expect(page.locator('[data-scope=dialog][data-part=backdrop]')).toHaveCount(2);
        expect(await second.evaluate((node) => node.contains(document.activeElement))).toBe(true);
        await page.keyboard.press('Escape');
        await expect(second).toBeHidden();
        await expect(first).toBeVisible();
        await expect(inner).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(first).toBeHidden();
        await expect(trigger).toBeFocused();
    });

    test('prompt: the field gets the focus, Enter confirms', async ({ page }) => {
        await openStory(page, 'overlays-confirm--prompt-and-type-to-confirm');
        await page.getByRole('button', { name: 'Rename …' }).click();
        const field = page.getByRole('textbox', { name: 'New name' });
        await expect(field).toBeFocused();
        await field.fill('web-07');
        await page.keyboard.press('Enter');
        await expect(page.getByText('New name: web-07')).toBeVisible();
    });
});

test.describe('Tooltip', () => {
    test('appears on keyboard focus and hides with Escape', async ({ page }) => {
        await openStory(page, 'overlays-tooltip--playground');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Copy' })).toBeFocused();
        await expect(page.getByRole('tooltip')).toHaveText('Copy configuration');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('tooltip')).toBeHidden();
    });
});

test.describe('Tooltip on touch', () => {
    test('a long press shows the tooltip without pressing the button, a tap elsewhere hides it', async ({ page }) => {
        await openStory(page, 'overlays-tooltip--playground');
        const trigger = page.getByRole('button', { name: 'Copy' });
        const box = (await trigger.boundingBox())!;
        const point = { pointerType: 'touch', isPrimary: true, clientX: box.x + 4, clientY: box.y + 4, button: 0 };
        await trigger.dispatchEvent('pointerdown', point);
        await page.waitForTimeout(650);
        await trigger.dispatchEvent('pointerup', point);
        await expect(page.getByRole('tooltip')).toHaveText('Copy configuration');
        await page.locator('body').dispatchEvent('pointerdown', { ...point, clientX: 2, clientY: 2 });
        await expect(page.getByRole('tooltip')).toBeHidden();
    });
});

test.describe('Toast', () => {
    test('announces toasts in the notification region and closes them by keyboard', async ({ page }) => {
        await openStory(page, 'overlays-toast--playground');
        await page.getByRole('button', { name: 'Success with action' }).click();
        const region = page.getByRole('region', { name: /Notifications/ });
        const status = region.getByRole('status');
        await expect(status).toContainText('Deployment complete');
        await region.getByRole('button', { name: 'Close' }).focus();
        await page.keyboard.press('Enter');
        await expect(status).toBeHidden();
    });
});

test.describe('Motion', () => {
    const animationOf = (locator: import('@playwright/test').Locator) =>
        locator.evaluate((node) => getComputedStyle(node).animationName);

    test.describe('with motion allowed', () => {
        test.use({ reducedMotion: 'no-preference' });

        test('the dialog and its backdrop animate in and out', async ({ page }) => {
            await openStory(page, 'overlays-dialog--playground');
            await page.getByRole('button', { name: 'Delete server' }).click();
            const dialog = page.getByRole('alertdialog');
            await expect(dialog).toBeVisible();
            expect(await animationOf(dialog)).toBe('wc-dialog-in');
            expect(await animationOf(page.locator('[data-scope=dialog][data-part=backdrop]'))).toBe('wc-fade-in');
            await page.keyboard.press('Escape');
            // The exit animation runs before the dialog is removed
            expect(await animationOf(dialog)).toBe('wc-dialog-out');
            await expect(dialog).toBeHidden();
        });

        test('the menu pops in from the side it opens on', async ({ page }) => {
            await openStory(page, 'overlays-menu--playground');
            await page.getByRole('button', { name: 'Actions' }).click();
            const menu = page.getByRole('menu');
            await expect(menu).toBeVisible();
            expect(await animationOf(menu)).toBe('wc-pop-in');
            expect(await menu.evaluate((node) => getComputedStyle(node).getPropertyValue('--wc-pop-y').trim())).toBe(
                '-4px'
            );
        });
    });

    test.describe('with reduced motion', () => {
        test.use({ reducedMotion: 'reduce' });

        test('nothing animates', async ({ page }) => {
            await openStory(page, 'overlays-dialog--playground');
            await page.getByRole('button', { name: 'Delete server' }).click();
            expect(await animationOf(page.getByRole('alertdialog'))).toBe('none');
        });
    });
});
