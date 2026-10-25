import { Collapsible } from '@ark-ui/react/collapsible';
import { formatCount, sidebarNav as sidebarNavRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import { useContext, type CSSProperties, type MouseEvent, type ReactElement, type ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { AppShellRailContext } from '../AppShell/context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Tooltip } from '../Tooltip/Tooltip.js';

export interface SidebarNavItem {
    label: string;
    /** Link target; items with children are groups and have none */
    href?: string;
    icon?: IconComponent;
    /** The current page (aria-current="page"); its groups start open */
    current?: boolean;
    children?: SidebarNavItem[];
    /** Count or short text after the label (part of the link's name) */
    badge?: number | string;
}

export interface SidebarNavProps {
    items: readonly SidebarNavItem[];
    /** Name of the navigation landmark, e.g. "Main navigation" */
    label: string;
    /** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
    onNavigate?: (item: SidebarNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
    /**
     * Icons only, the labels as tooltips (and for screen readers). Default: the collapsed state of a surrounding
     * AppShell (navbarCollapsed)
     */
    rail?: boolean;
    /** With `rail`: hovering or focusing the rail shows the labels (no tooltips) – default from the AppShell */
    expandOnHover?: boolean;
    /** Above the links, e.g. a logo or a switcher */
    header?: ReactNode;
    /** Below the links, e.g. account or settings */
    footer?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof sidebarNavRecipe>;
}

const containsCurrent = (item: SidebarNavItem): boolean => !!item.current || !!item.children?.some(containsCurrent);

/** Navigation landmark with links and expandable groups (buttons with aria-expanded); optionally a rail of icons */
export function SidebarNav({
    classes,
    items,
    label,
    onNavigate,
    rail: railProp,
    expandOnHover: expandOnHoverProp,
    header,
    footer,
    className,
    style,
}: SidebarNavProps) {
    const sidebarNav = useRecipe('sidebarNav', sidebarNavRecipe, classes);
    const shell = useContext(AppShellRailContext);
    const rail = railProp ?? shell?.rail ?? false;
    const expandOnHover = rail && (expandOnHoverProp ?? shell?.expandOnHover ?? false);
    const styles = sidebarNav(rail ? { rail: true, expandOnHover } : undefined);
    return (
        <nav
            aria-label={label}
            className={styles.base({ class: className })}
            style={style}
            data-rail={rail ? '' : undefined}
        >
            {header && <div className={styles.header()}>{header}</div>}
            <ul className={styles.list()}>
                <Items items={items} depth={0} onNavigate={onNavigate} rail={rail} expandOnHover={expandOnHover} />
            </ul>
            {footer && <div className={styles.footer()}>{footer}</div>}
        </nav>
    );
}

function Items({
    items,
    depth,
    onNavigate,
    rail,
    expandOnHover,
}: {
    items: readonly SidebarNavItem[];
    depth: number;
    onNavigate?: SidebarNavProps['onNavigate'];
    rail: boolean;
    expandOnHover: boolean;
}) {
    const sidebarNav = useRecipe('sidebarNav', sidebarNavRecipe);
    const styles = sidebarNav(rail ? { rail: true, expandOnHover } : undefined);
    // In the rail the labels are tooltips (unless the rail expands on hover)
    const wrap = (label: string, node: ReactElement) =>
        rail && !expandOnHover ? (
            <Tooltip content={label} placement="right">
                {node}
            </Tooltip>
        ) : (
            node
        );
    return items.map((item) => {
        const Icon = item.icon;
        const indent = { '--depth': depth } as CSSProperties;
        const content = (
            <>
                {Icon ? (
                    <Icon className={styles.icon()} aria-hidden="true" />
                ) : (
                    rail && (
                        <span className={styles.monogram()} aria-hidden="true">
                            {item.label[0]}
                        </span>
                    )
                )}
                <span className={styles.label()}>{item.label}</span>
                {item.badge !== undefined && (
                    <span className={styles.badge()}>
                        {typeof item.badge === 'number' ? formatCount(item.badge) : item.badge}
                    </span>
                )}
            </>
        );
        return (
            <li key={item.label}>
                {item.children ? (
                    <Collapsible.Root defaultOpen={containsCurrent(item)}>
                        {wrap(
                            item.label,
                            <Collapsible.Trigger className={styles.link()} style={indent}>
                                {content}
                                <Collapsible.Indicator asChild>
                                    <ChevronRight className={styles.indicator()} aria-hidden="true" />
                                </Collapsible.Indicator>
                            </Collapsible.Trigger>
                        )}
                        <Collapsible.Content className={styles.content()}>
                            <ul className={styles.sublist()}>
                                <Items
                                    items={item.children}
                                    depth={depth + 1}
                                    onNavigate={onNavigate}
                                    rail={rail}
                                    expandOnHover={expandOnHover}
                                />
                            </ul>
                        </Collapsible.Content>
                    </Collapsible.Root>
                ) : (
                    wrap(
                        item.label,
                        <a
                            href={item.href}
                            className={styles.link()}
                            style={indent}
                            aria-current={item.current ? 'page' : undefined}
                            onClick={(event) => onNavigate?.(item, event)}
                        >
                            {content}
                        </a>
                    )
                )}
            </li>
        );
    });
}
