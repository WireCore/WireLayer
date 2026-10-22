import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('Autocomplete', () => {
    test('free text stays; a suggestion is taken with the arrow keys and Enter', async ({ page }) => {
        await openStory(page, 'forms-autocomplete--playground');
        const input = page.getByRole('combobox', { name: 'Department' });
        await input.pressSequentially('sal');
        await expect(page.getByRole('option')).toHaveText(['Sales']);
        await input.press('ArrowDown');
        await input.press('Enter');
        await expect(input).toHaveValue('Sales');
        await expect(page.getByText('Value: Sales')).toBeVisible();
        // Text without a suggestion: the list closes, the text is the value
        await input.fill('Quality assurance');
        await expect(page.getByRole('listbox')).toBeHidden();
        await expect(page.getByText('Value: Quality assurance')).toBeVisible();
        await expect(input).toHaveAttribute('aria-expanded', 'false');
    });
});

test.describe('YearPicker', () => {
    test('types the year or picks it from the grid', async ({ page }) => {
        await openStory(page, 'forms-yearpicker--playground');
        const group = page.getByRole('group', { name: 'Fiscal year' });
        await expect(group.getByRole('spinbutton')).toHaveText(['2026']);
        await group.getByRole('spinbutton', { name: 'Year' }).click();
        await page.keyboard.type('2031');
        await expect(page.getByText('Value: 2031')).toBeVisible();
        await page.getByRole('button', { name: 'Open calendar' }).click();
        await page.getByRole('button', { name: '2033' }).click();
        await expect(page.getByText('Value: 2033')).toBeVisible();
    });
});

test.describe('ActionBar', () => {
    test('shows the count, one tab stop for the actions, clearing hides it', async ({ page }) => {
        await openStory(page, 'data-actionbar--playground');
        const bar = page.getByRole('toolbar', { name: 'Actions for the selection' });
        await expect(bar.getByRole('status')).toHaveText('2 selected');
        await page.getByText('Invoice-2026-10.pdf').click();
        await expect(bar.getByRole('status')).toHaveText('3 selected');
        await bar.getByRole('button', { name: 'Download' }).focus();
        await page.keyboard.press('End');
        await expect(bar.getByRole('button', { name: 'Clear selection' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(bar).toBeHidden();
        await expect(page.getByRole('checkbox', { name: 'Quote.pdf' })).not.toBeChecked();
    });
});

test.describe('Countdown', () => {
    test('is a named timer that counts down every second', async ({ page }) => {
        await page.clock.install({ time: new Date('2026-12-24T17:58:00') });
        await openStory(page, 'data-countdown--playground');
        await page.clock.pauseAt(new Date('2026-12-24T17:58:58'));
        const timer = page.getByRole('timer', { name: 'Until Christmas Eve' });
        await expect(timer).toHaveText('00Days00Hours01Minute02Seconds');
        await page.clock.runFor(2000);
        await expect(timer).toHaveText('00Days00Hours01Minute00Seconds');
        await page.clock.runFor(60_000);
        await expect(timer).toHaveText('00Days00Hours00Minutes00Seconds');
    });
});

test.describe('Charts without a chart library', () => {
    test('Gauge is a named meter with its value as text', async ({ page }) => {
        await openStory(page, 'data-gauge--playground');
        const meter = page.getByRole('meter', { name: 'CPU load' });
        await expect(meter).toHaveAttribute('aria-valuenow', '82');
        await expect(meter).toHaveAttribute('aria-valuetext', '82%');
    });

    test('Sankey is an image named by its title, the flows open as a table', async ({ page }) => {
        await openStory(page, 'data-sankey--playground');
        await expect(page.getByRole('img', { name: 'Visitor flow in October' })).toBeVisible();
        await page.getByText('Data as table').click();
        const table = page.getByRole('table', { name: 'Visitor flow in October' });
        await expect(table.getByRole('row')).toHaveCount(8);
        await expect(table.getByRole('row', { name: /Shop Order 310/ })).toBeVisible();
    });

    test('Treemap and Heatmap keep their data as list and table', async ({ page }) => {
        await openStory(page, 'data-treemap--playground');
        await expect(page.getByRole('list', { name: 'Storage by project' }).getByRole('listitem')).toHaveCount(6);
        await openStory(page, 'data-heatmap--playground');
        const table = page.getByRole('table', { name: 'Requests per hour' });
        await expect(table.getByRole('cell', { name: '80' })).toHaveAttribute('data-level', '4');
    });
});

test.describe('Compare', () => {
    test('arrow keys and dragging move the line', async ({ page }) => {
        await openStory(page, 'media-compare--playground');
        const slider = page.getByRole('slider', { name: 'Before and after comparison' });
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await expect(page.getByText('Before: 41%')).toBeVisible();
        await expect(slider).toHaveAttribute('aria-valuetext', '41% before, 59% after');
        const box = (await slider.boundingBox())!;
        await page.mouse.click(box.x + box.width * 0.8, box.y + box.height / 2);
        await expect(page.getByText(/Before: (79|80|81)%/)).toBeVisible();
    });
});

test.describe('Scheduler', () => {
    test('dragging an event moves it by half hours and to another day', async ({ page }) => {
        await openStory(page, 'data-scheduler--playground');
        const review = page.getByRole('button', { name: /^Code review/ });
        const box = (await review.boundingBox())!;
        const column = (await page.getByRole('group', { name: 'Tuesday, October 20, 2026' }).boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + 8);
        await page.mouse.down();
        // One day to the right and one hour (48 px) down
        await page.mouse.move(box.x + box.width / 2 + column.width, box.y + 8 + 48, { steps: 6 });
        await page.mouse.up();
        const moved = page.getByRole('group', { name: 'Wednesday, October 21, 2026' }).getByRole('button', {
            // en-US times: 2-digit hours with AM/PM (a narrow no-break space before it)
            name: /^Code review 12:00\sPM–01:30\sPM/,
        });
        await expect(moved).toBeVisible();
        await expect(moved).toBeFocused();
    });

    test('clicking an empty time chooses it', async ({ page }) => {
        await openStory(page, 'data-scheduler--playground');
        const column = page.getByRole('group', { name: 'Friday, October 23, 2026' });
        const box = (await column.boundingBox())!;
        // 48 px per hour from 08:00: 3 hours down
        await page.mouse.click(box.x + box.width / 2, box.y + 3 * 48 + 10);
        await expect(page.getByText('Last: New: 2026-10-23T11:00')).toBeVisible();
    });
});

test.describe('Chip', () => {
    test('the remove button is reached with Tab and removes the chip with Enter or Space', async ({ page }) => {
        await openStory(page, 'data-chip--removable');
        await page.keyboard.press('Tab');
        const remove = page.getByRole('button', { name: 'Remove Berlin' });
        await expect(remove).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByText('Berlin')).toHaveCount(0);
        await page.getByRole('button', { name: 'Remove Frankfurt' }).focus();
        await page.keyboard.press('Space');
        await expect(page.getByText('Frankfurt')).toHaveCount(0);
        await expect(page.getByText('Munich')).toBeVisible();
    });
});
