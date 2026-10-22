import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import { cases } from './cases.js';
import { el, frameworks, normalize, render } from './harness.js';

describe('Vue and React render the same DOM', () => {
    it.each(cases)('%s', async (_, node) => {
        expect(normalize(await render('vue', node))).toBe(normalize(await render('react', node)));
    });
});

const axeOptions: axe.RunOptions = {
    rules: {
        // jsdom has no layout/CSS – contrast is checked on the tokens and in the browser (pnpm a11y)
        'color-contrast': { enabled: false },
        // Components are tested in isolation, not as a full page with landmarks
        region: { enabled: false },
    },
};

describe.each(frameworks)('%s has no axe violations', (framework) => {
    it.each(cases)('%s', async (_, node) => {
        const { violations } = await axe.run(await render(framework, node), axeOptions);
        expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.html).join(', ')})`)).toEqual([]);
    });

    it('detects violations (sanity check)', async () => {
        const { violations } = await axe.run(await render(framework, el('Input', {})), axeOptions);
        expect(violations.map((v) => v.id)).toContain('label');
    });
});
