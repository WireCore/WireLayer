import { Collapsible } from '@ark-ui/react/collapsible';
import {
    formatCount,
    isCurrentLink,
    linkTarget,
    sidebarNav as sidebarNavRecipe,
    type LinkTo,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ChevronRight } from 'lucide-react';
import {
    type ComponentProps,
    useContext,
    type CSSProperties,
    type ElementType,
    type MouseEvent,
    type ReactElement,
    type ReactNode,
} from 'react';
import type { IconComponent } from '../../types.js';
import { AppShellRailContext } from '../AppShell/context.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Tooltip } from '../Tooltip/Tooltip.js';

export interface SidebarNavItem {
    label: string;
    /** Link target; items with children are groups and have none */
    href?: string;
    /** Router target, passed as `to` to `linkAs` instead of `href` (e.g. React Router or TanStack Link) */
    to?: LinkTo;
    icon?: IconComponent;
    /** The current page (aria-current="page"); its groups start open. Else `currentHref`/`isCurrent` decide */
    current?: boolean;
    children?: SidebarNavItem[];
    /** Count or short text after the label (part of the link's name) */
    badge?: number | string;
}

export interface SidebarNavProps extends ComponentProps<'nav'> {
    items: readonly SidebarNavItem[];
    /** Name of the navigation landmark, e.g. "Main navigation" */
    label: string;
    /** A link was clicked – call event.preventDefault() and route yourself in a single-page app (or use `linkAs`) */
    onNavigate?: (item: SidebarNavItem, event: MouseEvent<HTMLAnchorElement>) => void;
    /** Component for the links, e.g. Link of React Router or Next.js (gets `to` for items with `to`, else `href`); default <a> */
    linkAs?: ElementType;
    /** Path of the current page – the item with exactly this href gets aria-current="page" (its groups start open) */
    currentHref?: string;
    /** Own check for the current page, e.g. with the router */
    isCurrent?: (item: SidebarNavItem) => boolean;
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

/** Whether a link is the current page (its own `current`, else `isCurrent`, else `currentHref`) */
type CurrentCheck = (item: SidebarNavItem) => boolean;

const containsCurrent = (item: SidebarNavItem, check: CurrentCheck): boolean =>
    check(item) || !!item.children?.some((child) => containsCurrent(child, check));

/** Navigation landmark with links and expandable groups (buttons with aria-expanded); optionally a rail of icons */
export function SidebarNav({
    classes,
    items,
    label,
    onNavigate,
    linkAs = 'a',
    currentHref,
    isCurrent,
    rail: railProp,
    expandOnHover: expandOnHoverProp,
    header,
    footer,
    className,
    style,
    ...rest
}: SidebarNavProps) {
    const sidebarNav = useRecipe('sidebarNav', sidebarNavRecipe, classes);
    const shell = useContext(AppShellRailContext);
    const rail = railProp ?? shell?.rail ?? false;
    const expandOnHover = rail && (expandOnHoverProp ?? shell?.expandOnHover ?? false);
    const styles = sidebarNav(rail ? { rail: true, expandOnHover } : undefined);
    const check: CurrentCheck = (item) => isCurrentLink(item, currentHref, isCurrent);
    return (
        <nav
            {...rest}
            aria-label={label}
            className={styles.base({ class: className })}
            style={style}
            data-rail={rail ? '' : undefined}
        >
            {header && <div className={styles.header()}>{header}</div>}
            <ul className={styles.list()}>
                <Items
                    items={items}
                    depth={0}
                    onNavigate={onNavigate}
                    linkAs={linkAs}
                    check={check}
                    rail={rail}
                    expandOnHover={expandOnHover}
                />
            </ul>
            {footer && <div className={styles.footer()}>{footer}</div>}
        </nav>
    );
}

function Items({
    items,
    depth,
    onNavigate,
    linkAs: Link,
    check,
    rail,
    expandOnHover,
}: {
    items: readonly SidebarNavItem[];
    depth: number;
    onNavigate?: SidebarNavProps['onNavigate'];
    linkAs: ElementType;
    check: CurrentCheck;
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
                    <Collapsible.Root defaultOpen={containsCurrent(item, check)}>
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
                                    linkAs={Link}
                                    check={check}
                                    rail={rail}
                                    expandOnHover={expandOnHover}
                                />
                            </ul>
                        </Collapsible.Content>
                    </Collapsible.Root>
                ) : (
                    wrap(
                        item.label,
                        <Link
                            {...linkTarget(item.href, item.to)}
                            className={styles.link()}
                            style={indent}
                            aria-current={check(item) ? 'page' : undefined}
                            onClick={(event: MouseEvent<HTMLAnchorElement>) => onNavigate?.(item, event)}
                        >
                            {content}
                        </Link>
                    )
                )}
            </li>
        );
    });
}
