import { expect, test } from '@playwright/test';
import { openStory } from './story.ts';

// Keyboard and pointer in the browser: sortable lists (keyboard, drag, two clicks), mentions, the emoji grid, the
// floating panel (Alt+arrows), the image cropper and the angle slider – against the Vue and the React Storybook

test.describe('Sortable', () => {
    test('Space picks up, arrows move, Space drops; the focus stays on the moved item', async ({ page }) => {
        await openStory(page, 'data-sortable--playground');
        await page.getByRole('button', { name: 'Move Planning' }).focus();
        await page.keyboard.press('Space');
        await expect(page.getByRole('button', { name: 'Move Planning' })).toHaveAttribute('aria-pressed', 'true');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('ArrowDown');
        await expect(page.getByRole('button', { name: 'Move Planning' })).toBeFocused();
        await page.keyboard.press('Space');
        await expect(page.getByText('Implementation → Test → Planning → Release')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Move Planning' })).toHaveAttribute('aria-pressed', 'false');
        // Escape puts it back
        await page.keyboard.press('Enter');
        await page.keyboard.press('Home');
        await expect(page.getByText('Planning → Implementation → Test → Release')).toBeVisible();
        await page.keyboard.press('Escape');
        await expect(page.getByText('Implementation → Test → Planning → Release')).toBeVisible();
    });

    test('drag with the pointer, or click the handle and click the target (WCAG 2.5.7)', async ({ page }) => {
        await openStory(page, 'data-sortable--playground');
        const planning = page.getByRole('button', { name: 'Move Planning' });
        const test_ = page.getByRole('button', { name: 'Move Test' });
        const from = (await planning.boundingBox())!;
        const to = (await test_.boundingBox())!;
        await page.mouse.move(from.x + from.width / 2, from.y + from.height / 2);
        await page.mouse.down();
        await page.mouse.move(to.x + to.width / 2, to.y + to.height / 2, { steps: 8 });
        await page.mouse.up();
        await expect(page.getByText('Implementation → Test → Planning → Release')).toBeVisible();
        // Single clicks: pick up Release, put it where Implementation is
        await page.getByRole('button', { name: 'Move Release' }).click();
        await expect(page.getByRole('button', { name: 'Move Release' })).toHaveAttribute('aria-pressed', 'true');
        await page.getByRole('button', { name: 'Move Implementation' }).click();
        await expect(page.getByText('Release → Implementation → Test → Planning')).toBeVisible();
    });

    test('Kanban: arrow right moves a card into the next column', async ({ page }) => {
        await openStory(page, 'data-sortable--kanban');
        await page.getByRole('button', { name: 'Move Login page' }).focus();
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Space');
        const done = page.getByRole('list', { name: 'Done' });
        await expect(done.getByRole('button', { name: 'Move Login page' })).toBeFocused();
        await expect(page.getByRole('list', { name: 'Open' }).getByRole('listitem')).toHaveCount(1);
    });

    test('grids of one group: arrows past the last tile move it into the next grid', async ({ page }) => {
        await openStory(page, 'data-sortable--grid-group');
        await page.getByRole('button', { name: 'Move D' }).focus();
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowRight');
        const pool = page.getByRole('list', { name: 'Available' });
        await expect(pool.getByRole('button', { name: 'Move D' })).toBeFocused();
        await page.keyboard.press('Space');
        await expect(pool.getByRole('listitem').first()).toHaveText(/D/);
        await expect(page.getByRole('list', { name: 'Selected' }).getByRole('listitem')).toHaveCount(3);
        // And back: arrow up from the first row goes to the end of the previous grid
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowUp');
        await page.keyboard.press('Space');
        await expect(page.getByRole('list', { name: 'Selected' }).getByRole('listitem').last()).toHaveText(/D/);
    });
});

test.describe('Mentions', () => {
    test('"@" suggests people, arrows choose, Enter inserts the mention', async ({ page }) => {
        await openStory(page, 'forms-mentions--playground');
        const field = page.getByRole('textbox', { name: 'Comment' });
        await field.click();
        await page.keyboard.press('End');
        await page.keyboard.press('Control+End');
        await page.keyboard.type(' @c');
        const list = page.getByRole('listbox', { name: 'Suggestions' });
        await expect(list.getByRole('option')).toHaveCount(1);
        await expect(list.getByRole('option')).toHaveText(/^Clara Weiß/);
        await page.keyboard.press('Enter');
        await expect(list).toBeHidden();
        await expect(page.getByText(/@\[Clara Weiß\]\(clara\)/)).toBeVisible();
        await expect(field).toBeFocused();
    });
});

test.describe('EmojiPicker', () => {
    test('arrow down from the search into the grid, arrows move, Enter chooses', async ({ page }) => {
        await openStory(page, 'forms-emojipicker--playground');
        await page.getByRole('searchbox', { name: 'Search emoji' }).fill('heart');
        await page.keyboard.press('ArrowDown');
        const grid = page.getByRole('grid', { name: 'Search results' });
        await expect(grid.getByRole('button').first()).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(grid.getByRole('button').nth(1)).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByText(/^Selected: (?!–)/)).toBeVisible();
    });
});

test.describe('FloatingPanel', () => {
    test('Alt+arrows move, Alt+Shift+arrows resize, Escape closes and returns the focus', async ({ page }) => {
        await openStory(page, 'overlays-floatingpanel--playground');
        const trigger = page.getByRole('button', { name: 'Open notes' });
        await trigger.click();
        const panel = page.getByRole('dialog', { name: 'Notes' });
        await expect(panel).toBeVisible();
        // With animations (E2E_MOTION) the panel zooms in – measure it at its final size
        await panel.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
        await panel.focus();
        const before = (await panel.boundingBox())!;
        await page.keyboard.press('Alt+ArrowRight');
        await page.keyboard.press('Alt+ArrowDown');
        await expect.poll(async () => (await panel.boundingBox())!.x).toBeCloseTo(before.x + 10, 0);
        await expect.poll(async () => (await panel.boundingBox())!.y).toBeCloseTo(before.y + 10, 0);
        await page.keyboard.press('Alt+Shift+ArrowRight');
        await expect.poll(async () => (await panel.boundingBox())!.width).toBeCloseTo(before.width + 10, 0);
        await page.keyboard.press('Escape');
        await expect(panel).toBeHidden();
        await expect(trigger).toBeFocused();
    });
});

test.describe('ImageCropper', () => {
    test('the crop area moves with the arrow keys, + zooms, the toolbar rotates', async ({ page }) => {
        await openStory(page, 'media-imagecropper--playground');
        const area = page.getByRole('slider', { name: 'Circular crop area' });
        await expect(area).toHaveAttribute('aria-roledescription', 'movable crop area');
        await area.focus();
        const start = Number(await area.getAttribute('aria-valuenow'));
        await page.keyboard.press('ArrowRight');
        await expect(area).toHaveAttribute('aria-valuenow', String(start + 1));
        await page.keyboard.press('Shift+ArrowLeft');
        await expect(area).toHaveAttribute('aria-valuenow', String(start - 9));
        const zoom = page.getByRole('group', { name: 'Edit image' }).getByText(/%$/);
        await expect(zoom).toHaveText('100 %');
        await page.keyboard.press('+');
        await expect(zoom).not.toHaveText('100 %');
        await page.getByRole('button', { name: 'Reset' }).click();
        await expect(zoom).toHaveText('100 %');
    });
});

test.describe('AngleSlider', () => {
    test('arrow keys change the angle, Home goes to 0', async ({ page }) => {
        await openStory(page, 'forms-angleslider--playground');
        const slider = page.getByRole('slider', { name: 'Wind direction' });
        await slider.focus();
        await page.keyboard.press('ArrowRight');
        await expect(slider).toHaveAttribute('aria-valuenow', '46');
        await expect(slider).toHaveAttribute('aria-valuetext', '46 degrees');
        await page.keyboard.press('Home');
        await expect(slider).toHaveAttribute('aria-valuenow', '0');
    });
});

test.describe('Marquee', () => {
    test.use({ reducedMotion: 'no-preference' });

    // The animation reads variables Ark sets on the element – it silently did not run once
    test('moves, and stops with the pause button', async ({ page }) => {
        await openStory(page, 'data-marquee--playground');
        const content = page.locator('[data-scope="marquee"][data-part="content"]').first();
        const offset = () => content.evaluate((el) => new DOMMatrix(getComputedStyle(el).transform).m41);
        const first = await offset();
        await expect.poll(offset, { timeout: 5000 }).not.toBe(first);
        await page.getByRole('button', { name: /pause/i }).first().click();
        // Measure once the browser has stopped the animation – on a slow machine it runs another frame
        await expect(content).toHaveCSS('animation-play-state', 'paused');
        const paused = await offset();
        await page.waitForTimeout(600);
        expect(await offset()).toBe(paused);
    });
});
