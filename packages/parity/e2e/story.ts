import { expect, type Locator, type Page } from '@playwright/test';

/** Opens a story in isolation (no Storybook UI), so Tab starts at the component. */
export async function openStory(
    page: Page,
    id: string,
    mode: 'light' | 'dark' = 'dark',
    theme = 'wirecore',
    locale = 'en-US'
) {
    await page.goto(`/iframe.html?id=${id}&viewMode=story&globals=mode:${mode};theme:${theme};locale:${locale}`);
    await page.locator('#storybook-root > *').first().waitFor();
    // Ark registers its keyboard/focus-visible listeners on mount – wait until everything is loaded
    await page.waitForLoadState('networkidle');
}

/**
 * Waits two frames. Ark's menus finish a highlight change in the next frame – a key pressed within that frame
 * (only automation is that fast) can leave the focus on <body> when the menu closes.
 */
export const nextFrame = (page: Page) =>
    page.evaluate(() => new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done))));

/** Waits until the focus is inside the element – overlays take it a moment after they appear */
export const focusWithin = (element: Locator) =>
    expect.poll(() => element.evaluate((el) => el.contains(document.activeElement))).toBe(true);
