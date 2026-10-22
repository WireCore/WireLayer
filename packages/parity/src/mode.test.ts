import { modeScript } from '@wirecore/wirelayer-recipes';
import { afterEach, describe, expect, it, vi } from 'vitest';

// The inline <head> script of server-rendered apps sets data-mode before the first paint
describe('modeScript', () => {
    afterEach(() => {
        localStorage.clear();
        delete document.documentElement.dataset.mode;
        vi.unstubAllGlobals();
    });

    const run = (script: string) => new Function(script)();
    const prefersDark = (dark: boolean) =>
        vi.stubGlobal('matchMedia', (query: string) => ({ matches: dark && query.includes('dark') }));

    it('applies the stored mode', () => {
        prefersDark(false);
        localStorage.setItem('wirecore-mode', 'dark');
        run(modeScript());
        expect(document.documentElement.dataset.mode).toBe('dark');
    });

    it('falls back to the system preference', () => {
        prefersDark(true);
        run(modeScript());
        expect(document.documentElement.dataset.mode).toBe('dark');
        prefersDark(false);
        run(modeScript('other-key'));
        expect(document.documentElement.dataset.mode).toBe('light');
    });
});
