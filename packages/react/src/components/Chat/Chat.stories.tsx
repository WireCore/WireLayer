import type { Meta, StoryObj } from '@storybook/react-vite';
import type { ChatMessageData } from '@wirecore/wirelayer-recipes';
import { Copy } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { ChatMessage } from './ChatMessage.js';
import { ChatMessages, type ChatMessagesProps } from './ChatMessages.js';
import { ChatPrompt } from './ChatPrompt.js';
import { ChatSources } from './ChatSources.js';
import { ChatThinking } from './ChatThinking.js';
import { ChatToolCall } from './ChatToolCall.js';

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

function Demo(args: ChatMessagesProps) {
    const [messages, setMessages] = useState<ChatMessageData[]>(history);
    const [responding, setResponding] = useState(false);
    const timer = useRef<ReturnType<typeof setInterval>>(undefined);
    useEffect(() => () => clearInterval(timer.current), []);
    const stop = () => {
        clearInterval(timer.current);
        setResponding(false);
        setMessages((all) => all.map((message) => ({ ...message, streaming: false })));
    };
    const send = ({ text }: { text: string }) => {
        const id = Date.now();
        setMessages((all) => [
            ...all,
            { id, own: true, text, time: new Date(), status: 'sent' },
            { id: id + 1, author: 'Assistant', text: '', streaming: true, time: new Date() },
        ]);
        setResponding(true);
        const words = answer.split(' ');
        let count = 0;
        timer.current = setInterval(() => {
            count++;
            const done = count >= words.length;
            setMessages((all) =>
                all.map((message) =>
                    message.id === id + 1
                        ? { ...message, text: words.slice(0, count).join(' '), streaming: !done }
                        : message
                )
            );
            if (done) stop();
        }, 80);
    };
    return (
        <div className="flex h-[560px] max-w-2xl flex-col gap-3 rounded-xl border border-line p-3">
            <ChatMessages {...args} messages={messages} className="min-h-0 flex-1" />
            <ChatPrompt attachments responding={responding} onSubmit={send} onStop={stop} />
        </div>
    );
}

const meta = {
    title: 'Data/Chat',
    component: ChatMessages,
    args: { messages: history, now: '2026-10-21T12:00:00', groupWithin: 5, separators: true },
    parameters: { layout: 'padded' },
    render: (args) => <Demo {...args} />,
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
    render: () => (
        <div className="flex max-w-2xl flex-col gap-4">
            <ChatMessage author="Anna Berg" time="2026-10-20T09:15:00" text="Here is the **report** for October." />
            <ChatMessage align="end" status="read" text="Thanks, I will take a look." time="2026-10-20T09:16:00" />
            <ChatMessage align="center" text="Anna Berg left the chat" />
            <ChatMessage
                author="Assistant"
                text={
                    'According to the manual, the export runs **at night**:\n\n```bash\nwirecore export --nightly\n```'
                }
                before={
                    <>
                        <ChatThinking duration={4} text="First read the configuration, then check the schedule." />
                        <ChatToolCall
                            name="Read configuration"
                            input={{ file: 'export.yml' }}
                            output={{ schedule: '02:00' }}
                        />
                    </>
                }
                after={
                    <ChatSources
                        sources={[
                            {
                                title: 'Manual: Export',
                                href: 'https://docs.wirecore.de/export',
                                description: 'Chapter 4',
                            },
                            { title: 'Changelog 2.4', href: 'https://docs.wirecore.de/changelog' },
                        ]}
                    />
                }
                actions={<IconButton icon={Copy} label="Copy answer" size="sm" variant="text" />}
            />
            <ChatMessage author="Assistant" streaming before={<ChatThinking active />} />
        </div>
    ),
};

/** The prompt alone: growing field, attachments, hint */
export const Prompt: Story = {
    render: () => (
        <div className="max-w-2xl">
            <ChatPrompt attachments accept="image/*,.pdf" placeholder="Ask about the project …" />
        </div>
    ),
};

const many: ChatMessageData[] = Array.from({ length: 30 }, (_, index) => ({
    id: index + 1,
    author: index % 3 ? 'Anna Berg' : 'Ben Ott',
    text: `Message ${index + 1}`,
    time: new Date(2026, 9, 20, 9, index * 7),
}));

function LongDemo() {
    const [messages, setMessages] = useState(many);
    return (
        <div className="flex max-w-xl flex-col gap-3">
            <ChatMessages messages={messages} className="h-80 rounded-xl border border-line" />
            <Button
                size="sm"
                variant="outline"
                onClick={() =>
                    setMessages((all) => [
                        ...all,
                        {
                            id: all.length + 1,
                            author: 'Clara Weiß',
                            text: `New message ${all.length + 1}`,
                            time: new Date(),
                        },
                    ])
                }
            >
                Receive message from Clara
            </Button>
        </div>
    );
}

/** Scrolled up, new messages are counted on a button – at the end the list follows them */
export const LongHistory: Story = { render: () => <LongDemo /> };
