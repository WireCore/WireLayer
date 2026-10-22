import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('DataView', () => {
    test('switches between grid and list and pages through the items', async ({ page }) => {
        await openStory(page, 'data-dataview--playground');
        const list = page.getByRole('list', { name: 'Servers' });
        await expect(list.getByRole('listitem')).toHaveCount(6);
        const layout = page.getByRole('radiogroup', { name: 'View' });
        await expect(layout.getByRole('radio', { name: 'Grid' })).toBeChecked();
        await layout.getByText('List').click();
        await expect(layout.getByRole('radio', { name: 'List' })).toBeChecked();
        await page.getByRole('button', { name: /Page 2/ }).click();
        await expect(list.getByRole('listitem')).toHaveCount(1);
        await expect(list).toContainText('mail-01');
    });
});

test.describe('OrderList', () => {
    test('moves the chosen item with buttons and Alt + arrow keys, announcing the position', async ({ page }) => {
        await openStory(page, 'data-orderlist--playground');
        const list = page.getByRole('listbox', { name: 'Maintenance steps' });
        await expect(page.getByRole('button', { name: 'Move up', exact: true })).toBeDisabled();
        await list.getByRole('option', { name: 'Install update' }).click();
        await page.getByRole('button', { name: 'Move up', exact: true }).click();
        await expect(page.getByRole('status')).toHaveText('Install update: position 2 of 5');
        await expect(page.getByText('Order: backup, update, drain, reboot, check')).toBeVisible();
        await list.focus();
        await page.keyboard.press('Alt+ArrowDown');
        await page.keyboard.press('Alt+ArrowDown');
        await expect(page.getByText('Order: backup, drain, reboot, update, check')).toBeVisible();
        await page.getByRole('button', { name: 'Move to top' }).click();
        await expect(page.getByText('Order: update, backup, drain, reboot, check')).toBeVisible();
    });
});

test.describe('PickList', () => {
    test('moves chosen items between the lists and announces it', async ({ page }) => {
        await openStory(page, 'data-picklist--playground');
        const team = page.getByRole('listbox', { name: 'Team' });
        const project = page.getByRole('listbox', { name: 'In project' });
        await team.getByRole('option', { name: 'Julia Klein' }).click();
        await team.getByRole('option', { name: 'Tom Becker' }).click();
        await page.getByRole('button', { name: 'Add selected' }).click();
        await expect(page.getByRole('status')).toHaveText('2 items moved to “In project”');
        await expect(project.getByRole('option')).toHaveText(['Max Schulz', 'Julia Klein', 'Tom Becker']);
        await page.getByRole('button', { name: 'Remove all' }).click();
        await expect(page.getByText('In project: –')).toBeVisible();
        await expect(team.getByRole('option')).toHaveCount(5);
    });
});

test.describe('Timeline, OrgChart, MeterGroup', () => {
    test('timeline is an ordered list with machine-readable times', async ({ page }) => {
        await openStory(page, 'data-timeline--playground');
        const list = page.getByRole('list', { name: 'History' });
        await expect(list.getByRole('listitem')).toHaveCount(4);
        await expect(list.locator('time').first()).toHaveAttribute('datetime', '2026-10-20T09:12');
    });

    test('org chart reads as nested lists', async ({ page }) => {
        await openStory(page, 'data-orgchart--playground');
        const chart = page.getByRole('list', { name: 'Org chart' });
        // Below Julia Klein: her team as a nested list
        const team = chart.locator('li:has(> div:has-text("Julia Klein")) > ul');
        await expect(team.getByRole('listitem')).toHaveText([/Max Schulz/, /Ana Lopez/]);
    });

    test('meter group lists every part with its value', async ({ page }) => {
        await openStory(page, 'data-metergroup--playground');
        const group = page.getByRole('group', { name: 'Storage (1 TB)' });
        await expect(group.getByRole('listitem')).toHaveText(['Databases 42 %', 'Backups 26 %', 'Logs 9 %']);
    });
});

test.describe('VirtualList', () => {
    test('renders only the visible rows but tells their position', async ({ page }) => {
        await openStory(page, 'data-virtuallist--playground');
        const list = page.getByRole('list', { name: 'Log' });
        const first = list.getByRole('listitem').first();
        await expect(first).toHaveAttribute('aria-setsize', '10000');
        expect(await list.getByRole('listitem').count()).toBeLessThan(40);
        await list.evaluate((element) => (element.scrollTop = element.scrollHeight));
        await expect(list.getByText('Request 10000 handled')).toBeVisible();
        await expect(list.getByRole('listitem').last()).toHaveAttribute('aria-posinset', '10000');
    });
});

test.describe('PickList drag and drop', () => {
    test('the keyboard way: Space chooses, the button moves; dragging moves, too', async ({ page }) => {
        await openStory(page, 'data-picklist--objects-search-drag');
        const team = page.getByRole('listbox', { name: 'Team' });
        const project = page.getByRole('listbox', { name: 'In project' });
        await team.getByRole('option', { name: /Julia Klein/ }).click();
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        await page.getByRole('button', { name: 'Add selected' }).click();
        await expect(page.getByRole('status')).toHaveText('2 items moved to “In project”');
        await expect(page.getByText('In project: Max Schulz, Julia Klein, Ana Lopez', { exact: true })).toBeVisible();
        // Drag and drop moves one item back
        await project.getByRole('option', { name: /Ana Lopez/ }).dragTo(team);
        await expect(page.getByText('In project: Max Schulz, Julia Klein', { exact: true })).toBeVisible();
        await expect(team.getByRole('option', { name: /Ana Lopez/ })).toBeVisible();
    });

    test('"Select all" and a search field per list', async ({ page }) => {
        await openStory(page, 'data-picklist--objects-search-drag');
        await page.getByRole('textbox', { name: 'Filter options' }).first().fill('Tom');
        const team = page.getByRole('listbox', { name: 'Team' });
        await expect(team.getByRole('option')).toHaveCount(1);
        await page.getByRole('checkbox', { name: 'Select all' }).first().click();
        await page.getByRole('button', { name: 'Add selected' }).click();
        await expect(page.getByText('In project: Max Schulz, Tom Becker', { exact: true })).toBeVisible();
    });
});

test.describe('DataView server data', () => {
    test('pages and search ask the source; "Load more" grows the list', async ({ page }) => {
        await openStory(page, 'data-dataview--server-data');
        const list = page.getByRole('list', { name: 'Servers' });
        await expect(list.getByText('srv-01')).toBeVisible();
        await page.getByRole('button', { name: /Page 2/ }).click();
        await expect(list.getByText('srv-07')).toBeVisible();
        await page.getByRole('textbox', { name: 'Search servers' }).fill('Vienna');
        await expect(list.getByText('srv-03')).toBeVisible();
        await expect(page.getByRole('status')).toHaveText('20 items loaded');

        await openStory(page, 'data-dataview--infinite');
        const grown = page.getByRole('list', { name: 'Servers' });
        await expect(grown.getByText('srv-08')).toBeVisible();
        // autoLoad may already have added pages while the end was in view
        const before = await grown.getByRole('listitem').count();
        await page.getByRole('button', { name: 'Load more' }).click();
        await expect(grown.getByRole('listitem')).toHaveCount(before + 8);
        await expect(page.getByText(`${before + 8} of 60 shown`)).toBeVisible();
    });
});

test.describe('VirtualList data source', () => {
    test('scrolling to the end loads the next page', async ({ page }) => {
        await openStory(page, 'data-virtuallist--infinite');
        const list = page.getByRole('list', { name: 'Log' });
        await expect(list.getByText('Request 1 handled')).toBeVisible();
        await expect(list.getByRole('listitem').first()).toHaveAttribute('aria-setsize', '50');
        await list.evaluate((element) => (element.scrollTop = element.scrollHeight));
        await expect(list.getByRole('listitem').first()).toHaveAttribute('aria-setsize', '100');
    });

    test('group headings stick to the top', async ({ page }) => {
        await openStory(page, 'data-virtuallist--groups');
        const list = page.getByRole('list', { name: 'Log' });
        await list.evaluate((element) => (element.scrollTop = 1500));
        const sticky = list.locator('[role=presentation].sticky');
        await expect(sticky).toHaveCount(1);
        const box = await sticky.boundingBox();
        const top = (await list.boundingBox())!.y;
        expect(Math.abs(box!.y - top)).toBeLessThan(3);
    });
});

test.describe('Timeline feed', () => {
    test('Page Down moves from article to article; the end loads older entries', async ({ page }) => {
        await openStory(page, 'data-timeline--feed');
        const feed = page.getByRole('feed', { name: 'Activity' });
        const articles = feed.getByRole('article');
        await articles.first().focus();
        await page.keyboard.press('PageDown');
        await expect(articles.nth(1)).toBeFocused();
        await page.getByRole('button', { name: 'Load older entries' }).click();
        await expect(articles).toHaveCount(12);
        await expect(articles.first()).toHaveAttribute('aria-setsize', '24');
    });
});
