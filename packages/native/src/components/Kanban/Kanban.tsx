import {
    kanban as kanbanRecipe,
    kanbanLimitState,
    moveBetween,
    moveItem,
    orderSteps,
    orderStepTarget,
    visuallyHidden,
    type ItemAccessor,
} from '@wirecore/wirelayer-recipes/native';
import { Check, ChevronLeft, ChevronRight, CircleAlert } from 'lucide-react-native';
import { useId, useRef, useState, type ComponentRef, type ReactNode } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { Icon } from '../../utils/Icon.js';
import { toggleOnSpace } from '../../utils/keyboard.js';
import { Sheet } from '../../utils/Sheet.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { IconButton } from '../IconButton/IconButton.js';
import { SortableList } from '../Sortable/Sortable.js';
import { focusSortableItem } from '../Sortable/store.js';
import type { KanbanColumn, KanbanMove } from './types.js';

export interface KanbanProps<T = unknown> {
    /** The columns with their cards (controlled) */
    columns?: KanbanColumn<T>[];
    defaultColumns?: KanbanColumn<T>[];
    onColumnsChange?: (columns: KanbanColumn<T>[]) => void;
    /** A card was put at another place: from/to column id and index */
    onMove?: (move: KanbanMove<T>) => void;
    /** The column's "Load more" button */
    onLoadMore?: (columnId: string) => void;
    /** A column was collapsed or expanded */
    onCollapse?: (columnId: string, collapsed: boolean) => void;
    /** Accessible name of the board (default "Board") */
    label?: string;
    /** Key of a card: property name or function (default `id`, else `value`) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of a card for its button and the announcements (default `label`, `name` or `title`) */
    itemLabel?: ItemAccessor<T, string>;
    /** Whether a card may move into a column */
    accepts?: (item: T, to: string, from: string) => boolean;
    disabled?: boolean;
    /** Heading level of the column titles (default h3) */
    titleTag?: 'h2' | 'h3' | 'h4';
    /** Content of a card (default: its text) */
    renderCard?: (item: T, state: { column: KanbanColumn<T>; index: number; grabbed: boolean }) => ReactNode;
    /** Below the cards of a column, e.g. a button to add a card */
    renderAdd?: (column: KanbanColumn<T>) => ReactNode;
    className?: string;
}

const levels = { h2: 2, h3: 3, h4: 4 } as const;
const steps = ['top', 'up', 'down', 'bottom'] as const;

/**
 * Kanban board: columns side by side in a horizontal scroll view. Every card has a button ("Move …") that
 * opens an action sheet – the columns as radio buttons, "Move up"/"Move down" …; the same moves are screen
 * reader actions of the card, and a long press on the button drags the card within its column. WIP limits show a
 * hint when reached or exceeded; columns collapse; every move is announced.
 */
export function Kanban<T = unknown>({
    columns,
    defaultColumns = [],
    onColumnsChange,
    onMove,
    onLoadMore,
    onCollapse,
    label,
    itemKey,
    itemLabel,
    accepts,
    disabled = false,
    titleTag = 'h3',
    renderCard,
    renderAdd,
    className,
}: KanbanProps<T>) {
    const translations = useTranslations();
    const t = translations.kanban;
    const baseId = useId();
    const [shown, setShown] = useControllable<KanbanColumn<T>[]>(columns, defaultColumns, onColumnsChange);
    const { announce, region } = useAnnouncer();
    const [collapsedOwn, setCollapsedOwn] = useState<Record<string, boolean>>({});
    const isCollapsed = (column: KanbanColumn<T>) => collapsedOwn[column.id] ?? !!column.collapsed;
    const listName = (columnId: string) => `${baseId}:${columnId}`;
    const labelOf = (item: T) => {
        if (typeof itemLabel === 'function') return itemLabel(item);
        if (typeof item !== 'object' || item === null) return String(item);
        const record = item as Record<string, unknown>;
        for (const key of itemLabel ? [itemLabel] : ['label', 'name', 'title'])
            if (record[key] !== undefined) return String(record[key]);
        return String(item);
    };
    const allowed = (item: T, to: string, from: string) => to === from || (accepts?.(item, to, from) ?? true);

    // Action sheet of a card: its column and place
    const [sheet, setSheet] = useState<{ column: string; index: number } | null>(null);
    // Where the focus goes once the action sheet has hidden (web)
    const [focusAfter, setFocusAfter] = useState<{ column: string; index: number } | null>(null);
    const current = () => shown;
    const commit = (next: KanbanColumn<T>[]) => setShown(next);
    const setItems = (columnId: string, items: T[]) =>
        commit(current().map((column) => (column.id === columnId ? { ...column, items } : column)));
    /** Moves a card (sheet, screen reader actions): announced, reported, the focus follows it */
    const moveCard = (fromId: string, index: number, toId: string, toIndex?: number) => {
        const all = current();
        const from = all.find((column) => column.id === fromId);
        const to = all.find((column) => column.id === toId);
        const item = from?.items[index];
        if (disabled || !from || !to || item === undefined || !allowed(item, toId, fromId)) return;
        let next: KanbanColumn<T>[];
        let position: number;
        if (from === to) {
            position = Math.max(0, Math.min(toIndex ?? from.items.length - 1, from.items.length - 1));
            if (position === index) return;
            const items = moveItem(from.items, index, position);
            next = all.map((column) => (column.id === fromId ? { ...column, items } : column));
            announce(translations.sortable.moved(labelOf(item), position + 1, items.length));
        } else {
            const moved = moveBetween(from.items, to.items, index, toIndex ?? to.items.length);
            position = Math.min(toIndex ?? to.items.length, moved.to.length - 1);
            next = all.map((column) =>
                column.id === fromId
                    ? { ...column, items: moved.from }
                    : column.id === toId
                      ? { ...column, items: moved.to }
                      : column
            );
            // The WIP hint of the target column is part of the announcement
            const count = moved.to.length;
            const limit = kanbanLimitState(count, to.limit);
            const hint =
                limit === 'over' ? t.limitExceeded(count, to.limit!) : limit === 'reached' ? t.limitReached : '';
            const text = translations.sortable.movedTo(labelOf(item), to.title, position + 1, count);
            announce(hint ? `${text} ${hint}` : text);
        }
        commit(next);
        onMove?.({ item, from: { column: fromId, index }, to: { column: toId, index: position } });
        // From the action sheet on the web: the modal hands the focus back to its trigger when it hides – the card's
        // new handle takes it once that is done (onHidden)
        if (sheet && Platform.OS === 'web') setFocusAfter({ column: toId, index: position });
        else focusSortableItem(listName(toId), position);
    };
    const toggle = (column: KanbanColumn<T>) => {
        const collapsed = !isCollapsed(column);
        setCollapsedOwn({ ...collapsedOwn, [column.id]: collapsed });
        onCollapse?.(column.id, collapsed);
    };

    const sheetColumn = sheet ? shown.find((column) => column.id === sheet.column) : undefined;
    const sheetIndex = sheet?.index ?? -1;
    const sheetItem = sheetColumn?.items[sheetIndex];
    const sheetSteps = sheetColumn ? orderSteps(sheetIndex, sheetColumn.items.length) : [];
    const checkedRadio = useRef<ComponentRef<typeof Pressable>>(null);
    const closeSheet = () => setSheet(null);
    const styles = kanbanRecipe();

    return (
        <View role="group" aria-label={label ?? t.label} className={styles.base({ class: className })}>
            <ScrollView horizontal contentContainerClassName={styles.board()} keyboardShouldPersistTaps="handled">
                {shown.map((column) => {
                    const count = column.items.length;
                    const state = kanbanLimitState(count, column.limit);
                    const collapsed = isCollapsed(column);
                    const parts = kanbanRecipe({ limitState: state, collapsed });
                    const titleId = `${baseId}${column.id}title`;
                    return (
                        <View key={column.id} role="group" aria-labelledby={titleId} className={parts.column()}>
                            <View className={parts.header()}>
                                <Text
                                    nativeID={titleId}
                                    role="heading"
                                    aria-level={levels[titleTag]}
                                    className={parts.title()}
                                >
                                    {column.title}
                                </Text>
                                <Text aria-hidden className={parts.count()}>
                                    {t.count(count, column.limit)}
                                </Text>
                                <Text className={visuallyHidden()}>{t.cards(count, column.limit)}</Text>
                                <IconButton
                                    icon={collapsed ? ChevronRight : ChevronLeft}
                                    label={collapsed ? t.expand(column.title) : t.collapse(column.title)}
                                    variant="text"
                                    hitSlop={2}
                                    aria-expanded={!collapsed}
                                    onPress={() => toggle(column)}
                                />
                            </View>
                            {!collapsed && (
                                <>
                                    {state !== 'within' && (
                                        <View className={parts.limit()}>
                                            <Icon icon={CircleAlert} className={parts.limitIcon()} />
                                            <Text className={parts.limitText()}>
                                                {state === 'over'
                                                    ? t.limitExceeded(count, column.limit!)
                                                    : t.limitReached}
                                            </Text>
                                        </View>
                                    )}
                                    <SortableList<T>
                                        value={column.items}
                                        name={listName(column.id)}
                                        aria-label={column.title}
                                        itemKey={itemKey}
                                        itemLabel={itemLabel}
                                        disabled={disabled}
                                        emptyText={t.empty}
                                        onValueChange={(items) => setItems(column.id, items)}
                                        onMove={(move) =>
                                            onMove?.({
                                                item: move.item,
                                                from: { column: column.id, index: move.from.index },
                                                to: { column: column.id, index: move.to.index },
                                            })
                                        }
                                        onHandlePress={(_, index) => setSheet({ column: column.id, index })}
                                        actions={(item) =>
                                            shown
                                                .filter(
                                                    (other) =>
                                                        other.id !== column.id && allowed(item, other.id, column.id)
                                                )
                                                .map((other) => ({
                                                    name: `column:${other.id}`,
                                                    label: t.moveTo(other.title),
                                                }))
                                        }
                                        onAction={(action, _, index) => {
                                            if (action.startsWith('column:'))
                                                moveCard(column.id, index, action.slice('column:'.length));
                                        }}
                                        renderItem={(item, { index, grabbed }) => (
                                            <View className={parts.card()}>
                                                {renderCard ? (
                                                    renderCard(item, { column, index, grabbed })
                                                ) : (
                                                    <Text className={parts.cardText()}>{labelOf(item)}</Text>
                                                )}
                                            </View>
                                        )}
                                    />
                                    {!!column.hasMore && (
                                        <Button
                                            variant="text"
                                            loading={column.loading}
                                            hitSlop={2}
                                            className={parts.more()}
                                            onPress={() => onLoadMore?.(column.id)}
                                        >
                                            {t.loadMore}
                                        </Button>
                                    )}
                                    {renderAdd?.(column)}
                                </>
                            )}
                        </View>
                    );
                })}
            </ScrollView>
            <Sheet
                open={sheetItem !== undefined}
                onClose={closeSheet}
                onHidden={() => {
                    if (!focusAfter) return;
                    focusSortableItem(listName(focusAfter.column), focusAfter.index);
                    setFocusAfter(null);
                }}
                title={sheetItem === undefined ? '' : translations.sortable.handle(labelOf(sheetItem))}
                closeLabel={translations.common.close}
                listRole="radiogroup"
                onShow={() => {
                    if (Platform.OS === 'web') checkedRadio.current?.focus();
                }}
                footer={steps.map((step) => (
                    <Button
                        key={step}
                        variant="outline"
                        disabled={!sheetSteps.includes(step)}
                        onPress={() => {
                            closeSheet();
                            if (sheetColumn)
                                moveCard(
                                    sheetColumn.id,
                                    sheetIndex,
                                    sheetColumn.id,
                                    orderStepTarget(step, sheetIndex, sheetColumn.items.length)
                                );
                        }}
                    >
                        {translations.orderList[step]}
                    </Button>
                ))}
            >
                {shown.map((column) => {
                    const checked = column.id === sheetColumn?.id;
                    const off =
                        !checked && (sheetItem === undefined || !allowed(sheetItem, column.id, sheetColumn!.id));
                    const parts = kanbanRecipe({ selected: checked });
                    const choose = () => {
                        closeSheet();
                        if (!checked && sheetColumn) moveCard(sheetColumn.id, sheetIndex, column.id);
                    };
                    return (
                        <Pressable
                            key={column.id}
                            ref={checked ? checkedRadio : undefined}
                            role="radio"
                            aria-checked={checked}
                            aria-label={t.moveTo(column.title)}
                            disabled={off}
                            aria-disabled={off || undefined}
                            className={parts.option()}
                            onPress={choose}
                            {...(off ? {} : toggleOnSpace(choose))}
                        >
                            <Text className={parts.optionText()}>{column.title}</Text>
                            <Text aria-hidden className={parts.optionCount()}>
                                {t.count(column.items.length, column.limit)}
                            </Text>
                            {checked && <Icon icon={Check} className={parts.optionCheck()} />}
                        </Pressable>
                    );
                })}
            </Sheet>
            {region}
        </View>
    );
}
