import react from '@vitejs/plugin-react';
import vue from '@vitejs/plugin-vue';
import { defaultClientConditions, defaultServerConditions } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [vue(), react()],
    resolve: {
        // Test the TypeScript sources of @wirecore/wirelayer-vue and @wirecore/wirelayer-react directly
        conditions: ['wirecore:source', ...defaultClientConditions],
    },
    // The same for the server-side rendering test (node environment)
    ssr: {
        resolve: { conditions: ['wirecore:source', ...defaultServerConditions] },
    },
    test: {
        environment: 'jsdom',
        setupFiles: ['./src/setup.ts'],
        include: ['src/**/*.test.ts'],
        // Each worker holds jsdom with Vue, React and Ark (~300 MB). The default (one per core) filled the memory on
        // many-core machines and stalled or timed out tests; parity.test.ts takes longest anyway, so more do not help
        maxWorkers: 6,
    },
});
