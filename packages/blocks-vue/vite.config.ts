import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { defaultClientConditions, defineConfig } from 'vite';
import pkg from './package.json' with { type: 'json' };

const external = [...Object.keys(pkg.dependencies), ...Object.keys(pkg.peerDependencies)];

export default defineConfig({
    plugins: [vue(), tailwindcss()],
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
        },
    },
});
