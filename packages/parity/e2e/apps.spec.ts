import { expect, test } from '@playwright/test';
import { nextFrame, openStory } from './story.ts';

// App patterns in the browser: the Kanban board (keyboard, two clicks), the chat's auto-scroll, the editor's bubble
// menu by keyboard, the chart brush with the arrow keys and code tabs – against the Vue and the React Storybook

test.describe('Kanban', () => {
    test('Space, arrow right, Space moves a card into the next column; the focus stays on it', async ({ page }) => {
        await openStory(page, 'data-kanban--playground');
        await page.getByRole('button', { name: 'Move Login page' }).focus();
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowDown');
        await page.keyboard.press('Space');
        const doing = page.getByRole('region', { name: 'In progress' });
        await expect(doing.getByRole('button', { name: 'Move Login page' })).toBeFocused();
        await expect(doing.getByRole('listitem')).toHaveCount(2);
        await expect(page.getByText('Login page: open (1) → doing (2)')).toBeVisible();
        // At its WIP limit now
        await expect(doing.getByText('WIP limit reached')).toBeVisible();
    });

    test.describe('animation', () => {
        test.use({ reducedMotion: 'no-preference' });

        // Cards glide to their new place instead of jumping – also over to another column
        test('a moved card glides over to the other column', async ({ page }) => {
            await openStory(page, 'data-kanban--playground');
            await page.getByRole('button', { name: 'Move Check backup' }).click();
            await page.getByRole('button', { name: 'Move Search field' }).click();
            const card = page
                .getByRole('region', { name: 'Review' })
                .getByRole('listitem')
                .filter({ has: page.getByRole('button', { name: 'Move Check backup' }) });
            await expect(card).toBeVisible();
            // Right after the move it is still on its way: a transform animation runs
            const running = await card.evaluate((el) => el.getAnimations().some((a) => a.playState === 'running'));
            expect(running).toBe(true);
            await expect.poll(() => card.evaluate((el) => el.getAnimations().length)).toBe(0);
        });

        test('with reduced motion it moves at once', async ({ page }) => {
            await page.emulateMedia({ reducedMotion: 'reduce' });
            await openStory(page, 'data-kanban--playground');
            await page.getByRole('button', { name: 'Move Check backup' }).click();
            await page.getByRole('button', { name: 'Move Search field' }).click();
            const card = page
                .getByRole('region', { name: 'Review' })
                .getByRole('listitem')
                .filter({ has: page.getByRole('button', { name: 'Move Check backup' }) });
            await expect(card).toBeVisible();
            expect(await card.evaluate((el) => el.getAnimations().length)).toBe(0);
        });
    });

    test('two clicks: pick up a card, click a card of another column', async ({ page }) => {
        await openStory(page, 'data-kanban--playground');
        await page.getByRole('button', { name: 'Move Check backup' }).click();
        await page.getByRole('button', { name: 'Move Search field' }).click();
        const review = page.getByRole('region', { name: 'Review' });
        await expect(review.getByRole('button', { name: 'Move Check backup' })).toBeVisible();
        await expect(review.getByText('WIP limit exceeded: 2 of 1')).toBeVisible();
    });

    test('a collapsed column is skipped; it opens again with its button', async ({ page }) => {
        await openStory(page, 'data-kanban--playground');
        await page.getByRole('button', { name: 'Collapse In progress' }).click();
        await expect(page.getByRole('button', { name: 'Expand In progress' })).toHaveAttribute(
            'aria-expanded',
            'false'
        );
        await page.getByRole('button', { name: 'Move Login page' }).focus();
        await page.keyboard.press('Space');
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('Space');
        await expect(
            page.getByRole('region', { name: 'Review' }).getByRole('button', { name: 'Move Login page' })
        ).toBeFocused();
        await page.getByRole('button', { name: 'Expand In progress' }).click();
        await expect(page.getByRole('button', { name: 'Move API documentation' })).toBeVisible();
    });
});

test.describe('Chat', () => {
    test('follows new messages at the end; scrolled up, a button leads to them', async ({ page }) => {
        await openStory(page, 'data-chat--long-history');
        const log = page.getByRole('log', { name: 'Messages' });
        const atEnd = () =>
            log.evaluate((element) => element.scrollHeight - element.scrollTop - element.clientHeight < 8);
        await expect.poll(atEnd).toBe(true);
        const receive = page.getByRole('button', { name: 'Receive message from Clara' });
        await receive.click();
        await expect(log.getByText('New message 31')).toBeInViewport();
        await expect.poll(atEnd).toBe(true);
        // Scrolled up: counted on the button instead
        await log.evaluate((element) => (element.scrollTop = 0));
        await receive.click();
        await receive.click();
        const jump = page.getByRole('button', { name: 'Jump to new messages (2 new messages)' });
        await expect(jump).toBeVisible();
        await expect(log.getByText('New message 33')).not.toBeInViewport();
        await jump.click();
        await expect(log.getByText('New message 33')).toBeInViewport();
        await expect(log).toBeFocused();
        await expect(jump).toBeHidden();
    });

    test('the prompt sends with Enter and adds a line with Shift+Enter; the reply can be stopped', async ({ page }) => {
        await openStory(page, 'data-chat--playground');
        const field = page.getByRole('textbox', { name: 'Message' });
        await field.click();
        await page.keyboard.type('Line one');
        await page.keyboard.press('Shift+Enter');
        await page.keyboard.type('Line two');
        await page.keyboard.press('Enter');
        await expect(field).toHaveValue('');
        await expect(page.getByRole('log').getByText('Line one')).toBeVisible();
        const stop = page.getByRole('button', { name: 'Stop reply' });
        await expect(stop).toBeVisible();
        await stop.click();
        await expect(page.getByRole('button', { name: 'Send' })).toBeVisible();
        await expect(page.getByRole('log')).not.toHaveAttribute('aria-busy', 'true');
    });
});

test.describe('Editor menus', () => {
    test('Alt+F10 moves into the bubble menu at selected text; a tool formats, Escape returns', async ({ page }) => {
        await openStory(page, 'forms-editor--menus');
        const textbox = page.getByRole('textbox', { name: 'Note' });
        await expect(textbox).toHaveAttribute('aria-keyshortcuts', 'Alt+F10');
        await textbox.getByText(/Select text/).click();
        // One frame per key: under load ProseMirror could otherwise restore its selection over a native change
        await nextFrame(page);
        await page.keyboard.press('Home');
        for (let i = 0; i < 6; i++) {
            await nextFrame(page);
            await page.keyboard.press('Shift+ArrowRight');
        }
        await expect.poll(() => page.evaluate(() => String(getSelection()))).toBe('Select');
        const menu = page.getByRole('toolbar', { name: 'Format selection' });
        await expect(menu).toBeVisible();
        await page.keyboard.press('Alt+F10');
        await expect(menu.getByRole('button', { name: 'Bold' })).toBeFocused();
        await page.keyboard.press('ArrowRight');
        await expect(menu.getByRole('button', { name: 'Italic' })).toBeFocused();
        await page.keyboard.press('Enter');
        await expect(page.getByText('<em>Select</em>')).toBeVisible();
        await page.keyboard.press('Alt+F10');
        await page.keyboard.press('Escape');
        await expect(textbox).toBeFocused();
    });

    test('in an empty line the floating menu inserts blocks; "@" suggests people', async ({ page }) => {
        await openStory(page, 'forms-editor--menus');
        const textbox = page.getByRole('textbox', { name: 'Note' });
        await textbox.click();
        await page.keyboard.press('ControlOrMeta+End');
        const menu = page.getByRole('toolbar', { name: 'Insert block' });
        await expect(menu).toBeVisible();
        await page.keyboard.press('Alt+F10');
        await expect(menu.getByRole('button', { name: 'Heading', exact: true })).toBeFocused();
        await page.keyboard.press('Enter');
        await page.keyboard.type('Meetings with @cl');
        const list = page.getByRole('listbox', { name: 'Suggestions' });
        await expect(list.getByRole('option')).toHaveText(['Clara Weiß']);
        await expect(textbox).toHaveAttribute('aria-activedescendant', /mention0$/);
        await page.keyboard.press('Enter');
        await expect(list).toBeHidden();
        await expect(page.getByText(/<h2>Meetings with <span[^>]*data-type="mention"/)).toBeVisible();
    });
});

test.describe('Chart brush', () => {
    test('the range slider moves with the arrow keys and the table follows', async ({ page }) => {
        await openStory(page, 'data-barchart--range');
        const start = page.getByRole('slider', { name: /Start/ });
        await expect(start).toHaveAttribute('aria-valuetext', 'Apr');
        await start.focus();
        await page.keyboard.press('ArrowRight');
        await page.keyboard.press('ArrowRight');
        await expect(start).toHaveAttribute('aria-valuetext', 'Jun');
        await expect(page.getByText('Selection: Jun to Sep')).toBeVisible();
        await page.getByText('Data as table').click();
        const rows = page.getByRole('table', { name: 'Revenue by month' }).getByRole('row');
        await expect(rows).toHaveCount(5);
        await expect(rows.nth(1)).toContainText('Jun');
        const end = page.getByRole('slider', { name: /End/ });
        await end.focus();
        await page.keyboard.press('End');
        await expect(page.getByText('Selection: Jun to Dec')).toBeVisible();
    });
});

test.describe('CodeHighlightTabs', () => {
    test('arrow keys switch the files; the code is colored and the copy button follows', async ({ page }) => {
        await openStory(page, 'data-codehighlight--files');
        const tabs = page.getByRole('tablist', { name: 'Files' });
        await tabs.getByRole('tab', { name: 'App.vue' }).focus();
        await page.keyboard.press('ArrowRight');
        await nextFrame(page);
        const main = tabs.getByRole('tab', { name: 'main.ts' });
        await expect(main).toBeFocused();
        await expect(main).toHaveAttribute('aria-selected', 'true');
        const panel = page.getByRole('tabpanel', { name: 'main.ts' });
        await expect(panel).toContainText("import { createApp } from 'vue';");
        await expect(panel.locator('span[style*="--wc-code-token-keyword"]').first()).toBeVisible();
        await expect(page.getByRole('button', { name: 'Copy code: main.ts' })).toBeVisible();
        await page.keyboard.press('End');
        await expect(tabs.getByRole('tab', { name: 'Dockerfile' })).toHaveAttribute('aria-selected', 'true');
    });
});
