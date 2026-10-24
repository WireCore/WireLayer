// With styles-core.css an app imports the classes per component; a missing import warns once in development.
// Its own file: the check runs once per recipe, the renders of other tests would have used it up.
import { checkRecipeSources } from '@wirecore/wirelayer-recipes';
import { afterEach, expect, it, vi } from 'vitest';

const style = document.head.appendChild(document.createElement('style'));
const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
afterEach(() => warn.mockClear());

it('does not warn with styles.css (all classes)', () => {
    checkRecipeSources('badge');
    expect(warn).not.toHaveBeenCalled();
});

it('warns once per recipe whose sources file is missing with styles-core.css', () => {
    // styles-core.css and sources/card.css
    style.textContent = ':root { --wc-recipe-sources: 1; --wc-recipe-card: 1; }';
    checkRecipeSources('card');
    checkRecipeSources('chip');
    checkRecipeSources('chip');
    expect(warn.mock.calls).toEqual([[expect.stringContaining('"chip"')]]);
    expect(warn.mock.calls[0]![0]).toContain('@wirecore/wirelayer-recipes/sources/chip.css');
});
