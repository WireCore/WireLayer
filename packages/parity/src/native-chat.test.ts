import {
    chatAnnouncements,
    chatAnnouncementText,
    chatDayText,
    chatListChange,
    chatStreamingState,
    commandGroups,
    filterCommands,
    type ChatMessageData,
} from '@wirecore/wirelayer-recipes';
import { describe, expect, it } from 'vitest';

// Shared logic of the React Native chat and tool components (@wirecore/wirelayer-native) – framework-neutral in @wirecore/wirelayer-recipes

const message = (id: number, extra: Partial<ChatMessageData> = {}): ChatMessageData => ({
    id,
    text: `Message ${id}`,
    author: 'Anna',
    ...extra,
});

describe('chat list', () => {
    it('date lines say today and yesterday when now is known, otherwise the full date', () => {
        const texts = { locale: 'de-DE', today: 'Heute', yesterday: 'Gestern' };
        const now = '2026-10-21T12:00:00';
        expect(chatDayText(new Date('2026-10-21T08:00:00'), { ...texts, now })).toBe('Heute');
        expect(chatDayText(new Date('2026-10-20T23:59:00'), { ...texts, now })).toBe('Gestern');
        expect(chatDayText(new Date('2026-10-19T09:00:00'), { ...texts, now })).toBe('Montag, 19. Oktober 2026');
        expect(chatDayText(new Date('2026-10-21T08:00:00'), texts)).toBe('Mittwoch, 21. Oktober 2026');
    });

    it('counts new messages at the end; older ones at the top are no new messages', () => {
        const list = [message(2), message(3)];
        expect(chatListChange(list, [...list, message(4), message(5)])).toEqual({ prepended: false, added: 2 });
        expect(chatListChange(list, [message(1), ...list])).toEqual({ prepended: true, added: 0 });
        expect(chatListChange([], list)).toEqual({ prepended: false, added: 2 });
        expect(chatListChange(list, list)).toEqual({ prepended: false, added: 0 });
    });

    it('announces new messages of others and streamed ones once they are complete', () => {
        const before = chatStreamingState([
            message(1),
            message(2, { streaming: true }),
            message(3, { streaming: true }),
        ]);
        const after = [
            message(1),
            message(2),
            message(3, { streaming: true }),
            message(4),
            message(5, { own: true }),
            message(6, { streaming: true }),
        ];
        expect(chatAnnouncements(before, after).map((entry) => entry.id)).toEqual([2, 4]);
    });

    it('announces the plain text of the Markdown, cut when it is long', () => {
        expect(chatAnnouncementText('This is **important**')).toBe('This is important');
        expect(chatAnnouncementText('**not** converted', false)).toBe('**not** converted');
        expect(chatAnnouncementText('a'.repeat(10), true, 4)).toBe('aaaa …');
    });
});

describe('command palette', () => {
    const items = [
        { value: 'home', label: 'Übersicht', group: 'Pages' },
        { value: 'servers', label: 'Server', group: 'Pages', keywords: ['Hosting'] },
        { value: 'new', label: 'Create server', group: 'Actions' },
        { value: 'logout', label: 'Sign out' },
    ];

    it('finds label and keywords without case and accents; without a query all items', () => {
        expect(filterCommands(items, 'uber').map((item) => item.value)).toEqual(['home']);
        expect(filterCommands(items, 'host').map((item) => item.value)).toEqual(['servers']);
        expect(filterCommands(items, 'SERVER').map((item) => item.value)).toEqual(['servers', 'new']);
        expect(filterCommands(items, '  ')).toHaveLength(4);
        expect(filterCommands(items, '', { limit: 2 })).toHaveLength(2);
    });

    it('ranks by an own score, filter false keeps the items as they are', () => {
        const score = (item: { value: string }) => (item.value === 'new' ? 2 : item.value === 'servers' ? 1 : 0);
        expect(filterCommands(items, 'x', { filter: score }).map((item) => item.value)).toEqual(['new', 'servers']);
        expect(filterCommands(items, 'x', { filter: false, limit: 3 })).toHaveLength(3);
    });

    it('groups the items in the order the groups first appear', () => {
        expect(commandGroups(items).map((group) => [group.group, group.items.length])).toEqual([
            ['Pages', 2],
            ['Actions', 1],
            ['', 1],
        ]);
    });
});
