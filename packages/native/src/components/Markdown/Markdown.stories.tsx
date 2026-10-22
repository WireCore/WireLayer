import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import { View } from 'react-native';
import { Markdown } from './Markdown.js';

const source = `# Release 2.4

The customer portal gets **invoices as PDF** and a *new search*. Details in the [changelog](https://example.com/changelog).

## New

- Download invoices
- Search across all projects with \`Ctrl+K\`
- ~~Old export function~~ removed

## Open

- [x] Translations
- [ ] Accessibility test with VoiceOver

> Note: Maintenance runs on Saturday from 10 PM to midnight.

| Location | Status |
| --- | --- |
| Frankfurt | Online |
| Nuremberg | Maintenance |

\`\`\`json
{ "version": "2.4.0" }
\`\`\`
`;

const meta = {
    title: 'Data/Markdown',
    component: Markdown,
    args: { source },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
} satisfies Meta<typeof Markdown>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playground: Story = {};
