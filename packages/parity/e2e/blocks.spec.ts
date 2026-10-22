import { expect, test } from '@playwright/test';
import { openStory } from './story.js';

test.describe('SiteHeader', () => {
    test('desktop: the navigation is visible and the menu button hidden', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 600 });
        await openStory(page, 'blocks-siteheader--playground');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        await expect(nav).toBeVisible();
        await expect(nav.getByRole('link', { name: 'Software' })).toHaveAttribute('aria-current', 'page');
        await expect(page.getByRole('button', { name: 'Menu' })).toBeHidden();
    });

    test('mobile: the menu opens with the keyboard, its links are reachable, Escape-free closing via link', async ({
        page,
    }) => {
        await page.setViewportSize({ width: 375, height: 700 });
        await openStory(page, 'blocks-siteheader--playground');
        await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeHidden();
        const toggle = page.getByRole('button', { name: 'Menu' });
        await toggle.focus();
        await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'true');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        await expect(nav).toBeVisible();
        await page.keyboard.press('Tab');
        await expect(nav.getByRole('link', { name: 'Software' })).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    });
});

test.describe('ModeToggle', () => {
    test('switches the mode with the keyboard', async ({ page }) => {
        await openStory(page, 'blocks-modetoggle--playground', 'light');
        await page.evaluate(() => localStorage.removeItem('wirecore-mode'));
        await page.keyboard.press('Tab');
        const before = await page.evaluate(() => document.documentElement.dataset.mode);
        await page.keyboard.press('Enter');
        const after = await page.evaluate(() => document.documentElement.dataset.mode);
        expect(after).not.toBe(before);
        await expect(page.getByRole('button', { name: after === 'dark' ? /light mode/ : /dark mode/ })).toBeFocused();
    });
});
