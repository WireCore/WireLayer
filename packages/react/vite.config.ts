import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { readdirSync } from 'node:fs';
import { defaultClientConditions, defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

// Each language of src/locales is its own entry (`locales/fr` → dist/locales/fr.js), so none of them is in index.js
const locales = Object.fromEntries(
    readdirSync(new URL('./src/locales', import.meta.url)).map((file) => [
        `locales/${file.replace(/\.ts$/, '')}`,
        `src/locales/${file}`,
    ])
);

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        // Resolve workspace packages to their TypeScript sources during development
        conditions: ['wirecore:source', ...defaultClientConditions],
    },
    build: {
        lib: {
            // Optional integrations (TanStack, Chart.js, Tiptap, Shiki, pdf.js) are separate entry points (subpath exports)
            entry: {
                index: 'src/index.ts',
                form: 'src/form/index.ts',
                'data-table': 'src/data-table/index.ts',
                virtual: 'src/virtual/index.ts',
                chart: 'src/chart/index.ts',
                editor: 'src/editor/index.ts',
                code: 'src/code/index.ts',
                pdf: 'src/pdf/index.ts',
                ...locales,
            },
            formats: ['es'],
            fileName: (_format, name) => `${name}.js`,
        },
        rolldownOptions: {
            external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            // Components use hooks – Next.js (App Router) must load them as client components
            output: { banner: "'use client';" },
        },
    },
});
