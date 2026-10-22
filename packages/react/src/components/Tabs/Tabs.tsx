import { Tabs as ArkTabs } from '@ark-ui/react/tabs';
import { closeTab, scrollEdges, tabs as tabsRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface TabsProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string | null) => void;
    /** Accessible name of the tab list */
    label?: string;
    /** Tab list above (default) or beside the panels */
    orientation?: 'horizontal' | 'vertical';
    /** `automatic`: arrow keys select (default); `manual`: arrow keys only move the focus, Enter/Space select */
    activationMode?: 'automatic' | 'manual';
    /** Renders a panel only once its tab was selected */
    lazyMount?: boolean;
    /** Removes a panel again when its tab is left */
    unmountOnExit?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

/** Tab panels: tab list with arrow keys, one panel visible */
export function Tabs({
    classes,
    value,
    defaultValue,
    onValueChange,
    label,
    orientation,
    activationMode,
    lazyMount,
    unmountOnExit,
    className,
    ...props
}: TabsProps) {
    const tabs = useRecipe('tabs', tabsRecipe, classes);
    const styles = tabs();
    return (
        <ArkTabs.Root
            {...props}
            className={styles.base({ class: className })}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(details) => onValueChange?.(details.value)}
            orientation={orientation}
            activationMode={activationMode}
            lazyMount={lazyMount}
            unmountOnExit={unmountOnExit}
            translations={label ? { listLabel: label } : undefined}
        />
    );
}

export interface TabsListProps extends ComponentProps<'div'> {
    /**
     * Scrolls when the tabs do not fit, with arrows at the sides while there is more (pointer only – the arrow keys
     * move between the tabs and scroll them into view)
     */
    scrollable?: boolean;
}

/** The row of tab buttons */
export function TabsList({ scrollable = false, className, children, ...props }: TabsListProps) {
    const tabs = useRecipe('tabs', tabsRecipe);
    const styles = tabs();
    const list = useRef<HTMLDivElement>(null);
    const [edges, setEdges] = useState({ start: false, end: false });
    const update = () => list.current && setEdges(scrollEdges(list.current));
    useEffect(() => {
        if (!scrollable || !list.current) return;
        update();
        const observer = new ResizeObserver(update);
        observer.observe(list.current);
        return () => observer.disconnect();
    }, [scrollable]);
    const scroll = (towardsEnd: boolean) => {
        const element = list.current;
        if (!element) return;
        const rtl = getComputedStyle(element).direction === 'rtl';
        const distance = element.clientWidth * 0.8 * (towardsEnd ? 1 : -1) * (rtl ? -1 : 1);
        const smooth = !matchMedia('(prefers-reduced-motion: reduce)').matches;
        element.scrollBy({ left: distance, behavior: smooth ? 'smooth' : 'auto' });
    };

    if (!scrollable) {
        return (
            <ArkTabs.List {...props} className={styles.list({ class: className })}>
                {children}
            </ArkTabs.List>
        );
    }
    return (
        <div className={styles.scroller()}>
            {edges.start && (
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    data-side="start"
                    className={styles.scrollButton()}
                    onClick={() => scroll(false)}
                >
                    <ChevronLeft className={styles.scrollIcon()} />
                </button>
            )}
            <ArkTabs.List
                {...props}
                ref={list}
                className={styles.list({ class: [styles.scrollList(), className] })}
                onScroll={(event) => {
                    update();
                    props.onScroll?.(event);
                }}
            >
                {children}
            </ArkTabs.List>
            {edges.end && (
                <button
                    type="button"
                    tabIndex={-1}
                    aria-hidden="true"
                    data-side="end"
                    className={styles.scrollButton()}
                    onClick={() => scroll(true)}
                >
                    <ChevronRight className={styles.scrollIcon()} />
                </button>
            )}
        </div>
    );
}

export interface TabsTriggerProps extends Omit<ComponentProps<'button'>, 'value'> {
    value: string;
    /** Icon component before the label */
    icon?: IconComponent;
    /**
     * Shows a close button (pointer) and closes with the Delete key; onClose reports it – remove the tab (and select
     * another one) yourself. The focus moves to the neighbouring tab
     */
    closable?: boolean;
    onClose?: (value: string) => void;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

/** One tab button */
export function TabsTrigger({
    classes,
    value,
    icon: Icon,
    disabled,
    closable = false,
    onClose,
    className,
    children,
    onKeyDown,
    ...props
}: TabsTriggerProps) {
    const tabs = useRecipe('tabs', tabsRecipe, classes);
    const styles = tabs({ closable });
    const trigger = (
        <ArkTabs.Trigger
            {...props}
            className={styles.trigger({ class: className })}
            value={value}
            disabled={disabled}
            {...(closable
                ? {
                      'aria-keyshortcuts': 'Delete',
                      onKeyDown: (event) => {
                          onKeyDown?.(event);
                          if (event.key !== 'Delete' || event.defaultPrevented || disabled) return;
                          event.preventDefault();
                          closeTab(event.currentTarget, () => onClose?.(value));
                      },
                  }
                : { onKeyDown })}
        >
            {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
            {children}
        </ArkTabs.Trigger>
    );
    if (!closable) return trigger;
    // The close button is not part of the tab (no button in a button): pointer only, Delete closes by keyboard
    return (
        <span role="presentation" className={styles.tab()}>
            {trigger}
            <button
                type="button"
                tabIndex={-1}
                aria-hidden="true"
                className={styles.close()}
                disabled={disabled}
                onClick={(event) => {
                    const tab = event.currentTarget.parentElement?.querySelector<HTMLElement>('[role=tab]');
                    if (tab) closeTab(tab, () => onClose?.(value));
                }}
            >
                <X className={styles.closeIcon()} />
            </button>
        </span>
    );
}

export interface TabsContentProps extends ComponentProps<'div'> {
    value: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof tabsRecipe>;
}

/** The panel of one tab */
export function TabsContent({ classes, value, className, ...props }: TabsContentProps) {
    const tabs = useRecipe('tabs', tabsRecipe, classes);
    const styles = tabs();
    return <ArkTabs.Content {...props} className={styles.content({ class: className })} value={value} />;
}
