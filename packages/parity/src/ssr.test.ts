// @vitest-environment node
// Nuxt and Next render on the server: every component must render without a DOM (no window/document access
// during render) and produce markup (or nothing, like an idle ConfirmDialog).
import { renderToString as renderReact } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { createSSRApp } from 'vue';
import { renderToString as renderVue } from 'vue/server-renderer';
import { cases } from './cases.js';
import { toReact, toVue } from './harness.js';

describe('server-side rendering', () => {
    it.each(cases)('%s', async (_, node) => {
        expect(typeof document).toBe('undefined');
        expect(await renderVue(createSSRApp({ render: () => toVue(node) }))).toMatch(/^(<|$)/);
        expect(renderReact(toReact(node))).toMatch(/^(<|$)/);
    });
});
