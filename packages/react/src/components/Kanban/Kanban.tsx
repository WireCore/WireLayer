import {
    kanban as kanbanRecipe,
    kanbanLimitState,
    type ItemAccessor,
    type RecipeClasses,
    type SortableMove,
} from '@wirecore/wirelayer-recipes';
import { ChevronLeft, CircleAlert } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { useLocale } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Sortable } from '../Sortable/Sortable.js';
import type { KanbanColumn, KanbanMove } from './types.js';

export interface KanbanProps<T = unknown> extends Omit<ComponentProps<'div'>, 'children' | 'onChange'> {
    /** The columns with their cards (controlled) */
    columns?: KanbanColumn<T>[];
    defaultColumns?: KanbanColumn<T>[];
    onColumnsChange?: (columns: KanbanColumn<T>[]) => void;
    /** A card was dropped at another place: from/to column id and index */
    onMove?: (move: KanbanMove<T>) => void;
    /** The column's "Load more" button */
    onLoadMore?: (columnId: string) => void;
    /** A column was collapsed or expanded */
    onCollapse?: (columnId: string, collapsed: boolean) => void;
    /** Accessible name of the board (default "Board") */
    label?: string;
    /** Key of a card: property name or function (default `id`, else `value`) */
    itemKey?: ItemAccessor<T, string | number>;
    /** Text of a card for its handle and the announcements (default `label`, `name` or `title`) */
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
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof kanbanRecipe>;
}

/**
 * Kanban board: each column is a sortable list of one group – cards move with the pointer, with Space and the arrow
 * keys (left/right into the next column) or with two clicks; every step is announced.
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
    disabled,
    titleTag: Title = 'h3',
    renderCard,
    renderAdd,
    classes,
    className,
    ...props
}: KanbanProps<T>) {
    const kanban = useRecipe('kanban', kanbanRecipe, classes);
    const t = useLocale().translations.kanban;
    const baseId = useId();
    const [internal, setInternal] = useState<KanbanColumn<T>[]>(defaultColumns);
    const shown = columns ?? internal;
    // Moving between columns sets two lists one after the other – the second builds on the first
    const pending = useRef<KanbanColumn<T>[] | null>(null);
    const latest = useRef({ shown, onColumnsChange });
    useEffect(() => {
        latest.current = { shown, onColumnsChange };
        pending.current = null;
    });
    const [collapsedOwn, setCollapsedOwn] = useState<Record<string, boolean>>({});
    const isCollapsed = (column: KanbanColumn<T>) => collapsedOwn[column.id] ?? !!column.collapsed;
    const listName = (column: KanbanColumn<T>) => `${baseId}-${column.id}`;
    const columnOf = (name: string) => name.slice(baseId.length + 1);
    const labelOf = (item: T) => {
        if (typeof itemLabel === 'function') return itemLabel(item);
        if (typeof item !== 'object' || item === null) return String(item);
        const record = item as Record<string, unknown>;
        for (const key of itemLabel ? [itemLabel] : ['label', 'name', 'title'])
            if (record[key] !== undefined) return String(record[key]);
        return String(item);
    };

    const setItems = (id: string, items: T[]) => {
        const next = (pending.current ?? latest.current.shown).map((column) =>
            column.id === id ? { ...column, items } : column
        );
        pending.current = next;
        setInternal(next);
        latest.current.onColumnsChange?.(next);
    };
    const handleMove = (move: SortableMove<T>) =>
        onMove?.({
            item: move.item,
            from: { column: columnOf(move.from.container), index: move.from.index },
            to: { column: columnOf(move.to.container), index: move.to.index },
        });
    const toggle = (column: KanbanColumn<T>) => {
        const collapsed = !isCollapsed(column);
        setCollapsedOwn({ ...collapsedOwn, [column.id]: collapsed });
        onCollapse?.(column.id, collapsed);
    };

    return (
        <div {...props} className={kanban().base({ class: className })} role="group" aria-label={label ?? t.label}>
            {shown.map((column) => {
                const state = kanbanLimitState(column.items.length, column.limit);
                const styles = kanban({ limitState: state });
                const collapsed = isCollapsed(column);
                const titleId = `${baseId}${column.id}title`;
                return (
                    <section
                        key={column.id}
                        className={styles.column()}
                        aria-labelledby={titleId}
                        data-collapsed={collapsed || undefined}
                        data-limit={state}
                    >
                        <div className={styles.header()}>
                            {!collapsed && (
                                <Title id={titleId} className={styles.title()}>
                                    {column.title}
                                </Title>
                            )}
                            {!collapsed && (
                                <span className={styles.count()} title={t.cards(column.items.length, column.limit)}>
                                    <span aria-hidden="true">{t.count(column.items.length, column.limit)}</span>
                                    <span className={styles.srOnly()}>
                                        {t.cards(column.items.length, column.limit)}
                                    </span>
                                </span>
                            )}
                            <button
                                type="button"
                                className={styles.collapse()}
                                aria-expanded={!collapsed}
                                aria-controls={collapsed ? undefined : `${baseId}${column.id}body`}
                                aria-label={collapsed ? t.expand(column.title) : t.collapse(column.title)}
                                onClick={() => toggle(column)}
                            >
                                <ChevronLeft className={styles.collapseIcon()} aria-hidden="true" />
                            </button>
                        </div>
                        {collapsed ? (
                            <Title id={titleId} className={styles.collapsedTitle()}>
                                {`${column.title} (${t.count(column.items.length, column.limit)})`}
                            </Title>
                        ) : (
                            <div id={`${baseId}${column.id}body`} className={styles.footer()}>
                                {(state === 'reached' || state === 'over') && (
                                    <p className={styles.limit()} role="status">
                                        <CircleAlert className={styles.limitIcon()} aria-hidden="true" />
                                        {state === 'over'
                                            ? t.limitExceeded(column.items.length, column.limit!)
                                            : t.limitReached}
                                    </p>
                                )}
                                <Sortable<T>
                                    value={column.items}
                                    name={listName(column)}
                                    group={baseId}
                                    label={column.title}
                                    itemKey={itemKey}
                                    itemLabel={itemLabel}
                                    accepts={
                                        accepts ? (item, from) => accepts(item, column.id, columnOf(from)) : undefined
                                    }
                                    disabled={disabled}
                                    emptyText={t.empty}
                                    classes={{ label: styles.srOnly(), list: styles.list() }}
                                    onValueChange={(items) => setItems(column.id, items)}
                                    onMove={handleMove}
                                    renderItem={(item, { index, grabbed }) => (
                                        <div className={styles.card()}>
                                            {renderCard ? renderCard(item, { column, index, grabbed }) : labelOf(item)}
                                        </div>
                                    )}
                                />
                                {column.hasMore && (
                                    <Button
                                        size="sm"
                                        variant="text"
                                        loading={column.loading}
                                        className={styles.more()}
                                        onClick={() => onLoadMore?.(column.id)}
                                    >
                                        {t.loadMore}
                                    </Button>
                                )}
                                {renderAdd?.(column)}
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
}
