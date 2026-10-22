import type { Meta, StoryObj } from '@storybook/react-native-web-vite';
import type { ChatMessageData } from '@wirecore/wirelayer-recipes/native';
import { Copy, FileText, Image } from 'lucide-react-native';
import { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import type { FilePicker } from '../FileUpload/types.js';
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
        attachments: [{ name: 'export-october.xlsx', size: 48213 }],
    },
    { id: 5, system: true, text: 'Ben Ott joined the chat', time: '2026-10-21T08:00:00' },
];

const answer =
    'The export fails because a column contains **formulas**. Here is how to fix it:\n\n1. Export the *Total* column as values\n2. Start the export again\n\nYou can find the details in the manual.';

// In an app: documentPicker() from @wirecore/wirelayer-native/expo-document-picker, imageLibraryPicker() from
// @wirecore/wirelayer-native/expo-image-picker. The story picks example files instead.
let picked = 0;
const pickers: FilePicker[] = [
    {
        kind: 'documents',
        icon: FileText,
        pick: async () => [{ uri: `file:///minutes-${++picked}.pdf`, name: `Minutes-${picked}.pdf`, size: 120_000 }],
    },
    {
        kind: 'photos',
        icon: Image,
        pick: async () => [
            { uri: `file:///screenshot-${++picked}.png`, name: `Screenshot-${picked}.png`, size: 840_000 },
        ],
    },
];

function Demo(args: ChatMessagesProps) {
    const [messages, setMessages] = useState<ChatMessageData[]>(args.messages);
    const [responding, setResponding] = useState(false);
    const timer = useRef<ReturnType<typeof setInterval>>(undefined);
    useEffect(() => () => clearInterval(timer.current), []);
    const stop = () => {
        clearInterval(timer.current);
        setResponding(false);
        setMessages((all) => all.map((message) => ({ ...message, streaming: false })));
    };
    const send = ({ text, files }: { text: string; files: { name: string; size?: number }[] }) => {
        const id = Date.now();
        setMessages((all) => [
            ...all,
            {
                id,
                own: true,
                text,
                time: new Date(),
                status: 'sent',
                attachments: files.map((file) => ({ name: file.name, size: file.size })),
            },
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
            if (done) {
                clearInterval(timer.current);
                setResponding(false);
            }
        }, 120);
    };
    return (
        <View className="h-[600px] gap-3">
            <ChatMessages {...args} messages={messages} />
            <ChatPrompt attachments pickers={pickers} responding={responding} onSubmit={send} onStop={stop} />
        </View>
    );
}

const meta = {
    title: 'Data/Chat',
    component: ChatMessages,
    args: { messages: history, now: '2026-10-21T12:00:00', groupWithin: 5, separators: true },
    argTypes: { messages: { control: false } },
    decorators: [(Story) => <View className="w-[360px]">{Story()}</View>],
    render: (args) => <Demo {...args} />,
} satisfies Meta<typeof ChatMessages>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * A chat: date lines, grouped messages, attachments; the prompt sends with the button (on the web also with Enter) –
 * a streamed reply follows, the stop button ends it. New messages of others are announced, a streamed one once it
 * is complete.
 */
export const Playground: Story = {};

/** Messages with avatar, time, status, attachments – and the collapsible extras of an answer */
export const Messages: Story = {
    name: 'Messages',
    render: () => (
        <View className="gap-4">
            <ChatMessage author="Anna Berg" time="2026-10-20T09:15:00" text="Here is the **report** for October." />
            <ChatMessage align="end" status="read" text="Thanks, I will take a look." time="2026-10-20T09:16:00" />
            <ChatMessage
                align="end"
                status="error"
                text="The attachment is too large."
                time="2026-10-20T09:17:00"
                attachments={[{ name: 'trade-fair-video.mov', size: 512_000_000 }]}
            />
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
        </View>
    ),
};

/** Tool calls while running, done and failed – opened at first */
export const ToolCalls: Story = {
    name: 'Tool calls',
    render: () => (
        <View className="gap-2">
            <ChatToolCall name="Get weather" status="running" input={{ location: 'Frankfurt' }} />
            <ChatToolCall
                name="Create ticket"
                status="done"
                defaultOpen
                input={{ title: 'Export fails', priority: 'high' }}
                output={{ ticket: 'WC-482' }}
            />
            <ChatToolCall name="Read file" status="error" defaultOpen output="Access denied" />
        </View>
    ),
};

const older: ChatMessageData[] = Array.from({ length: 24 }, (_, index) => ({
    id: index + 1,
    author: index % 3 ? 'Anna Berg' : 'Ben Ott',
    text: `Message ${index + 1}`,
    time: new Date(2026, 9, 19 + Math.floor(index / 8), 9, (index % 8) * 7),
}));

function LoadOlderDemo() {
    const [shown, setShown] = useState(older.slice(-8));
    const [loading, setLoading] = useState(false);
    return (
        <View className="h-[480px]">
            <ChatMessages
                messages={shown}
                now="2026-10-21T12:00:00"
                hasMore={shown.length < older.length}
                loading={loading}
                onLoadMore={() => {
                    setLoading(true);
                    setTimeout(() => {
                        setShown(older.slice(-(shown.length + 8)));
                        setLoading(false);
                    }, 600);
                }}
            />
        </View>
    );
}

/** Older messages load at the top – scrolling there or "Load older messages" */
export const LoadOlder: Story = { name: 'Load older', render: () => <LoadOlderDemo /> };

function IncomingDemo() {
    const [messages, setMessages] = useState(older);
    useEffect(() => {
        const timer = setInterval(
            () =>
                setMessages((all) => [
                    ...all,
                    {
                        id: all.length + 1,
                        author: 'Clara Weiß',
                        text: `New message ${all.length + 1}`,
                        time: new Date(2026, 9, 21, 11, all.length),
                    },
                ]),
            3000
        );
        return () => clearInterval(timer);
    }, []);
    return (
        <View className="h-[480px]">
            <ChatMessages messages={messages} now="2026-10-21T12:00:00" />
        </View>
    );
}

/** Every 3 seconds a message of Clara: scrolled up, a button counts them and leads to the end */
export const Incoming: Story = { name: 'New messages', render: () => <IncomingDemo /> };

/** No messages yet */
export const Empty: Story = {
    name: 'Empty',
    render: () => (
        <View className="h-[240px]">
            <ChatMessages messages={[]} />
        </View>
    ),
};

/** The prompt alone: growing field, attachments from two sources, disabled */
export const Prompt: Story = {
    name: 'Prompt',
    render: () => (
        <View className="gap-4">
            <ChatPrompt attachments pickers={pickers} placeholder="Ask about the project …" />
            <ChatPrompt disabled defaultValue="Locked while there is no connection" />
        </View>
    ),
};
