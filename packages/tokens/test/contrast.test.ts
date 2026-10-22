import { describe, expect, it } from 'vitest';
import { checkTheme, contrastPairs, defineTheme, modes, resolveColors, themes } from '../src/index.js';

describe.each(themes)('theme $name', (theme) => {
    describe.each(modes)('%s mode', (mode) => {
        it.each(contrastPairs(resolveColors(theme, mode)).map((result) => [result.name, result] as const))(
            '%s',
            (_, { ratio, min }) => {
                expect(ratio, `${ratio.toFixed(2)}:1 < ${min}:1`).toBeGreaterThanOrEqual(min);
            }
        );
    });
});

describe('checkTheme', () => {
    it('reports the pairs a custom theme misses', () => {
        const pale = defineTheme({
            name: 'pale',
            label: 'Pale',
            colors: { light: { primary: '#BBBBBB' }, dark: {} },
        });
        const failures = checkTheme(pale).map((failure) => `${failure.mode}: ${failure.name}`);
        expect(failures).toContain('light: primary: text-on-primary on bg-primary');
        expect(failures).toContain('light: selected/focus primary on bg');
    });
});
