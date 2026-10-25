import {
    filterChips as filterChipsRecipe,
    filterPanel as filterPanelRecipe,
    visuallyHidden,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { SlidersHorizontal } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useMediaQuery } from '../../hooks/media.js';
import { Chip } from '../ChipGroup/Chip.js';
import { Collapse } from '../Collapse/Collapse.js';
import { Drawer, DrawerContent } from '../Drawer/Drawer.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface FilterChip {
    /** Key of the filter – passed to `onRemove` */
    id: string;
    /** Name of the filter, e.g. "Location" */
    label: string;
    /** The active value as text, e.g. "Frankfurt, Vienna" */
    value: string;
}

export interface FilterChipsProps extends ComponentProps<'ul'> {
    /** The active filters */
    filters: readonly FilterChip[];
    /** Accessible name of the list (default "Active filters") */
    label?: string;
    /** Text of the reset button (default "Reset all"); `false` hides it */
    resetLabel?: string | false;
    /** A chip's remove button */
    onRemove?: (id: string) => void;
    /** "Reset all" */
    onClear?: () => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof filterChipsRecipe>;
}

/** The active filters as a list of chips with remove buttons ("Remove filter Location: Frankfurt") */
export function FilterChips({
    classes,
    filters,
    label,
    resetLabel,
    onRemove,
    onClear,
    className,
    ...props
}: FilterChipsProps) {
    const filterChips = useRecipe('filterChips', filterChipsRecipe, classes);
    const t = useTranslations().filterChips;
    const styles = filterChips();
    const list = useRef<HTMLUListElement>(null);
    // After removing a chip the focus goes to the chip now in its place (or the one before, or the reset button)
    const refocus = useRef<number | null>(null);
    const count = filters.length;
    useEffect(() => {
        const index = refocus.current;
        if (index === null) return;
        refocus.current = null;
        const buttons = [...(list.current?.querySelectorAll<HTMLButtonElement>('button') ?? [])];
        (buttons[Math.min(index, Math.max(0, count - 1))] ?? buttons.at(-1))?.focus();
    }, [count]);
    if (!count) return null;
    return (
        <ul {...props} ref={list} className={styles.base({ class: className })} aria-label={label ?? t.label}>
            {filters.map((filter, index) => (
                <li key={filter.id} className={styles.item()}>
                    <Chip
                        label={`${filter.label}: ${filter.value}`}
                        removable
                        removeLabel={t.remove(`${filter.label}: ${filter.value}`)}
                        onRemove={() => {
                            refocus.current = index;
                            onRemove?.(filter.id);
                        }}
                    >
                        <span className={styles.name()}>{`${filter.label}:`}</span> {filter.value}
                    </Chip>
                </li>
            ))}
            {resetLabel !== false && (
                <li className={styles.item()}>
                    <button type="button" className={styles.reset()} onClick={onClear}>
                        {resetLabel ?? t.reset}
                    </button>
                </li>
            )}
        </ul>
    );
}

export interface FilterPanelProps extends ComponentProps<'section'> {
    /** The active filters – shown as chips and counted on the button */
    filters?: readonly FilterChip[];
    /** Number on the button (default: the number of filters) */
    count?: number;
    /** Form shown (controlled) */
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Name of the region, the button and the drawer (default "Filter") */
    label?: string;
    /**
     * `inline` (default): the form folds open below the bar; `drawer`: it opens in a drawer; `auto`: a drawer on small
     * screens (`drawerQuery`)
     */
    display?: 'inline' | 'drawer' | 'auto';
    /** When `auto` uses the drawer (default below 768px) */
    drawerQuery?: string;
    /** A chip's remove button */
    onRemove?: (id: string) => void;
    /** "Reset all" */
    onClear?: () => void;
    /** Content at the end of the bar, e.g. a sort select */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof filterPanelRecipe>;
}

/**
 * Filter region above a list or table: a button with the number of active filters opens the compact form (folding
 * open, or a drawer on small screens); the active filters as removable chips.
 */
export function FilterPanel({
    classes,
    filters = [],
    count,
    open,
    defaultOpen = false,
    onOpenChange,
    label,
    display = 'inline',
    drawerQuery = '(max-width: 767px)',
    onRemove,
    onClear,
    actions,
    className,
    children,
    ...props
}: FilterPanelProps) {
    const filterPanel = useRecipe('filterPanel', filterPanelRecipe, classes);
    const t = useTranslations().filterPanel;
    const styles = filterPanel();
    const id = useId();
    const [internal, setInternal] = useState(defaultOpen);
    const isOpen = open ?? internal;
    const narrow = useMediaQuery(drawerQuery);
    const asDrawer = display === 'drawer' || (display === 'auto' && narrow);
    const activeCount = count ?? filters.length;
    const name = label ?? t.label;
    const hidden = visuallyHidden();
    const setOpen = (next: boolean) => {
        setInternal(next);
        onOpenChange?.(next);
    };
    // Changes of the number of active filters are announced (not the first render)
    const [status, setStatus] = useState('');
    const [announced, setAnnounced] = useState(activeCount);
    if (announced !== activeCount) {
        setAnnounced(activeCount);
        setStatus(t.status(activeCount));
    }
    return (
        <section {...props} className={styles.base({ class: className })} aria-label={name}>
            <div className={styles.bar()}>
                <button
                    type="button"
                    className={styles.toggle()}
                    aria-expanded={isOpen}
                    aria-controls={asDrawer ? undefined : `${id}content`}
                    aria-haspopup={asDrawer ? 'dialog' : undefined}
                    onClick={() => setOpen(!isOpen)}
                >
                    <SlidersHorizontal className={styles.toggleIcon()} aria-hidden="true" />
                    {label ?? t.toggle}
                    {!!activeCount && (
                        <>
                            {' '}
                            <span className={styles.count()}>{activeCount}</span>{' '}
                            <span className={hidden}>{t.active}</span>
                        </>
                    )}
                </button>
                <FilterChips filters={filters} onRemove={onRemove} onClear={onClear} />
                {actions && <div className={styles.actions()}>{actions}</div>}
            </div>
            {asDrawer ? (
                <Drawer open={isOpen} onOpenChange={setOpen}>
                    <DrawerContent title={name} placement="right">
                        {children}
                    </DrawerContent>
                </Drawer>
            ) : (
                <Collapse id={`${id}content`} open={isOpen}>
                    <div className={styles.content()}>{children}</div>
                </Collapse>
            )}
            <span role="status" className={hidden}>
                {status}
            </span>
        </section>
    );
}
