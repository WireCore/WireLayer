import { expect, test } from '@playwright/test';
import { openStory } from './story.js';

// Scheduler (resources, timeline, series, "+N more", year) and Gantt in the browser – each against Vue and React

test.describe('Scheduler', () => {
    test('dragging an event into the column of another resource', async ({ page }) => {
        await openStory(page, 'data-scheduler--resources');
        const event = page.getByRole('button', { name: /^Sprint planning/ });
        const box = (await event.boundingBox())!;
        const column = (await page
            .getByRole('group', { name: 'Monday, October 19, 2026, Julia Brandt' })
            .boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + 8);
        await page.mouse.down();
        await page.mouse.move(box.x + box.width / 2 + column.width, box.y + 8, { steps: 6 });
        await page.mouse.up();
        const moved = page
            .getByRole('group', { name: 'Monday, October 19, 2026, Malte Heise' })
            .getByRole('button', { name: /^Sprint planning/ });
        await expect(moved).toBeVisible();
        await expect(moved).toBeFocused();
    });

    test('month: an event is dragged with the mouse onto another day', async ({ page }) => {
        await openStory(page, 'data-scheduler--month');
        const retro = page.locator('[data-month-day="2026-10-23"]').getByRole('button', { name: /Retro/ });
        const box = (await retro.boundingBox())!;
        const target = (await page.locator('[data-month-day="2026-10-28"]').boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
        await page.mouse.down();
        await page.mouse.move(target.x + target.width / 2, target.y + target.height / 2, { steps: 8 });
        await page.mouse.up();
        await expect(
            page.locator('[data-month-day="2026-10-28"]').getByRole('button', { name: /Retro/ })
        ).toBeVisible();
        await expect(page.locator('[data-month-day="2026-10-23"]').getByRole('button', { name: /Retro/ })).toHaveCount(
            0
        );
        // en-US times: 2-digit hours with AM/PM (toContainText normalizes the narrow no-break space before it)
        await expect(page.getByRole('status').last()).toContainText(
            'Retro: Wednesday, October 28, 2026, 02:00 PM–03:00 PM'
        );
    });

    test('timeline: Alt+arrow keys move an event to the next row and on in time; rows are windowed', async ({
        page,
    }) => {
        await openStory(page, 'data-scheduler--timeline');
        await expect(page.getByRole('group', { name: 'Technician 60' })).toHaveCount(0);
        const event = page.getByRole('group', { name: 'Technician 01' }).getByRole('button', { name: /^Job 1 08:00/ });
        await event.focus();
        await page.keyboard.press('Alt+ArrowDown');
        const moved = page.getByRole('group', { name: 'Technician 02' }).getByRole('button', { name: /^Job 1 08:00/ });
        await expect(moved).toBeFocused();
        const before = (await moved.boundingBox())!;
        await page.keyboard.press('Alt+ArrowRight');
        await expect.poll(async () => Math.round((await moved.boundingBox())!.x - before.x)).toBe(160);
        await expect(page.getByRole('status').last()).toContainText(
            'Job 1: Tuesday, October 20, 2026, 08:00 AM–12:00 PM'
        );
        await page.getByRole('region', { name: 'Calendar' }).locator('[data-timeline-track]').first().hover();
        await page.mouse.wheel(0, 4000);
        await expect(page.getByRole('group', { name: 'Technician 60' })).toBeVisible();
    });

    test('moving an occurrence of a series asks first; the focus comes back to the event', async ({ page }) => {
        await openStory(page, 'data-scheduler--series');
        const occurrence = page.getByRole('button', { name: /^Weekly sync ?09:30\sAM–10:00\sAM/ }).first();
        await occurrence.focus();
        await page.keyboard.press('Alt+ArrowDown');
        const dialog = page.getByRole('alertdialog', { name: 'Change recurring event' });
        await expect(dialog).toBeVisible();
        await dialog.getByRole('button', { name: 'This event' }).click();
        await expect(dialog).toBeHidden();
        await expect(page.getByRole('button', { name: /^Weekly sync ?10:00\sAM–10:30\sAM/ })).toBeFocused();
    });

    test('"+N more" opens a popover with the events of the day; Escape returns to the button', async ({ page }) => {
        await openStory(page, 'data-scheduler--more-popover');
        const more = page.getByRole('button', { name: /^\+\d more$/ }).first();
        await more.click();
        const panel = page.getByRole('dialog');
        await expect(panel).toBeVisible();
        expect(await panel.getByRole('button').count()).toBeGreaterThan(2);
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        await expect(more).toBeFocused();
    });

    test('year: arrow keys move between days, Enter opens the day', async ({ page }) => {
        await openStory(page, 'data-scheduler--year');
        const day = page.getByRole('button', { name: /^Tuesday, October 20, 2026/ });
        await expect(day).toHaveAttribute('tabindex', '0');
        await day.focus();
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('button', { name: /^Tuesday, October 27, 2026/ })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByRole('heading', { level: 2 })).toHaveText('Tuesday, October 27, 2026');
    });
});

test.describe('Gantt', () => {
    test('keyboard in the task list: rows, collapse, Alt+arrows move and resize with an announcement', async ({
        page,
    }) => {
        await openStory(page, 'data-gantt--playground');
        const grid = page.getByRole('treegrid', { name: 'Website relaunch' });
        await page.getByRole('button', { name: 'Today' }).focus();
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');
        const rows = grid.getByRole('row');
        await expect(rows.nth(1)).toBeFocused();
        await page.keyboard.press('ArrowLeft');
        await expect(rows.nth(1)).toHaveAttribute('aria-expanded', 'false');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        const interviews = rows.nth(3);
        await expect(interviews).toBeFocused();
        await expect(interviews).toContainText('User interviews');
        await page.keyboard.press('Alt+ArrowRight');
        await expect(interviews.getByRole('gridcell').nth(1)).toHaveText('10/14/2026');
        await expect(interviews).toBeFocused();
        await page.keyboard.press('Alt+Shift+ArrowRight');
        await expect(interviews.getByRole('gridcell').nth(3)).toHaveText('9 days');
        await expect(page.getByRole('status').last()).toHaveText('User interviews: 10/14/2026 – 10/22/2026, 9 days');
    });
});
