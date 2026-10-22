/** A column of the Kanban board */
export interface KanbanColumn<T = unknown> {
    id: string;
    title: string;
    items: T[];
    /** WIP limit: the number of cards is shown against it; reaching or exceeding it shows a hint (nothing blocked) */
    limit?: number;
    /** Collapsed at first (the board keeps the state afterwards and calls onCollapse) */
    collapsed?: boolean;
    /** More cards can be loaded: a button below the cards calls onLoadMore with the column id */
    hasMore?: boolean;
    /** More cards are loading */
    loading?: boolean;
}

/** A card moved: from and to which column (id) and index */
export interface KanbanMove<T = unknown> {
    item: T;
    from: { column: string; index: number };
    to: { column: string; index: number };
}
