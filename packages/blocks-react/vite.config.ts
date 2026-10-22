import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defaultClientConditions, defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
    plugins: [react(), tailwindcss()],
    resolve: {
        // Resolve workspace packages to their TypeScript sources during development
        conditions: ['wirecore:source', ...defaultClientConditions],
    },
    build: {
        lib: {
            entry: 'src/index.ts',
            formats: ['es'],
            fileName: 'index',
        },
        rolldownOptions: {
            external: (id) => external.some((dep) => id === dep || id.startsWith(`${dep}/`)),
            // Components use hooks – Next.js (App Router) must load them as client components
            output: { banner: "'use client';" },
        },
    },
});
