import { expect, test, type Page } from '@playwright/test';
import { openStory } from './story.js';

test.describe('Select', () => {
    test('opens, moves and selects with the keyboard and returns focus to the trigger', async ({ page }) => {
        await openStory(page, 'forms-select--playground');
        const trigger = page.getByRole('combobox', { name: 'Service' });
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveText('Hosting');

        await page.keyboard.press('Enter');
        const listbox = page.getByRole('listbox');
        await expect(listbox).toBeVisible();
        await expect(page.getByRole('option', { name: 'Hosting' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('option', { name: 'Cloud & DevOps' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Enter');

        await expect(listbox).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveText('Cloud & DevOps');
    });

    test('closes with Escape without changing the value and skips disabled options', async ({ page }) => {
        await openStory(page, 'forms-select--playground');
        const trigger = page.getByRole('combobox', { name: 'Service' });
        await trigger.focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('listbox')).toBeVisible();
        await page.keyboard.press('End');
        // "Network" is disabled – the last enabled option is highlighted
        await expect(page.getByRole('option', { name: 'Hardware' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Escape');
        await expect(page.getByRole('listbox')).toBeHidden();
        await expect(trigger).toBeFocused();
        await expect(trigger).toHaveText('Hosting');
    });
});

test.describe('Tabs', () => {
    test('arrow keys move between tabs and show their panel, Tab moves into the panel', async ({ page }) => {
        await openStory(page, 'navigation-tabs--playground');
        await page.keyboard.press('Tab');
        const overview = page.getByRole('tab', { name: 'Overview' });
        await expect(overview).toBeFocused();
        await expect(overview).toHaveCSS('outline-style', 'solid');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('tab', { name: 'Services' })).toBeFocused();
        await expect(page.getByRole('tab', { name: 'Services' })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tabpanel', { name: 'Services' })).toBeVisible();
        await page.keyboard.press('End');
        await expect(page.getByRole('tab', { name: 'Process' })).toHaveAttribute('aria-selected', 'true');
        // Only the active panel is visible (and therefore the next tab stop)
        await expect(page.getByRole('tabpanel', { name: 'Services' })).toBeHidden();
        await page.keyboard.press('Tab');
        await expect(page.getByRole('tabpanel', { name: 'Process' })).toBeFocused();
    });
});

test.describe('Tabs (manual, vertical, closable)', () => {
    test('manual activation: arrow keys move the focus, Enter selects; vertical uses up/down', async ({ page }) => {
        await openStory(page, 'navigation-tabs--vertical-manual');
        const overview = page.getByRole('tab', { name: 'Overview' });
        await overview.focus();
        await page.keyboard.press('ArrowDown');
        const services = page.getByRole('tab', { name: 'Services' });
        await expect(services).toBeFocused();
        await expect(overview).toHaveAttribute('aria-selected', 'true');
        await page.keyboard.press('Enter');
        await expect(services).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('tabpanel', { name: 'Services' })).toHaveText('Software, AI, hosting, cloud.');
        await expect(page.getByRole('tabpanel', { name: 'Overview' })).toBeHidden();
    });

    test('Delete closes the focused tab and the focus moves to the next one', async ({ page }) => {
        await openStory(page, 'navigation-tabs--closable-and-scrollable');
        const first = page.getByRole('tab', { name: 'quote.pdf' });
        await first.focus();
        await page.keyboard.press('Delete');
        await expect(first).toHaveCount(0);
        const next = page.getByRole('tab', { name: 'contract.docx' });
        await expect(next).toBeFocused();
        await expect(next).toHaveAttribute('aria-selected', 'true');
        // Arrow keys still move along the (scrolling) list
        await page.keyboard.press('End');
        await expect(page.getByRole('tab', { name: 'budget.xlsx' })).toBeFocused();
        await expect(page.getByRole('tab', { name: 'budget.xlsx' })).toBeInViewport();
    });
});

test.describe('Pagination', () => {
    test('buttons are reachable with Tab and change the page with Enter', async ({ page }) => {
        await openStory(page, 'data-pagination--playground');
        // The disabled "previous" button is skipped
        await page.keyboard.press('Tab');
        await expect(page.getByRole('button', { name: 'Page 1 of 3' })).toBeFocused();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Enter');
        await expect(page.getByRole('button', { name: 'Page 2 of 3' })).toHaveAttribute('aria-current', 'page');
        await expect(page.getByText('5–8 of 12')).toBeVisible();
        await page.getByRole('button', { name: 'Next page' }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByText('9–12 of 12')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });
});

test.describe('MegaMenu', () => {
    const nav = (page: Page) => page.getByRole('navigation', { name: 'Main navigation' }).first();

    test('Tab and Enter open a panel, Tab moves through it, Escape closes and returns the focus', async ({ page }) => {
        await openStory(page, 'navigation-megamenu--playground');
        const trigger = nav(page).getByRole('button', { name: 'Services' });
        await page.keyboard.press('Tab');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(trigger).toHaveAttribute('aria-expanded', 'true');
        const software = page.getByRole('link', { name: 'Software & Web' });
        await expect(software).toBeVisible();
        await expect(software).toHaveAccessibleDescription('Portals and business applications');
        // The current page – only the exact match
        await expect(page.getByRole('link', { name: 'Hosting' })).toHaveAttribute('aria-current', 'page');
        await expect(page.locator('[aria-current=page]')).toHaveCount(1);
        await page.keyboard.press('Tab');
        await expect(software).toBeFocused();
        await page.keyboard.press('Escape');
        await expect(trigger).toHaveAttribute('aria-expanded', 'false');
        await expect(trigger).toBeFocused();
        await expect(software).toBeHidden();
    });

    test('arrow keys move between the entries; leaving with Tab closes the panel', async ({ page }) => {
        await openStory(page, 'navigation-megamenu--playground');
        const trigger = nav(page).getByRole('button', { name: 'Services' });
        await trigger.focus();
        await page.keyboard.press('ArrowRight');
        await expect(nav(page).getByRole('link', { name: 'Products' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        const chevron = nav(page).getByRole('button', { name: 'Products submenu' });
        await expect(chevron).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(chevron).toHaveAttribute('aria-expanded', 'true');
        // Through the two links of the panel to the next entry: still open (focus is in the navigation)
        for (let index = 0; index < 3; index++) await page.keyboard.press('Tab');
        await expect(nav(page).getByRole('button', { name: 'Company' })).toBeFocused();
        await expect(chevron).toHaveAttribute('aria-expanded', 'true');
        // Out of the navigation
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
        await expect(chevron).toHaveAttribute('aria-expanded', 'false');
    });

    test('without arrow keys only Tab moves', async ({ page }) => {
        await openStory(page, 'navigation-megamenu--without-arrow-keys');
        const trigger = nav(page).getByRole('button', { name: 'Services' });
        await trigger.focus();
        await page.keyboard.press('ArrowRight');
        await expect(trigger).toBeFocused();
        await page.keyboard.press('Tab');
        await expect(nav(page).getByRole('link', { name: 'Products' })).toBeFocused();
    });

    // The panel is as wide as the navigation – with a narrow one the teaser used to cover the first column
    test('the teaser does not overlap the columns', async ({ page }) => {
        await page.setViewportSize({ width: 1200, height: 700 });
        await openStory(page, 'navigation-megamenu--playground');
        await nav(page).getByRole('button', { name: 'Services' }).click();
        const panel = page.locator('nav [data-part="content"][data-state="open"]');
        const boxes = await panel.evaluate((root) => {
            const rect = (element: Element) => {
                const { left, right, top, bottom } = element.getBoundingClientRect();
                return { left, right, top, bottom };
            };
            const items = [...root.querySelectorAll('li a, li button')].map(rect);
            const label = [...root.querySelectorAll('p')].find(
                (p) => p.textContent?.trim().toLowerCase() === 'case study'
            );
            const teaser = label?.parentElement;
            return { items, teaser: teaser ? rect(teaser) : null, panel: rect(root) };
        });
        expect(boxes.items.length).toBeGreaterThan(3);
        const teaser = boxes.teaser;
        expect(teaser).not.toBeNull();
        for (const item of boxes.items) {
            const apart =
                item.right <= teaser!.left + 1 ||
                item.left >= teaser!.right - 1 ||
                item.bottom <= teaser!.top + 1 ||
                item.top >= teaser!.bottom - 1;
            expect(apart, `item at x=${item.left}–${item.right} overlaps the teaser`).toBe(true);
        }
        // Everything stays inside the panel
        for (const item of boxes.items) expect(item.right).toBeLessThanOrEqual(boxes.panel.right + 1);
    });

    test('a click outside closes; one panel at a time', async ({ page }) => {
        await openStory(page, 'navigation-megamenu--playground');
        const services = nav(page).getByRole('button', { name: 'Services' });
        const company = nav(page).getByRole('button', { name: 'Company' });
        await services.click();
        await company.click();
        await expect(services).toHaveAttribute('aria-expanded', 'false');
        await expect(company).toHaveAttribute('aria-expanded', 'true');
        await page.mouse.click(5, 500);
        await expect(company).toHaveAttribute('aria-expanded', 'false');
    });

    test('hover intent: opens after a delay, switches at once, keeps the panel on the way to it', async ({ page }) => {
        await openStory(page, 'navigation-megamenu--hover');
        const services = nav(page).getByRole('button', { name: 'Services' });
        const products = nav(page).getByRole('link', { name: 'Products' });
        const company = nav(page).getByRole('button', { name: 'Company' });
        const box = (await services.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await expect(services).toHaveAttribute('aria-expanded', 'false');
        await expect(services).toHaveAttribute('aria-expanded', 'true');
        // Sideways to another entry: at once
        const companyBox = (await company.boundingBox())!;
        await page.mouse.move(companyBox.x + companyBox.width / 2, companyBox.y + companyBox.height / 2, { steps: 4 });
        await expect(company).toHaveAttribute('aria-expanded', 'true');
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
        await expect(services).toHaveAttribute('aria-expanded', 'true');
        // Diagonally down over "Products" into the panel: the panel stays
        const productsBox = (await products.boundingBox())!;
        await page.mouse.move(productsBox.x + productsBox.width / 2, productsBox.y + productsBox.height - 2, {
            steps: 6,
        });
        await page.mouse.move(productsBox.x + productsBox.width / 2, productsBox.y + productsBox.height + 60, {
            steps: 6,
        });
        await page.waitForTimeout(400);
        await expect(services).toHaveAttribute('aria-expanded', 'true');
        // Leaving closes after the delay
        await page.mouse.move(5, 700, { steps: 4 });
        await expect(services).toHaveAttribute('aria-expanded', 'false');
    });

    test('small screens: menu button, drawer with accordions, targets of 44px', async ({ page }) => {
        await page.setViewportSize({ width: 600, height: 900 });
        await openStory(page, 'navigation-megamenu--playground');
        await expect(nav(page).getByRole('button', { name: 'Services' })).toBeHidden();
        const burger = page.getByRole('button', { name: 'Menu' });
        await burger.click();
        const drawer = page.getByRole('dialog', { name: 'Menu' });
        const mobile = drawer.getByRole('navigation', { name: 'Main navigation' });
        // The section of the current page is open
        const hosting = mobile.getByRole('link', { name: 'Hosting' });
        await expect(hosting).toBeVisible();
        expect((await hosting.boundingBox())!.height).toBeGreaterThanOrEqual(44);
        expect((await mobile.getByRole('link', { name: 'Contact' }).boundingBox())!.height).toBeGreaterThanOrEqual(44);
        await mobile.getByRole('button', { name: 'Company' }).click();
        await mobile.getByRole('link', { name: 'Team' }).click();
        await expect(drawer).toBeHidden();
    });
});
