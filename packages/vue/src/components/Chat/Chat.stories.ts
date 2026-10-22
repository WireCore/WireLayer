import { Copy } from '@lucide/vue';
import type { Meta, StoryObj } from '@storybook/vue3-vite';
import type { ChatMessageData } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, ref, type ConcreteComponent } from 'vue';
import Button from '../Button/Button.vue';
import IconButton from '../IconButton/IconButton.vue';
import ChatMessage from './ChatMessage.vue';
import ChatMessagesComponent from './ChatMessages.vue';
import ChatPrompt from './ChatPrompt.vue';
import ChatSources from './ChatSources.vue';
import ChatThinking from './ChatThinking.vue';
import ChatToolCall from './ChatToolCall.vue';

// Generic component: Storybook's Vue types can't infer args here
const ChatMessages = ChatMessagesComponent as unknown as ConcreteComponent;

const history: ChatMessageData[] = [
    { id: 1, author: 'Anna Berg', text: 'Hi! How can I help?', time: '2026-10-20T09:00:00' },
    { id: 2, own: true, text: 'The export to Excel fails.', time: '2026-10-20T09:02:00', status: 'read' },
    {
        id: 3,
        author: 'Anna Berg',
        text: 'Thanks! Can you send me the file?',
        time: '2026-10-20T09:03:00',
    },
    {
        id: 4,
        own: true,
        text: 'Sure, here you go:',
        time: '2026-10-20T09:05:00',
        status: 'read',
        attachments: [{ name: 'export-october.xlsx', href: '#', size: 48213 }],
    },
    { id: 5, system: true, text: 'Ben Ott joined the chat', time: '2026-10-21T08:00:00' },
];

const answer =
    'The export fails because a column contains **formulas**. Here is how to fix it:\n\n1. Export the *Total* column as values\n2. Start the export again\n\nYou can find the details in the manual.';

const meta = {
    title: 'Data/Chat',
    component: ChatMessages,
    args: { messages: history, now: '2026-10-21T12:00:00', groupWithin: 5, separators: true },
    parameters: { layout: 'padded' },
    render: (args) => ({
        components: { ChatMessages, ChatPrompt },
        setup: () => {
            const messages = ref<ChatMessageData[]>([...history]);
            const responding = ref(false);
            let timer: ReturnType<typeof setInterval> | undefined;
            onBeforeUnmount(() => clearInterval(timer));
            const stop = () => {
                clearInterval(timer);
                responding.value = false;
                messages.value = messages.value.map((message) => ({ ...message, streaming: false }));
            };
            const send = ({ text }: { text: string }) => {
                const id = Date.now();
                messages.value = [
                    ...messages.value,
                    { id, own: true, text, time: new Date(), status: 'sent' },
                    { id: id + 1, author: 'Assistant', text: '', streaming: true, time: new Date() },
                ];
                responding.value = true;
                const words = answer.split(' ');
                let count = 0;
                timer = setInterval(() => {
                    count++;
                    const done = count >= words.length;
                    messages.value = messages.value.map((message) =>
                        message.id === id + 1
                            ? { ...message, text: words.slice(0, count).join(' '), streaming: !done }
                            : message
                    );
                    if (done) stop();
                }, 80);
            };
            return { args, messages, responding, send, stop };
        },
        template: `
            <div class="flex h-[560px] max-w-2xl flex-col gap-3 rounded-xl border border-line p-3">
                <ChatMessages v-bind="args" :messages="messages" class="min-h-0 flex-1" />
                <ChatPrompt attachments :responding="responding" @submit="send" @stop="stop" />
            </div>`,
    }),
} satisfies Meta<typeof ChatMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A chat: the list is a log (new messages of others are announced, a streamed reply once it is complete), the prompt
 * sends with Enter (Shift+Enter: new line) and stops the reply while it is being written
 */
export const Playground: Story = {};

/** Messages with avatar, time, status, attachments – and the collapsible extras of an answer */
export const Messages: Story = {
    render: () => ({
        components: { ChatMessage, ChatSources, ChatThinking, ChatToolCall, IconButton },
        setup: () => ({
            Copy,
            code: 'According to the manual, the export runs **at night**:\n\n```bash\nwirecore export --nightly\n```',
            sources: [
                { title: 'Manual: Export', href: 'https://docs.wirecore.de/export', description: 'Chapter 4' },
                { title: 'Changelog 2.4', href: 'https://docs.wirecore.de/changelog' },
            ],
        }),
        template: `
            <div class="flex max-w-2xl flex-col gap-4">
                <ChatMessage author="Anna Berg" time="2026-10-20T09:15:00" text="Here is the **report** for October." />
                <ChatMessage align="end" status="read" text="Thanks, I will take a look." time="2026-10-20T09:16:00" />
                <ChatMessage align="center" text="Anna Berg left the chat" />
                <ChatMessage author="Assistant" :text="code">
                    <template #before>
                        <ChatThinking :duration="4" text="First read the configuration, then check the schedule." />
                        <ChatToolCall name="Read configuration" :input="{ file: 'export.yml' }" :output="{ schedule: '02:00' }" />
                    </template>
                    <template #after><ChatSources :sources="sources" /></template>
                    <template #actions><IconButton :icon="Copy" label="Copy answer" size="sm" variant="text" /></template>
                </ChatMessage>
                <ChatMessage author="Assistant" streaming>
                    <template #before><ChatThinking active /></template>
                </ChatMessage>
            </div>`,
    }),
};

/** The prompt alone: growing field, attachments, hint */
export const Prompt: Story = {
    render: () => ({
        components: { ChatPrompt },
        template: `<div class="max-w-2xl"><ChatPrompt attachments accept="image/*,.pdf" placeholder="Ask about the project …" /></div>`,
    }),
};

const many: ChatMessageData[] = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    author: index % 3 ? 'Anna Berg' : 'Ben Ott',
    text: `Message ${index + 1}`,
    time: new Date(2026, 9, 20, 9, index * 7),
}));

/** Scrolled up, new messages are counted on a button – at the end the list follows them */
export const LongHistory: Story = {
    render: () => ({
        components: { Button, ChatMessages },
        setup: () => {
            const messages = ref([...many]);
            const receive = () =>
                (messages.value = [
                    ...messages.value,
                    {
                        id: messages.value.length + 1,
                        author: 'Clara Weiß',
                        text: `New message ${messages.value.length + 1}`,
                        time: new Date(),
                    },
                ]);
            return { messages, receive };
        },
        template: `
            <div class="flex max-w-xl flex-col gap-3">
                <ChatMessages :messages="messages" class="h-80 rounded-xl border border-line" />
                <Button size="sm" variant="outline" @click="receive">Receive message from Clara</Button>
            </div>`,
    }),
};
