import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

test.describe('Menu with groups and submenus', () => {
    test('arrow right opens the submenu, its items can be chosen', async ({ page }) => {
        await openStory(page, 'overlays-menu--groups-and-submenus');
        await page.getByRole('button', { name: 'Actions' }).click();
        const menu = page.getByRole('menu').first();
        await expect(menu.getByRole('group', { name: 'Server' })).toBeVisible();
        await expect(menu.getByRole('separator')).toHaveCount(1);
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menuitem', { name: 'Move to' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('ArrowRight');
        await expect(page.locator('[role=menu]:focus')).toContainText('Nuremberg');
        await page.getByRole('menuitem', { name: 'Nuremberg' }).click();
        await expect(page.getByText('Selected: move-nue')).toBeVisible();
        await expect(page.getByRole('menu')).toHaveCount(0);
    });
});

test.describe('Menu item kinds', () => {
    test('checkbox and radio items switch with the keyboard and keep the menu open', async ({ page }) => {
        await openStory(page, 'overlays-menu--checkbox-and-radio');
        await page.getByRole('button', { name: 'View' }).focus();
        await page.keyboard.press('Enter');
        const grid = page.getByRole('menuitemcheckbox', { name: 'Show grid' });
        await expect(grid).toHaveAttribute('data-highlighted', '');
        await expect(grid).toHaveAttribute('aria-checked', 'true');
        await page.keyboard.press('Enter');
        await expect(grid).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByText('grid: off')).toBeVisible();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        const load = page.getByRole('menuitemradio', { name: 'Load' });
        await expect(load).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Enter');
        await expect(load).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByRole('menuitemradio', { name: 'Name' })).toHaveAttribute('aria-checked', 'false');
        await expect(page.getByText('Sort order: load')).toBeVisible();
    });

    test('type-ahead: a letter highlights the next item starting with it', async ({ page }) => {
        await openStory(page, 'overlays-menu--playground');
        await page.getByRole('button', { name: 'Actions' }).focus();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('menu')).toBeVisible();
        await nextFrame(page);
        await page.keyboard.press('r');
        await expect(page.getByRole('menuitem', { name: 'Restart' })).toHaveAttribute('data-highlighted', '');
    });

    test('the filter field keeps the focus while arrow keys move through the matches', async ({ page }) => {
        await openStory(page, 'overlays-menu--searchable');
        await page.getByRole('button', { name: 'Choose location' }).click();
        const field = page.getByRole('textbox', { name: 'Search the menu' });
        await expect(field).toBeFocused();
        await field.pressSequentially('muni');
        await expect(page.getByRole('menuitem')).toHaveCount(1);
        await expect(page.getByRole('menuitem', { name: 'Munich' })).toHaveAttribute('data-highlighted', '');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Selected: munich')).toBeVisible();
    });

    test('opened from code at an element; Escape returns the focus there', async ({ page }) => {
        await openStory(page, 'overlays-menu--open-at-anchor');
        const button = page.getByRole('button', { name: 'Actions for web-01' });
        await button.click();
        const menu = page.getByRole('menu');
        await expect(menu).toBeVisible();
        const buttonBox = (await button.boundingBox())!;
        const menuBox = (await menu.boundingBox())!;
        expect(menuBox.y).toBeGreaterThan(buttonBox.y + buttonBox.height - 1);
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
        await expect(button).toBeFocused();
    });
});

test.describe('ContextMenu', () => {
    test('opens with a right click and with Shift+F10', async ({ page }) => {
        await openStory(page, 'overlays-contextmenu--playground');
        const area = page.getByText('Right-click or Shift+F10');
        await area.click({ button: 'right' });
        await page.getByRole('menuitem', { name: 'Copy' }).click();
        await expect(page.getByText('Selected: copy')).toBeVisible();
        await area.focus();
        await page.keyboard.press('Shift+F10');
        await expect(page.getByRole('menu')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByRole('menu')).toHaveCount(0);
    });
});

test.describe('ContextMenu on touch', () => {
    test('a long press opens the menu at the finger', async ({ page }) => {
        await openStory(page, 'overlays-contextmenu--playground');
        const area = page.getByText('Right-click or Shift+F10');
        const box = (await area.boundingBox())!;
        const point = { pointerType: 'touch', isPrimary: true, clientX: box.x + 30, clientY: box.y + 30, button: 0 };
        await area.dispatchEvent('pointerdown', point);
        await page.waitForTimeout(550);
        const menu = page.getByRole('menu');
        await expect(menu).toBeVisible();
        const menuBox = (await menu.boundingBox())!;
        expect(Math.abs(menuBox.x - point.clientX)).toBeLessThan(40);
        await area.dispatchEvent('pointerup', point);
        await page.keyboard.press('Escape');
        await expect(menu).toHaveCount(0);
    });
});

test.describe('Menubar', () => {
    test('one tab stop; arrow keys move along the bar and between open menus', async ({ page }) => {
        await openStory(page, 'navigation-menubar--playground');
        const bar = page.getByRole('menubar', { name: 'Application' });
        await page.keyboard.press('Tab');
        await expect(bar.getByRole('menuitem', { name: 'File' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(bar.getByRole('menuitem', { name: 'Edit' })).toBeFocused();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('menuitem', { name: 'Undo' })).toBeVisible();
        // The arrow key only moves on to the next menu once the focus is in this one (with animations it comes later)
        await expect(page.locator('[role=menu]:focus')).toContainText('Undo');
        await page.keyboard.press('ArrowRight');
        await expect(page.getByRole('menuitem', { name: 'Zoom in' })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: 'Undo' })).toHaveCount(0);
        await page.keyboard.press('Escape');
        await expect(bar.getByRole('menuitem', { name: 'View' })).toBeFocused();
        await page.keyboard.press('Shift+Tab');
        await page.keyboard.press('Tab');
        await expect(bar.getByRole('menuitem', { name: 'View' })).toBeFocused();
        await bar.getByRole('menuitem', { name: 'File' }).click();
        await page.getByRole('menuitem', { name: 'Save' }).click();
        await expect(page.getByText('Selected: save')).toBeVisible();
    });
});

test.describe('SidebarNav', () => {
    test('groups open, the current page is marked', async ({ page }) => {
        await openStory(page, 'navigation-sidebarnav--playground');
        const nav = page.getByRole('navigation', { name: 'Main navigation' });
        await expect(nav.getByRole('button', { name: 'Infrastructure' })).toHaveAttribute('aria-expanded', 'true');
        await expect(nav.getByRole('link', { name: 'Server' })).toHaveAttribute('aria-current', 'page');
        const reports = nav.getByRole('button', { name: 'Reports' });
        await expect(reports).toHaveAttribute('aria-expanded', 'false');
        await reports.click();
        await nav.getByRole('link', { name: 'Costs' }).click();
        await expect(nav.getByRole('link', { name: 'Costs' })).toHaveAttribute('aria-current', 'page');
        await expect(nav.getByRole('link', { name: 'Server' })).not.toHaveAttribute('aria-current');
    });
});

test.describe('Stepper', () => {
    test('next is blocked while a step is invalid; the last step finishes', async ({ page }) => {
        await openStory(page, 'navigation-stepper--playground');
        await expect(page.getByRole('tab', { name: /Contact/ })).toHaveAttribute('aria-selected', 'true');
        await expect(page.getByRole('button', { name: 'Next' })).toBeDisabled();
        await page.getByRole('textbox', { name: 'Name' }).fill('Julia Klein');
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByRole('tab', { name: /Project/ })).toHaveAttribute('aria-selected', 'true');
        await page.getByRole('textbox', { name: 'Project' }).fill('Customer portal');
        await page.getByRole('button', { name: 'Next' }).click();
        await expect(page.getByText('Julia Klein is planning: Customer portal')).toBeVisible();
        await page.getByRole('button', { name: 'Back' }).click();
        await expect(page.getByRole('textbox', { name: 'Project' })).toHaveValue('Customer portal');
        await page.getByRole('button', { name: 'Next' }).click();
        await page.getByRole('button', { name: 'Finish' }).click();
        await expect(page.getByText('Thanks, we will get back to you.')).toBeVisible();
    });
});
