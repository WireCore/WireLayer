import type { Meta, StoryObj } from '@storybook/vue3-vite';
import Markdown from './Markdown.vue';

const source = `# Release 2.4

The update brings **faster exports**, *new filters* and ~~old~~ improved permissions. Details in the [manual](https://wirecore.de "Manual").

## New

- Export as \`xlsx\`
- Save filters
  - for teams, too
- [x] Migration done
- [ ] Complete the docs

> Please create a backup before the update.

| Area | Status | Effort |
| :--- | :---: | ---: |
| Export | done | 3 days |
| Filter | Testing | 5 days |

\`\`\`bash
docker compose pull && docker compose up -d
\`\`\`

<script>alert('shown as text')</script> and [no link](javascript:alert(1)).`;

const meta = {
    title: 'Data/Markdown',
    component: Markdown,
    args: { source, headingLevel: 2, breaks: false },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { Markdown },
        setup: () => ({ args }),
        template: `<Markdown v-bind="args" class="max-w-2xl" />`,
    }),
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Headings, lists, task lists, quotes, tables and code – HTML in the text stays text, unsafe links stay plain */
export const Playground: Story = {};

/** Code blocks rendered by your own component (e.g. CodeHighlight from @wirecore/wirelayer-vue/code) */
export const OwnCode: Story = {
    args: { source: 'Installation:\n\n```bash\npnpm add @wirecore/wirelayer-react\n```' },
    render: (args) => ({
        components: { Markdown },
        setup: () => ({ args }),
        template: `
            <Markdown v-bind="args" class="max-w-2xl">
                <template #code="{ language, code }">
                    <figure class="rounded-lg border border-line p-3">
                        <figcaption class="text-xs text-muted">{{ language }}</figcaption>
                        <pre class="m-0 font-mono text-sm">{{ code }}</pre>
                    </figure>
                </template>
            </Markdown>`,
    }),
};
