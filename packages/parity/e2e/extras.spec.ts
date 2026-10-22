import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('NavigationMenu', () => {
    test('panels open from disclosure buttons; Escape closes; the current page is marked', async ({ page }) => {
        await openStory(page, 'navigation-navigationmenu--playground');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        const trigger = nav.getByRole('button', { name: 'Services' });
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await trigger.click();
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        await expect(nav.getByRole('link', { name: /Hosting/ })).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(nav.getByRole('link', { name: 'Contact' })).toHaveAttribute('aria-current', 'page');
    });
});

test.describe('ProgressCircle', () => {
    test('is a named progressbar with the value as text', async ({ page }) => {
        await openStory(page, 'feedback-progresscircle--playground');
        const bar = page.getByRole('progressbar', { name: 'Storage used' });
        await expect(bar).toHaveAttribute('aria-valuenow', '72');
        await expect(bar).toHaveAttribute('aria-valuetext', '72 %');
    });
});

test.describe('Tour', () => {
    test('walks through the steps and ends', async ({ page }) => {
        await openStory(page, 'overlays-tour--playground');
        await page.getByRole('button', { name: 'Start tour' }).click();
        const step = page.getByRole('alertdialog');
        await expect(step).toContainText('Welcome');
        await expect(step).toContainText('1 of 3');
        await step.getByRole('button', { name: 'Next' }).click();
        await expect(step).toContainText('Create server');
        await step.getByRole('button', { name: 'Next' }).click();
        await expect(step).toContainText('Reports');
        await step.getByRole('button', { name: 'Done' }).click();
        await expect(page.getByRole('alertdialog')).toHaveCount(0);
        await expect(page.getByText('Tour completed')).toBeVisible();
    });
});

test.describe('TableOfContents', () => {
    test('links to the headings and marks the section in view', async ({ page }) => {
        await openStory(page, 'navigation-tableofcontents--playground');
        const toc = page.getByRole('navigation', { name: 'On this page' });
        await expect(toc.getByRole('link', { name: 'Services' })).toHaveAttribute('aria-current', 'location');
        await toc.getByRole('link', { name: 'Data protection' }).click();
        await expect(toc.getByRole('link', { name: 'Data protection' })).toHaveAttribute('aria-current', 'location');
        await expect(toc.getByRole('link', { name: 'Services' })).not.toHaveAttribute('aria-current');
    });
});

test.describe('NativeSelect, Spoiler, Highlight', () => {
    test('native select is labelled by the Field', async ({ page }) => {
        await openStory(page, 'forms-nativeselect--playground');
        const select = page.getByRole('combobox', { name: 'Location' });
        await expect(select).toHaveValue('nue');
        await select.selectOption('fra');
        await expect(page.getByText('Value: fra')).toBeVisible();
    });

    test('spoiler shows the rest with a disclosure button', async ({ page }) => {
        await openStory(page, 'layout-spoiler--playground');
        const toggle = page.getByRole('button', { name: 'Show more' });
        await expect(toggle).toHaveAttribute('aria-expanded', 'false');
        await toggle.click();
        await expect(page.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
    });

    test('highlight marks the hits', async ({ page }) => {
        await openStory(page, 'data-highlight--playground');
        await expect(page.locator('mark')).toHaveCount(3);
        await page.getByRole('textbox', { name: 'Search' }).fill('nuremberg');
        await expect(page.locator('mark')).toHaveText(['Nuremberg']);
    });
});

test.describe('NavigationProgress and Sparkline', () => {
    test('the bar is a named progressbar only while loading', async ({ page }) => {
        await openStory(page, 'feedback-navigationprogress--playground');
        await expect(page.getByRole('progressbar')).toHaveCount(0);
        await page.getByRole('button', { name: 'Start loading' }).click();
        await expect(page.getByRole('progressbar', { name: 'Loading page' })).toBeAttached();
        await page.getByRole('button', { name: 'Done' }).click();
        await expect(page.getByRole('progressbar')).toHaveCount(0);
    });

    test('the sparkline is an image described by trend and extremes', async ({ page }) => {
        await openStory(page, 'data-sparkline--playground');
        await expect(
            page.getByRole('img', {
                name: 'Utilization over the last 12 hours in percent: from 42 to 81, low 38, high 81',
            })
        ).toBeVisible();
    });
});
