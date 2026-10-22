import { NavigationMenu, useNavigationMenu } from '@ark-ui/react/navigation-menu';
import {
    createHoverIntent,
    isCurrentLink,
    type HoverIntent,
    megaMenu as megaMenuRecipe,
    type BadgeVariant,
    type MegaMenuCollapse,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { ArrowRight, ChevronDown, Menu } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type ComponentProps,
    type ElementType,
    type KeyboardEvent,
    type MouseEvent,
    type PointerEvent,
    type ReactNode,
} from 'react';
import type { IconComponent } from '../../types.js';
import { Accordion, AccordionItem } from '../Accordion/Accordion.js';
import { Badge } from '../Badge/Badge.js';
import { Drawer, DrawerContent } from '../Drawer/Drawer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useLocale, useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

/** A link inside a panel */
export interface MegaMenuLink {
    label: string;
    href: string;
    /** Second line; linked to the link with aria-describedby */
    description?: string;
    icon?: IconComponent;
    /** Short text after the label, e.g. "New" (part of the link's name) */
    badge?: string;
    badgeVariant?: BadgeVariant;
    /** The current page (aria-current="page"); else `currentHref`/`isCurrent` decide */
    current?: boolean;
}

/** Links under a visible heading (the list is named by it) */
export interface MegaMenuGroup {
    title: string;
    items: MegaMenuLink[];
    /** "Show all" link below the group */
    moreHref?: string;
    moreLabel?: string;
}

export interface MegaMenuColumn {
    groups: MegaMenuGroup[];
}

/** Promotion or teaser beside the columns */
export interface MegaMenuFeatured {
    title: string;
    href: string;
    description?: string;
    /** Small line above the title, e.g. "New" or "Case study" */
    eyebrow?: string;
    image?: string;
    /** Alternative text of the image (default empty: decorative) */
    imageAlt?: string;
}

/** An entry of the top level: a link, a button with a panel, or both (link plus chevron button) */
export interface MegaMenuItem {
    label: string;
    /** Identifies the open panel (default: the label) */
    value?: string;
    /** Link of the entry; together with columns/featured it gets a separate chevron button for the panel */
    href?: string;
    current?: boolean;
    columns?: MegaMenuColumn[];
    featured?: MegaMenuFeatured;
    /** "Show all" at the bottom of the panel */
    allHref?: string;
    allLabel?: string;
}

export interface MegaMenuProps extends Omit<ComponentProps<'nav'>, 'dir'> {
    items: MegaMenuItem[];
    /** Name of the navigation landmark (default "Main navigation") */
    label?: string;
    /** click (default) or hover – hover opens after `openDelay` with the mouse only, never on touch */
    openOn?: 'click' | 'hover';
    /** Hover: delay before the first panel opens (ms, default 200) */
    openDelay?: number;
    /** Hover: delay before closing after the pointer left (ms, default 300) */
    closeDelay?: number;
    /** Arrow keys move between the entries and the links of a panel (default true); Tab always works */
    arrowKeys?: boolean;
    /** Entries in a row (default) or a column with the panels beside it */
    orientation?: 'horizontal' | 'vertical';
    /** Below which width the menu button with the drawer takes over: md, lg (default, 1024px), xl, container, never */
    collapse?: MegaMenuCollapse;
    /** Path of the current page – only the link with exactly this href gets aria-current="page" */
    currentHref?: string;
    /** Own check for the current page, e.g. with the router */
    isCurrent?: (link: MegaMenuLink | MegaMenuItem) => boolean;
    /** Level of the group headings (default 3) */
    headingLevel?: 2 | 3 | 4 | 5;
    /** Component for the links, e.g. a router link (gets `href`); default <a> */
    linkAs?: ElementType;
    /** Open panel (its value, '' for none) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    /** A link was clicked – call event.preventDefault() and route yourself in a single-page app */
    onNavigate?: (link: MegaMenuLink | MegaMenuItem | MegaMenuFeatured, event: MouseEvent<HTMLAnchorElement>) => void;
    /** Own content of the featured area of an entry */
    renderFeatured?: (item: MegaMenuItem) => ReactNode;
    /** Own content of a panel link (instead of icon, label, badge and description) */
    renderItem?: (link: MegaMenuLink) => ReactNode;
    /** Name of the menu button and title of the drawer (default "Menu") */
    menuLabel?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof megaMenuRecipe>;
}

const itemValue = (item: MegaMenuItem) => item.value ?? item.label;
const hasPanel = (item: MegaMenuItem) => !!item.columns?.length || !!item.featured;
const ARROWS = new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Home', 'End']);

/**
 * Website navigation (nav landmark, disclosure pattern – no menu roles): links, buttons with aria-expanded that open
 * a panel, or a link with its own chevron button. Panels hold headed groups of links (descriptions via
 * aria-describedby), badges and a featured area. Escape, a click outside, leaving with the focus and following a link
 * close it; one panel at a time. Below the breakpoint a menu button opens a drawer with accordions.
 */
export function MegaMenu({
    classes,
    items,
    label,
    openOn = 'click',
    openDelay = 200,
    closeDelay = 300,
    arrowKeys = true,
    orientation = 'horizontal',
    collapse,
    currentHref,
    isCurrent,
    headingLevel = 3,
    linkAs: Link = 'a',
    value,
    defaultValue,
    onValueChange,
    onNavigate,
    renderFeatured,
    renderItem,
    menuLabel,
    className,
    ...props
}: MegaMenuProps) {
    const megaMenu = useRecipe('megaMenu', megaMenuRecipe, classes);
    const styles = megaMenu({ orientation, collapse });
    const translations = useTranslations();
    const texts = translations.megaMenu;
    const { dir } = useLocale();
    const id = useId();
    const rootLabel = label ?? texts.rootLabel;

    const linkCurrent = (link: MegaMenuLink | MegaMenuItem) => isCurrentLink(link, currentHref, isCurrent);
    const sectionCurrent = (item: MegaMenuItem) =>
        !!item.columns?.some((column) => column.groups.some((group) => group.items.some(linkCurrent)));

    // The open panel: controlled (value) or our own
    const [internal, setInternal] = useState(defaultValue ?? '');
    const open = value ?? internal;
    // Latest values for the hover timers and Ark's callback (read in handlers, never while rendering)
    const latest = useRef({ open, openOn, openDelay, closeDelay, orientation, dir, onValueChange });
    useEffect(() => {
        latest.current = { open, openOn, openDelay, closeDelay, orientation, dir, onValueChange };
    });
    const setValue = (next: string) => {
        if (next === latest.current.open) return;
        latest.current.open = next;
        setInternal(next);
        latest.current.onValueChange?.(next);
    };

    // Hover: a click on an entry whose panel the pointer just opened keeps it open (instead of closing it again)
    const flags = useRef<{ hoverOpened?: string; pressed?: string }>({});
    const api = useNavigationMenu({
        value: open,
        orientation,
        disableHoverTrigger: true,
        translations: { rootLabel },
        onValueChange: (details) => {
            const { hoverOpened, pressed } = flags.current;
            flags.current.hoverOpened = undefined;
            if (details.value === '' && pressed && pressed === hoverOpened) return;
            setValue(details.value);
        },
    });
    const apiRef = useRef(api);
    useEffect(() => {
        apiRef.current = api;
    });
    const hover = useRef<HoverIntent | null>(null);
    useEffect(() => {
        const intent = createHoverIntent({
            value: () => latest.current.open,
            open: (next) => {
                flags.current.hoverOpened = next || undefined;
                setValue(next);
            },
            openDelay: () => latest.current.openDelay,
            closeDelay: () => latest.current.closeDelay,
            panel: (next) =>
                document
                    .getElementById(apiRef.current.getItemState({ value: next }).contentId)
                    ?.getBoundingClientRect() ?? null,
            side: () => (latest.current.orientation === 'vertical' ? 'end' : 'bottom'),
            rtl: () => latest.current.dir === 'rtl',
        });
        hover.current = intent;
        // The intent reads the latest values through refs
        return intent.cancel;
    }, []);
    const onPointer = (kind: 'enter' | 'move' | 'leave', item: MegaMenuItem, event: PointerEvent) => {
        if (latest.current.openOn !== 'hover' || event.pointerType !== 'mouse') return;
        hover.current?.[kind](hasPanel(item) ? itemValue(item) : '', { x: event.clientX, y: event.clientY });
    };
    const onPress = (item: MegaMenuItem) => {
        hover.current?.cancel();
        flags.current.pressed = itemValue(item);
    };
    // After Ark's click handler on the same trigger
    const onPressEnd = () => setTimeout(() => (flags.current.pressed = undefined));

    // Our own panel element: Ark's content closes when the pointer leaves it (also in click mode) and names it with
    // aria-labelledby (not allowed on a plain div) – both are left out
    const contentProps = (item: MegaMenuItem) => {
        const props = { ...(api.getContentProps({ value: itemValue(item) }) as ComponentProps<'div'>) };
        delete props.onPointerEnter;
        delete props.onPointerLeave;
        delete props['aria-labelledby'];
        return props;
    };

    // arrowKeys=false: the keys never reach Ark's handlers (Tab only, like plain links and buttons)
    const onKeyDownCapture = (event: KeyboardEvent<HTMLElement>) => {
        if (arrowKeys || !ARROWS.has(event.key)) return;
        if ((event.target as Element).closest('[data-scope=navigation-menu]:is([data-part=trigger], [data-part=link])'))
            event.stopPropagation();
    };

    // Small screens: menu button and drawer with one accordion section per entry
    const [drawerOpen, setDrawerOpen] = useState(false);
    const onDrawerLink = (
        link: MegaMenuLink | MegaMenuItem | MegaMenuFeatured,
        event: MouseEvent<HTMLAnchorElement>
    ) => {
        onNavigate?.(link, event);
        setDrawerOpen(false);
    };
    const Heading = `h${headingLevel}` as const;
    const SubHeading = `h${Math.min(headingLevel + 1, 6) as 3 | 4 | 5 | 6}` as const;
    const menuName = menuLabel ?? texts.menu;
    const navigate = (link: MegaMenuLink | MegaMenuItem | MegaMenuFeatured) => (event: MouseEvent<HTMLAnchorElement>) =>
        onNavigate?.(link, event);

    return (
        <NavigationMenu.RootProvider
            {...props}
            value={api}
            className={styles.base({ class: className })}
            onKeyDownCapture={onKeyDownCapture}
        >
            <NavigationMenu.List className={styles.list()}>
                {items.map((item, itemIndex) => (
                    <NavigationMenu.Item
                        key={itemValue(item)}
                        value={itemValue(item)}
                        className={styles.item()}
                        onPointerEnter={(event) => onPointer('enter', item, event)}
                        onPointerMove={(event) => onPointer('move', item, event)}
                        onPointerLeave={(event) => onPointer('leave', item, event)}
                    >
                        {hasPanel(item) ? (
                            <>
                                {item.href ? (
                                    <>
                                        <NavigationMenu.Link asChild current={linkCurrent(item)}>
                                            <Link href={item.href} className={styles.link()} onClick={navigate(item)}>
                                                {item.label}
                                            </Link>
                                        </NavigationMenu.Link>
                                        <NavigationMenu.Trigger
                                            className={styles.toggle()}
                                            aria-label={texts.submenu(item.label)}
                                            data-current={sectionCurrent(item) ? '' : undefined}
                                            onPointerDown={() => onPress(item)}
                                            onClick={onPressEnd}
                                        >
                                            <ChevronDown className={styles.triggerIcon()} aria-hidden="true" />
                                        </NavigationMenu.Trigger>
                                    </>
                                ) : (
                                    <NavigationMenu.Trigger
                                        className={styles.trigger()}
                                        data-current={sectionCurrent(item) ? '' : undefined}
                                        onPointerDown={() => onPress(item)}
                                        onClick={onPressEnd}
                                    >
                                        {item.label}
                                        <ChevronDown className={styles.triggerIcon()} aria-hidden="true" />
                                    </NavigationMenu.Trigger>
                                )}
                                <div {...contentProps(item)} className={styles.content()}>
                                    <div className={styles.body()}>
                                        {!!item.columns?.length && (
                                            <div className={styles.columns()}>
                                                {item.columns.map((column, columnIndex) => (
                                                    <div key={columnIndex} className={styles.column()}>
                                                        {column.groups.map((group, groupIndex) => {
                                                            const groupId = `${id}-${itemIndex}-${columnIndex}-${groupIndex}`;
                                                            return (
                                                                <div key={group.title} className={styles.group()}>
                                                                    <Heading
                                                                        id={groupId}
                                                                        className={styles.groupTitle()}
                                                                    >
                                                                        {group.title}
                                                                    </Heading>
                                                                    <ul
                                                                        className={styles.groupList()}
                                                                        aria-labelledby={groupId}
                                                                    >
                                                                        {group.items.map((link, linkIndex) => {
                                                                            const Icon = link.icon;
                                                                            const descriptionId = `${groupId}-${linkIndex}-d`;
                                                                            const described =
                                                                                !!link.description && !renderItem;
                                                                            return (
                                                                                <li key={link.href}>
                                                                                    <NavigationMenu.Link
                                                                                        asChild
                                                                                        current={linkCurrent(link)}
                                                                                    >
                                                                                        <Link
                                                                                            href={link.href}
                                                                                            className={styles.panelLink()}
                                                                                            // The description is no part of the name
                                                                                            aria-labelledby={
                                                                                                described
                                                                                                    ? `${groupId}-${linkIndex}-l`
                                                                                                    : undefined
                                                                                            }
                                                                                            aria-describedby={
                                                                                                described
                                                                                                    ? descriptionId
                                                                                                    : undefined
                                                                                            }
                                                                                            onClick={navigate(link)}
                                                                                        >
                                                                                            {renderItem ? (
                                                                                                renderItem(link)
                                                                                            ) : (
                                                                                                <>
                                                                                                    {Icon && (
                                                                                                        <Icon
                                                                                                            className={styles.panelIcon()}
                                                                                                            aria-hidden="true"
                                                                                                        />
                                                                                                    )}
                                                                                                    <span
                                                                                                        className={styles.panelText()}
                                                                                                    >
                                                                                                        <span
                                                                                                            id={`${groupId}-${linkIndex}-l`}
                                                                                                            className={styles.panelLabel()}
                                                                                                        >
                                                                                                            {link.label}
                                                                                                            {link.badge && (
                                                                                                                <Badge
                                                                                                                    variant={
                                                                                                                        link.badgeVariant
                                                                                                                    }
                                                                                                                >
                                                                                                                    {
                                                                                                                        link.badge
                                                                                                                    }
                                                                                                                </Badge>
                                                                                                            )}
                                                                                                        </span>
                                                                                                        {link.description && (
                                                                                                            <span
                                                                                                                id={
                                                                                                                    descriptionId
                                                                                                                }
                                                                                                                className={styles.panelDescription()}
                                                                                                            >
                                                                                                                {
                                                                                                                    link.description
                                                                                                                }
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </span>
                                                                                                </>
                                                                                            )}
                                                                                        </Link>
                                                                                    </NavigationMenu.Link>
                                                                                </li>
                                                                            );
                                                                        })}
                                                                    </ul>
                                                                    {group.moreHref && (
                                                                        <NavigationMenu.Link asChild>
                                                                            <Link
                                                                                href={group.moreHref}
                                                                                className={styles.more()}
                                                                                aria-label={
                                                                                    group.moreLabel
                                                                                        ? undefined
                                                                                        : texts.showAllOf(group.title)
                                                                                }
                                                                                onClick={navigate({
                                                                                    label:
                                                                                        group.moreLabel ??
                                                                                        texts.showAll,
                                                                                    href: group.moreHref,
                                                                                })}
                                                                            >
                                                                                {group.moreLabel ?? texts.showAll}
                                                                                <ArrowRight
                                                                                    className={styles.moreIcon()}
                                                                                    aria-hidden="true"
                                                                                />
                                                                            </Link>
                                                                        </NavigationMenu.Link>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {item.featured && (
                                            <div className={styles.featured()}>
                                                {renderFeatured ? (
                                                    renderFeatured(item)
                                                ) : (
                                                    <>
                                                        {item.featured.image && (
                                                            <img
                                                                src={item.featured.image}
                                                                alt={item.featured.imageAlt ?? ''}
                                                                className={styles.featuredImage()}
                                                            />
                                                        )}
                                                        {item.featured.eyebrow && (
                                                            <p className={styles.featuredEyebrow()}>
                                                                {item.featured.eyebrow}
                                                            </p>
                                                        )}
                                                        <NavigationMenu.Link asChild>
                                                            <Link
                                                                href={item.featured.href}
                                                                className={styles.featuredTitle()}
                                                                onClick={navigate(item.featured)}
                                                            >
                                                                {item.featured.title}
                                                            </Link>
                                                        </NavigationMenu.Link>
                                                        {item.featured.description && (
                                                            <p className={styles.featuredDescription()}>
                                                                {item.featured.description}
                                                            </p>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    {item.allHref && (
                                        <div className={styles.footer()}>
                                            <NavigationMenu.Link asChild>
                                                <Link
                                                    href={item.allHref}
                                                    className={styles.more()}
                                                    onClick={navigate({
                                                        label: item.allLabel ?? texts.showAll,
                                                        href: item.allHref,
                                                    })}
                                                >
                                                    {item.allLabel ?? texts.showAll}
                                                    <ArrowRight className={styles.moreIcon()} aria-hidden="true" />
                                                </Link>
                                            </NavigationMenu.Link>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            <NavigationMenu.Link asChild current={linkCurrent(item)}>
                                <Link href={item.href} className={styles.link()} onClick={navigate(item)}>
                                    {item.label}
                                </Link>
                            </NavigationMenu.Link>
                        )}
                    </NavigationMenu.Item>
                ))}
            </NavigationMenu.List>
            {collapse !== 'never' && (
                <>
                    <IconButton
                        icon={Menu}
                        label={menuName}
                        variant="text"
                        className={styles.burger()}
                        aria-haspopup="dialog"
                        aria-expanded={drawerOpen}
                        onClick={() => setDrawerOpen(true)}
                    />
                    <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
                        <DrawerContent title={menuName} placement="right">
                            <nav aria-label={rootLabel} className={styles.mobileNav()}>
                                <Accordion
                                    multiple
                                    defaultValue={items
                                        .filter((item) => hasPanel(item) && sectionCurrent(item))
                                        .map(itemValue)}
                                >
                                    {items.map((item, itemIndex) =>
                                        hasPanel(item) ? (
                                            <AccordionItem
                                                key={itemValue(item)}
                                                value={itemValue(item)}
                                                title={item.label}
                                                headingLevel={headingLevel}
                                            >
                                                {item.href && (
                                                    <Link
                                                        href={item.href}
                                                        className={styles.mobilePanelLink()}
                                                        aria-current={linkCurrent(item) ? 'page' : undefined}
                                                        onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                                            onDrawerLink(item, event)
                                                        }
                                                    >
                                                        {texts.overview(item.label)}
                                                    </Link>
                                                )}
                                                {(item.columns?.flatMap((column) => column.groups) ?? []).map(
                                                    (group, groupIndex) => {
                                                        const groupId = `${id}-m-${itemIndex}-${groupIndex}`;
                                                        return (
                                                            <div key={group.title} className={styles.mobileGroup()}>
                                                                <SubHeading
                                                                    id={groupId}
                                                                    className={styles.mobileGroupTitle()}
                                                                >
                                                                    {group.title}
                                                                </SubHeading>
                                                                <ul
                                                                    className={styles.groupList()}
                                                                    aria-labelledby={groupId}
                                                                >
                                                                    {group.items.map((link) => {
                                                                        const Icon = link.icon;
                                                                        return (
                                                                            <li key={link.href}>
                                                                                <Link
                                                                                    href={link.href}
                                                                                    className={styles.mobilePanelLink()}
                                                                                    aria-current={
                                                                                        linkCurrent(link)
                                                                                            ? 'page'
                                                                                            : undefined
                                                                                    }
                                                                                    onClick={(
                                                                                        event: MouseEvent<HTMLAnchorElement>
                                                                                    ) => onDrawerLink(link, event)}
                                                                                >
                                                                                    {Icon && (
                                                                                        <Icon
                                                                                            className={styles.panelIcon()}
                                                                                            aria-hidden="true"
                                                                                        />
                                                                                    )}
                                                                                    {link.label}
                                                                                    {link.badge && (
                                                                                        <Badge
                                                                                            variant={link.badgeVariant}
                                                                                        >
                                                                                            {link.badge}
                                                                                        </Badge>
                                                                                    )}
                                                                                </Link>
                                                                            </li>
                                                                        );
                                                                    })}
                                                                </ul>
                                                                {group.moreHref && (
                                                                    <Link
                                                                        href={group.moreHref}
                                                                        className={styles.more()}
                                                                        aria-label={
                                                                            group.moreLabel
                                                                                ? undefined
                                                                                : texts.showAllOf(group.title)
                                                                        }
                                                                        onClick={(
                                                                            event: MouseEvent<HTMLAnchorElement>
                                                                        ) =>
                                                                            onDrawerLink(
                                                                                {
                                                                                    label: group.title,
                                                                                    href: group.moreHref!,
                                                                                },
                                                                                event
                                                                            )
                                                                        }
                                                                    >
                                                                        {group.moreLabel ?? texts.showAll}
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        );
                                                    }
                                                )}
                                                {item.featured && (
                                                    <Link
                                                        href={item.featured.href}
                                                        className={styles.mobilePanelLink()}
                                                        onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                                            onDrawerLink(item.featured!, event)
                                                        }
                                                    >
                                                        {item.featured.title}
                                                    </Link>
                                                )}
                                                {item.allHref && (
                                                    <Link
                                                        href={item.allHref}
                                                        className={styles.more()}
                                                        onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                                            onDrawerLink(
                                                                { label: item.label, href: item.allHref! },
                                                                event
                                                            )
                                                        }
                                                    >
                                                        {item.allLabel ?? texts.showAll}
                                                    </Link>
                                                )}
                                            </AccordionItem>
                                        ) : (
                                            <Link
                                                key={itemValue(item)}
                                                href={item.href}
                                                className={styles.mobileLink()}
                                                aria-current={linkCurrent(item) ? 'page' : undefined}
                                                onClick={(event: MouseEvent<HTMLAnchorElement>) =>
                                                    onDrawerLink(item, event)
                                                }
                                            >
                                                {item.label}
                                            </Link>
                                        )
                                    )}
                                </Accordion>
                            </nav>
                        </DrawerContent>
                    </Drawer>
                </>
            )}
        </NavigationMenu.RootProvider>
    );
}
