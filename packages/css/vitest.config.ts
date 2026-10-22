import { defineConfig } from 'vitest/config';

export default defineConfig({
    // Resolve workspace packages to their TypeScript sources
    resolve: { conditions: ['wirecore:source'] },
});
