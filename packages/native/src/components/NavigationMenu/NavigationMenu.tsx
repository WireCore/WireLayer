import { isCurrentLink, navList } from '@wirecore/wirelayer-recipes/native';
import { Menu as MenuIcon } from 'lucide-react-native';
import { cloneElement, type ReactElement } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { Accordion, AccordionItem } from '../Accordion/Accordion.js';
import { Drawer } from '../Drawer/Drawer.js';
import { NavLink } from '../SidebarNav/SidebarNav.js';

export interface NavigationMenuLink {
    label: string;
    href: string;
    /** Second line, e.g. what the page offers */
    description?: string;
    icon?: IconComponent;
    current?: boolean;
}

/** A titled column of links (the panels of a web MegaMenu) */
export interface NavigationMenuGroup {
    title: string;
    items: NavigationMenuLink[];
}

export interface NavigationMenuEntry {
    label: string;
    /** A link of its own (without children/groups) */
    href?: string;
    current?: boolean;
    /** Links of the section */
    children?: NavigationMenuLink[];
    /** Titled groups of links (a MegaMenu section) */
    groups?: NavigationMenuGroup[];
}

export interface NavigationMenuProps {
    items: NavigationMenuEntry[];
    /** Accessible name of the navigation (default "Main navigation") */
    label?: string;
    /** Name of the menu button and title of the drawer (default "Menu") */
    menuLabel?: string;
    /** href of the current screen */
    currentHref?: string;
    isCurrent?: (link: NavigationMenuLink | NavigationMenuEntry) => boolean;
    /** A tap on a link – the drawer closes, navigate with the app's router */
    onNavigate?: (link: NavigationMenuLink | NavigationMenuEntry) => void;
    open?: boolean;
    defaultOpen?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Own trigger (gets onPress) – default an icon button with the menu icon */
    children?: ReactElement<{ onPress?: () => void }>;
}

/**
 * The website navigation and MegaMenu on a phone: a menu button opens a drawer from the left with one accordion
 * section per area (the one with the current page open) and its links.
 */
export function NavigationMenu({
    items,
    label,
    menuLabel,
    currentHref,
    isCurrent,
    onNavigate,
    open: openProp,
    defaultOpen = false,
    onOpenChange,
    children,
}: NavigationMenuProps) {
    const translations = useTranslations();
    const [open, setOpen] = useControllable(openProp, defaultOpen, onOpenChange);
    const styles = navList();
    const name = menuLabel ?? translations.megaMenu.menu;
    const check = (link: NavigationMenuLink | NavigationMenuEntry) => isCurrentLink(link, currentHref, isCurrent);
    const links = (entry: NavigationMenuEntry) => [
        ...(entry.children ?? []),
        ...(entry.groups ?? []).flatMap((group) => group.items),
    ];
    const navigate = (link: NavigationMenuLink | NavigationMenuEntry) => {
        setOpen(false);
        onNavigate?.(link);
    };
    const sections = items
        .map((entry, index) => ({ entry, value: String(index) }))
        .filter(({ entry }) => links(entry).length > 0);
    const linkRow = (link: NavigationMenuLink) => (
        <NavLink
            key={link.href}
            item={link}
            description={link.description}
            current={check(link)}
            onPress={() => navigate(link)}
        />
    );

    const trigger = children ? (
        cloneElement(children, { onPress: () => setOpen(true) })
    ) : (
        <Pressable
            role="button"
            aria-label={name}
            aria-expanded={open}
            {...({ 'aria-haspopup': 'dialog' } as object)}
            className={styles.trigger()}
            onPress={() => setOpen(true)}
        >
            <Icon icon={MenuIcon} className={styles.triggerIcon()} />
        </Pressable>
    );

    return (
        <>
            {trigger}
            <Drawer open={open} onOpenChange={setOpen} title={name} placement="left">
                <View role="navigation" aria-label={label ?? translations.navigationMenu.rootLabel}>
                    <Accordion
                        multiple
                        defaultValue={sections
                            .filter(({ entry }) => check(entry) || links(entry).some(check))
                            .map(({ value }) => value)}
                    >
                        {items.map((entry, index) => {
                            if (!links(entry).length)
                                return (
                                    <NavLink
                                        key={index}
                                        item={entry}
                                        current={check(entry)}
                                        onPress={() => navigate(entry)}
                                    />
                                );
                            return (
                                <AccordionItem key={index} value={String(index)} title={entry.label}>
                                    {entry.href && (
                                        <NavLink
                                            item={{ label: translations.megaMenu.overview(entry.label) }}
                                            current={check(entry)}
                                            onPress={() => navigate(entry)}
                                        />
                                    )}
                                    {entry.children?.map(linkRow)}
                                    {entry.groups?.map((group) => (
                                        <View key={group.title} role="group" aria-label={group.title}>
                                            <Text className={styles.heading()} aria-hidden>
                                                {group.title}
                                            </Text>
                                            {group.items.map(linkRow)}
                                        </View>
                                    ))}
                                </AccordionItem>
                            );
                        })}
                    </Accordion>
                </View>
            </Drawer>
        </>
    );
}
