import { appShell } from '@wirecore/wirelayer-recipes/native';
import { Menu as MenuIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, View, type ViewProps } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { Drawer } from '../Drawer/Drawer.js';

export interface AppShellProps extends ViewProps {
    /** Content of the header bar, e.g. the title and actions */
    header?: ReactNode;
    /** The navigation (e.g. a SidebarNav) – in a drawer from the left behind the menu button of the header */
    navbar?: ReactNode;
    /** Bar at the bottom, e.g. a BottomNavigation with `inline` */
    footer?: ReactNode;
    navbarOpen?: boolean;
    onNavbarOpenChange?: (open: boolean) => void;
    /** Title of the navigation drawer (default "Navigation") */
    navbarLabel?: string;
    className?: string;
    /** The screen's content (wrap it in a ScrollView when it scrolls) */
    children: ReactNode;
}

/**
 * Frame of an app screen without a router: header with menu button (when there is a navbar), content and an
 * optional bottom bar; the navbar opens as a drawer. Header and footer stay, the content fills the rest.
 */
export function AppShell({
    header,
    navbar,
    footer,
    navbarOpen,
    onNavbarOpenChange,
    navbarLabel,
    className,
    children,
    ...props
}: AppShellProps) {
    const translations = useTranslations();
    const styles = appShell();
    const [open, setOpen] = useControllable(navbarOpen, false, onNavbarOpenChange);
    return (
        <View {...props} className={styles.base({ class: className })}>
            {(!!header || !!navbar) && (
                <View role="banner" className={styles.header()}>
                    {!!navbar && (
                        <Pressable
                            role="button"
                            aria-label={translations.appShell.openNavigation}
                            aria-expanded={open}
                            {...({ 'aria-haspopup': 'dialog' } as object)}
                            className={styles.menuButton()}
                            onPress={() => setOpen(true)}
                        >
                            <Icon icon={MenuIcon} className={styles.menuIcon()} />
                        </Pressable>
                    )}
                    <View className={styles.headerContent()}>{header}</View>
                </View>
            )}
            <View role="main" className={styles.main()}>
                {children}
            </View>
            {!!footer && <View className={styles.footer()}>{footer}</View>}
            {!!navbar && (
                <Drawer
                    open={open}
                    onOpenChange={setOpen}
                    title={navbarLabel ?? translations.appShell.navigation}
                    placement="left"
                >
                    {navbar}
                </Drawer>
            )}
        </View>
    );
}
