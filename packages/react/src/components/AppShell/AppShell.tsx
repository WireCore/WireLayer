import {
    appShell as appShellRecipe,
    clampSize,
    headroomHidden,
    resizeForKey,
    writeStored,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Menu, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import {
    useEffect,
    useId,
    useRef,
    useState,
    type CSSProperties,
    type KeyboardEvent,
    type PointerEvent,
    type ReactNode,
} from 'react';
import { AppShellRailContext } from './context.js';
import { parseStored, useStoredText } from '../../storage.js';
import { Drawer, DrawerContent } from '../Drawer/Drawer.js';
import { IconButton } from '../IconButton/IconButton.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { SkipLinks, type SkipLink } from '../SkipLinks/SkipLinks.js';

export interface AppShellProps {
    header?: ReactNode;
    /** Side navigation; on small screens it opens as a drawer */
    navbar?: ReactNode;
    aside?: ReactNode;
    /** Page footer (contentinfo) below the main area */
    footer?: ReactNode;
    children: ReactNode;
    navbarOpen?: boolean;
    onNavbarOpenChange?: (open: boolean) => void;
    /** Title of the drawer and name of the button that opens it */
    navbarLabel?: string;
    skipLinkLabel?: string;
    /**
     * Further skip links after the one to the main area, e.g. [{ href: '#search', label: 'Skip to search' }] –
     * then rendered as a named list (SkipLinks)
     */
    skipLinks?: SkipLink[];
    /** The navbar is a rail of icons on the desktop (a SidebarNav inside shows tooltips) */
    navbarCollapsed?: boolean;
    onNavbarCollapsedChange?: (collapsed: boolean) => void;
    /** A button in the header folds and unfolds the navbar (desktop) */
    collapsible?: boolean;
    /** With navbarCollapsed: the rail opens over the main area while hovered or focused */
    navbarExpandOnHover?: boolean;
    /** The navbar width can be changed with a handle (drag, arrow keys, Home/End, double click resets) */
    navbarResizable?: boolean;
    /** The aside width can be changed the same way */
    asideResizable?: boolean;
    /** Width of the navbar in px (default 256) */
    navbarWidth?: number;
    onNavbarWidthChange?: (width: number) => void;
    /** Width of the aside in px (default 288) */
    asideWidth?: number;
    onAsideWidthChange?: (width: number) => void;
    /** Limits for resizing (px) */
    navbarMinWidth?: number;
    navbarMaxWidth?: number;
    asideMinWidth?: number;
    asideMaxWidth?: number;
    /** Remembers widths and the rail state in localStorage under this key */
    storageKey?: string;
    /** The header slides away while scrolling down and comes back when scrolling up */
    headroom?: boolean;
    /** `header-first` (default): the header spans everything; `navbar-first`: the navbar runs the full height */
    layout?: 'header-first' | 'navbar-first';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof appShellRecipe>;
}

const NAVBAR_WIDTH = 256;
const ASIDE_WIDTH = 288;
type Side = 'navbar' | 'aside';
interface Stored {
    navbarWidth?: number;
    asideWidth?: number;
    navbarCollapsed?: boolean;
}
const rtlOf = (element: Element) => getComputedStyle(element).direction === 'rtl';

/** Handle between navbar or aside and the main area (window splitter pattern): value = width in px */
function ResizeHandle({
    side,
    label,
    controls,
    width,
    limits,
    className,
    onResize,
    onReset,
}: {
    side: Side;
    label: string;
    controls: string;
    width: number;
    limits: { min: number; max: number };
    className: string;
    onResize: (width: number) => void;
    onReset: () => void;
}) {
    const drag = useRef<{ x: number; width: number; sign: number } | null>(null);
    const [dragging, setDragging] = useState(false);
    const stop = () => {
        drag.current = null;
        setDragging(false);
    };
    return (
        <div
            role="separator"
            aria-orientation="vertical"
            tabIndex={0}
            aria-label={label}
            aria-controls={controls}
            aria-valuenow={width}
            aria-valuemin={limits.min}
            aria-valuemax={limits.max}
            data-side={side}
            data-dragging={dragging ? '' : undefined}
            className={className}
            // The navbar grows towards the inline end, the aside towards the start
            onKeyDown={(event: KeyboardEvent<HTMLDivElement>) => {
                const towardsEnd = (side === 'navbar') !== rtlOf(event.currentTarget);
                const next = resizeForKey(
                    event.key,
                    event.shiftKey,
                    width,
                    limits,
                    towardsEnd ? 'ArrowRight' : 'ArrowLeft'
                );
                if (next === undefined) return;
                event.preventDefault();
                onResize(next);
            }}
            onPointerDown={(event: PointerEvent<HTMLDivElement>) => {
                if (event.button !== 0) return;
                event.currentTarget.setPointerCapture(event.pointerId);
                const sign = (side === 'navbar') !== rtlOf(event.currentTarget) ? 1 : -1;
                drag.current = { x: event.clientX, width, sign };
                setDragging(true);
                event.preventDefault();
            }}
            onPointerMove={(event: PointerEvent<HTMLDivElement>) => {
                const current = drag.current;
                if (current) onResize(clampSize(current.width + (event.clientX - current.x) * current.sign, limits));
            }}
            onPointerUp={stop}
            onPointerCancel={stop}
            onDoubleClick={onReset}
        />
    );
}

/**
 * App frame with landmarks: skip link, header (banner), side navigation (from lg on; below a drawer behind the
 * menu button), main (target of the skip link), an optional aside (from xl on) and footer. Optional: rail, resize
 * handles (role="separator"), headroom header, navbar running the full height.
 */
export function AppShell({
    classes,
    header,
    navbar,
    aside,
    footer,
    children,
    navbarOpen,
    onNavbarOpenChange,
    navbarLabel: navbarLabelProp,
    skipLinkLabel: skipLinkLabelProp,
    skipLinks,
    navbarCollapsed,
    onNavbarCollapsedChange,
    collapsible,
    navbarExpandOnHover,
    navbarResizable,
    asideResizable,
    navbarWidth: navbarWidthProp,
    onNavbarWidthChange,
    asideWidth: asideWidthProp,
    onAsideWidthChange,
    navbarMinWidth = 200,
    navbarMaxWidth = 480,
    asideMinWidth = 200,
    asideMaxWidth = 480,
    storageKey,
    headroom,
    layout,
}: AppShellProps) {
    const appShell = useRecipe('appShell', appShellRecipe, classes);
    const translations = useTranslations();
    const navbarLabel = navbarLabelProp ?? translations.appShell.navigation;
    const skipLinkLabel = skipLinkLabelProp ?? translations.appShell.skipLink;
    const id = useId();
    const [internal, setInternal] = useState(false);
    const open = navbarOpen ?? internal;
    const setOpen = (next: boolean) => {
        setInternal(next);
        onNavbarOpenChange?.(next);
    };

    // Rail, widths: controlled or our own, optionally remembered (read after hydration)
    const stored = parseStored<Stored>(useStoredText(storageKey));
    const [changed, setChanged] = useState<Stored>({});
    const own: Stored = { ...(stored && typeof stored === 'object' ? stored : {}), ...changed };
    const collapsed = navbarCollapsed ?? own.navbarCollapsed ?? false;
    const navbarWidth = navbarWidthProp ?? own.navbarWidth;
    const asideWidth = asideWidthProp ?? own.asideWidth;
    const sized = !!(navbarResizable || asideResizable || navbarWidth || asideWidth);
    const remember = (change: Stored) => {
        const next = { ...own, ...change };
        if (storageKey) writeStored(storageKey, next);
        setChanged((before) => ({ ...before, ...change }));
    };
    const setCollapsed = (next: boolean) => {
        remember({ navbarCollapsed: next });
        onNavbarCollapsedChange?.(next);
    };
    const styles = appShell({
        sized,
        collapsed,
        expandOnHover: collapsed && navbarExpandOnHover,
        headroom,
        layout,
    });
    const style = sized
        ? ({
              '--wc-navbar-width': `${navbarWidth ?? NAVBAR_WIDTH}px`,
              '--wc-aside-width': `${asideWidth ?? ASIDE_WIDTH}px`,
          } as CSSProperties)
        : undefined;

    // Resize handles (window splitter pattern): value = width in px
    const limits = (side: Side) =>
        side === 'navbar' ? { min: navbarMinWidth, max: navbarMaxWidth } : { min: asideMinWidth, max: asideMaxWidth };
    const widthOf = (side: Side) => (side === 'navbar' ? (navbarWidth ?? NAVBAR_WIDTH) : (asideWidth ?? ASIDE_WIDTH));
    const setWidth = (side: Side, width: number) => {
        if (side === 'navbar') {
            remember({ navbarWidth: width });
            onNavbarWidthChange?.(width);
        } else {
            remember({ asideWidth: width });
            onAsideWidthChange?.(width);
        }
    };
    const handle = (side: Side) => (
        <ResizeHandle
            side={side}
            label={side === 'navbar' ? translations.appShell.resizeNavigation : translations.appShell.resizeAside}
            controls={`${id}-${side}`}
            width={widthOf(side)}
            limits={limits(side)}
            className={styles.resizer()}
            onResize={(width) => setWidth(side, width)}
            onReset={() => setWidth(side, side === 'navbar' ? NAVBAR_WIDTH : ASIDE_WIDTH)}
        />
    );

    // Headroom: hide the header while scrolling down
    const [headerHidden, setHeaderHidden] = useState(false);
    useEffect(() => {
        if (!headroom) return;
        let lastY = window.scrollY;
        const onScroll = () => {
            const previous = lastY;
            const current = window.scrollY;
            lastY = current;
            setHeaderHidden((hidden) => headroomHidden(previous, current, hidden));
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [headroom]);

    return (
        <div className={styles.base()} style={style}>
            {skipLinks?.length ? (
                <SkipLinks links={[{ href: `#${id}-main`, label: skipLinkLabel }, ...skipLinks]} />
            ) : (
                <a href={`#${id}-main`} className={styles.skipLink()}>
                    {skipLinkLabel}
                </a>
            )}
            <header className={styles.header()} data-hidden={headroom && headerHidden ? '' : undefined}>
                {navbar && (
                    <IconButton
                        icon={Menu}
                        label={translations.appShell.openNavigation}
                        variant="text"
                        className={styles.burger()}
                        aria-expanded={open}
                        onClick={() => setOpen(true)}
                    />
                )}
                {navbar && collapsible && (
                    <IconButton
                        icon={collapsed ? PanelLeftOpen : PanelLeftClose}
                        label={
                            collapsed
                                ? translations.appShell.expandNavigation
                                : translations.appShell.collapseNavigation
                        }
                        variant="text"
                        className={styles.collapseToggle()}
                        onClick={() => setCollapsed(!collapsed)}
                    />
                )}
                {header}
            </header>
            <div className={styles.body()}>
                {navbar && (
                    <div id={navbarResizable ? `${id}-navbar` : undefined} className={styles.navbar()}>
                        <AppShellRailContext.Provider value={{ rail: collapsed, expandOnHover: !!navbarExpandOnHover }}>
                            {navbar}
                        </AppShellRailContext.Provider>
                    </div>
                )}
                {navbar && navbarResizable && !collapsed && handle('navbar')}
                <main id={`${id}-main`} tabIndex={-1} className={styles.main()}>
                    {children}
                </main>
                {aside && asideResizable && handle('aside')}
                {aside && (
                    <aside id={asideResizable ? `${id}-aside` : undefined} className={styles.aside()}>
                        {aside}
                    </aside>
                )}
            </div>
            {footer && <footer className={styles.footer()}>{footer}</footer>}
            {navbar && (
                <Drawer open={open} onOpenChange={setOpen}>
                    <DrawerContent title={navbarLabel} placement="left">
                        <AppShellRailContext.Provider value={{ rail: false, expandOnHover: false }}>
                            {navbar}
                        </AppShellRailContext.Provider>
                    </DrawerContent>
                </Drawer>
            )}
        </div>
    );
}
