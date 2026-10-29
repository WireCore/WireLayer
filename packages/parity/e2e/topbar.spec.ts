import { expect, test, type Locator } from '@playwright/test';
import { openStory } from './story.ts';

/** What sets two triggers in a bar apart: size, border and a ring (box-shadow) – once the hover transition is done */
const look = (element: Locator) =>
    element.evaluate(async (node) => {
        // transition-colors runs also with reduced motion: a value read in between differs from run to run
        await Promise.all(node.getAnimations().map((animation) => animation.finished));
        const style = getComputedStyle(node);
        return {
            size: `${style.width} × ${style.height}`,
            border: `${style.borderTopWidth} ${style.borderTopColor}`,
            shadow: style.boxShadow,
        };
    });

test.describe('TopBar', () => {
    test('the app switcher (IconButton) and the user menu (Avatar as button) look and hover alike', async ({
        page,
    }) => {
        await openStory(page, 'layout-topbar--app-switcher-and-user-menu');
        const apps = page.getByRole('button', { name: 'Apps' });
        const avatar = page.getByRole('button', { name: 'Julia Klein' });
        expect(await look(avatar)).toEqual(await look(apps));

        await apps.hover();
        const hovered = await look(apps);
        await avatar.hover();
        expect(await look(avatar)).toEqual(hovered);
        // Outline: the border darkens, no ring
        expect(hovered.shadow).toBe('none');
    });
});
