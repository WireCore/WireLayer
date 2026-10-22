import type { Meta, StoryObj } from '@storybook/vue3-vite';
import CodeHighlight from './CodeHighlight.vue';
import CodeHighlightTabs from './CodeHighlightTabs.vue';

const meta = {
    title: 'Data/CodeHighlight',
    component: CodeHighlight,
    args: {
        code: `import { DataTable } from '@wirecore/wirelayer-vue/data-table';

// All servers, sorted by load
const servers = await api.get('/server');
const columns = [
    { id: 'name', header: 'Name', sortable: true },
    { id: 'load', header: 'Load', align: 'end' },
];

export default { components: { DataTable }, data: () => ({ servers, columns }) };`,
        language: 'ts',
        title: 'server.ts',
        lineNumbers: true,
        highlightLines: [4, 5],
        copyable: true,
    },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { CodeHighlight },
        setup: () => ({ args }),
        template: `<CodeHighlight v-bind="args" class="max-w-2xl" />`,
    }),
} satisfies Meta<typeof CodeHighlight>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

/** Shell commands without line numbers */
export const Terminal: Story = {
    args: {
        code: `docker compose run --rm workspace pnpm add @wirecore/wirelayer-vue\ndocker compose up -d`,
        language: 'bash',
        title: undefined,
        lineNumbers: false,
        highlightLines: [],
    },
};

/** File name with an icon by type (the language follows from it) and a button for line wrapping */
export const FileName: Story = {
    args: {
        title: undefined,
        language: undefined,
        fileName: 'docker-compose.yml',
        wrapToggle: true,
        lineNumbers: false,
        highlightLines: [],
        code: `services:\n    web:\n        image: ghcr.io/wirecore/customer-portal:2.4.1 # The version comes from the CI pipeline and is bumped automatically with every release\n        ports: ['8080:80']`,
    },
};

/** Added and removed lines of a patch (marked for screen readers, too) */
export const Diff: Story = {
    args: {
        title: undefined,
        fileName: 'Editor.vue.patch',
        language: 'diff',
        diff: true,
        lineNumbers: false,
        highlightLines: [],
        code: `--- a/Editor.vue\n+++ b/Editor.vue\n@@ -1,3 +1,3 @@\n-const toolbar = defaultTools;\n+const toolbar = [...defaultTools, 'source'];\n export default toolbar;`,
    },
};

/** Long code is cut off and opens with a button */
export const LongCode: Story = {
    args: {
        maxHeight: '10rem',
        expandable: true,
        highlightLines: [],
        code: Array.from({ length: 30 }, (_, index) => `console.log('Line ${index + 1}');`).join('\n'),
        title: 'log.ts',
    },
};

/** Several files as tabs (arrow keys switch) */
export const Files: Story = {
    render: () => ({
        components: { CodeHighlightTabs },
        setup: () => ({
            files: [
                {
                    name: 'App.vue',
                    code: `<script setup lang="ts">\nimport { Button } from '@wirecore/wirelayer-vue';\n</script>\n\n<template>\n    <Button>Save</Button>\n</template>`,
                },
                {
                    name: 'main.ts',
                    code: `import { createApp } from 'vue';\nimport App from './App.vue';\n\ncreateApp(App).mount('#app');`,
                },
                { name: 'styles.css', code: `@import 'tailwindcss';\n@import '@wirecore/wirelayer-vue/styles.css';` },
                { name: 'Dockerfile', code: 'FROM node:26-alpine\nRUN corepack enable' },
            ],
        }),
        template: `<CodeHighlightTabs class="max-w-2xl" line-numbers :files="files" />`,
    }),
};
