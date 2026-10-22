import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

test.describe('DatePicker with time', () => {
    test('date and time in one go; a day from the calendar keeps the time', async ({ page }) => {
        await openStory(page, 'forms-datepicker--with-time');
        const group = page.getByRole('group', { name: 'Appointment' });
        // en-US: month/day/year and 12 hours with AM/PM
        await expect(group.getByRole('spinbutton')).toHaveText(['10', '20', '2026', '02', '30', 'PM']);
        await page.getByRole('button', { name: 'Clear date' }).click();
        await group.getByRole('spinbutton', { name: 'Month' }).click();
        await page.keyboard.type('110320260915a');
        await expect(page.getByText('Value: 2026-11-03T09:15')).toBeVisible();
        await page.getByRole('button', { name: 'Open calendar' }).click();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        await expect(page.getByText('Value: 2026-11-04T09:15')).toBeVisible();
    });
});

test.describe('DateRangePicker', () => {
    test('two named dates in one field; typing runs on from start to end', async ({ page }) => {
        await openStory(page, 'forms-daterangepicker--playground');
        const start = page.getByRole('group', { name: 'Vacation Start' });
        const end = page.getByRole('group', { name: 'Vacation End' });
        await expect(start.getByRole('spinbutton')).toHaveText(['10', '20', '2026']);
        await expect(end.getByRole('spinbutton')).toHaveText(['10', '24', '2026']);
        await page.getByRole('button', { name: 'Clear range' }).click();
        await start.getByRole('spinbutton', { name: 'Month' }).click();
        await page.keyboard.type('1102202611062026');
        await expect(page.getByText('From: 2026-11-02 · To: 2026-11-06')).toBeVisible();
    });

    test('the calendar picks start, then end, and marks the days between', async ({ page }) => {
        await openStory(page, 'forms-daterangepicker--playground');
        await page.getByRole('button', { name: 'Clear range' }).click();
        await page.getByRole('button', { name: 'Open calendar' }).click();
        await page.getByRole('button', { name: /^Wednesday, October 7, 2026/ }).click();
        await page.getByRole('button', { name: /^Friday, October 9, 2026/ }).click();
        await expect(page.getByText('From: 2026-10-07 · To: 2026-10-09')).toBeVisible();
    });

    test('with time: start and end each get hour and minute', async ({ page }) => {
        await openStory(page, 'forms-daterangepicker--with-time');
        const end = page.getByRole('group', { name: 'Maintenance window End' });
        await expect(end.getByRole('spinbutton')).toHaveText(['10', '20', '2026', '05', '30', 'PM']);
        await end.getByRole('spinbutton', { name: 'Hour' }).click();
        await page.keyboard.type('0645p');
        await expect(page.getByText('To: 2026-10-20T18:45')).toBeVisible();
    });
});

test.describe('TimePicker', () => {
    test('hour and minute in one go, or from the list', async ({ page }) => {
        await openStory(page, 'forms-timepicker--playground');
        const group = page.getByRole('group', { name: 'Start' });
        await expect(group).toHaveAccessibleDescription('Between 7 AM and 7 PM');
        // en-US: 12 hours with AM/PM in the field, the value stays "HH:mm"
        await expect(group.getByRole('spinbutton')).toHaveText(['09', '30', 'AM']);
        await group.getByRole('spinbutton', { name: 'Hour' }).click();
        await page.keyboard.type('0215p');
        await expect(page.getByText('Value: 14:15')).toBeVisible();
        await page.getByRole('combobox', { name: 'Select time' }).click();
        const list = page.getByRole('listbox', { name: 'Select time' });
        await expect(list.getByRole('option')).toHaveCount(25);
        await list.getByRole('option', { name: '16:30' }).click();
        await expect(page.getByText('Value: 16:30')).toBeVisible();
        await expect(group.getByRole('spinbutton')).toHaveText(['04', '30', 'PM']);
        await page.getByRole('button', { name: 'Clear time' }).click();
        await expect(page.getByText('Value: –')).toBeVisible();
    });
});

test.describe('Calendar with two months', () => {
    test('arrow keys run from one month into the next; Page Down moves the months on', async ({ page }) => {
        await openStory(page, 'forms-calendar--two-months');
        const grids = page.getByRole('grid');
        await expect(grids).toHaveCount(2);
        // A new range: start, then end (Ark moves the focus to the end day)
        await page.getByRole('button', { name: /^Friday, November 27, 2026/ }).click();
        await page.getByRole('button', { name: /^Monday, November 30, 2026/ }).click();
        await expect(page.getByRole('button', { name: /^Selected: Monday, November 30, 2026/ })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        const december = grids.nth(1).getByRole('button', { name: /Tuesday, December 1, 2026/ });
        await expect(december).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(december).toHaveAttribute('data-selected', '');
        // Page Down: a month later – the months move on with the focus
        await page.keyboard.press('PageDown');
        await expect(page.getByText('January 2027', { exact: true })).toBeVisible();
        await expect(page.locator(':focus')).toHaveAttribute('aria-label', /January \d+, 2027$/);
    });
});

test.describe('QuarterPicker', () => {
    test('range with the keyboard, on into the next year', async ({ page }) => {
        await openStory(page, 'forms-quarterpicker--range');
        await page.getByRole('button', { name: 'Select quarter' }).click();
        const dialog = page.getByRole('dialog', { name: 'Quarters' });
        await expect(dialog.getByRole('button', { name: /^Q1 2026/ })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Enter');
        for (let step = 0; step < 3; step++) await page.keyboard.press('ArrowRight');
        await expect(dialog.getByRole('button', { name: /^Q1 2027/ })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByText('From: 2026-Q2 · To: 2027-Q1')).toBeVisible();
        await expect(page.getByRole('textbox', { name: 'Comparison period' })).toHaveValue('Q2 2026 – Q1 2027');
    });
});

test.describe('DurationInput', () => {
    test('hours past 24, ":" moves to the minutes; the duration is spoken in words', async ({ page }) => {
        await openStory(page, 'forms-durationinput--playground');
        const group = page.getByRole('group', { name: 'Effort' });
        await expect(group.getByRole('spinbutton')).toHaveText(['2', '30']);
        await group.getByRole('spinbutton', { name: 'Hours' }).click();
        await page.keyboard.type('26:45');
        await expect(page.getByText('Value: 1605')).toBeVisible();
        await expect(group).toHaveAccessibleDescription(/26 hours 45 minutes/);
        await page.keyboard.press('ArrowUp');
        await expect(page.getByText('Value: 1606')).toBeVisible();
    });
});

test.describe('TimeGrid', () => {
    test('one tab stop; arrow keys choose and skip taken slots', async ({ page }) => {
        await openStory(page, 'forms-timegrid--playground');
        const group = page.getByRole('radiogroup', { name: 'Available times' });
        // en-US shows the times with AM/PM, the value stays "HH:mm"
        await page.keyboard.press('Tab');
        await expect(group.getByRole('radio', { name: '09:30 AM' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(group.getByRole('radio', { name: '11:00 AM' })).toBeFocused();
        await expect(page.getByText('Selected: 11:00')).toBeVisible();
        await group.getByRole('radio', { name: '02:00 PM' }).click();
        await expect(group.getByRole('radio', { name: '02:00 PM' })).toHaveAttribute('aria-checked', 'true');
        await expect(page.getByText('Selected: 14:00')).toBeVisible();
    });
});
