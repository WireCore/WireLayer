import { cloneElement, useState, type ReactElement } from 'react';
import { Platform, type AccessibilityActionEvent } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Menu, type MenuEntry, type MenuItemOptions } from '../Menu/Menu.js';

export interface ContextMenuProps extends MenuItemOptions {
    /** The same entries as Menu (items, checkbox and radio items, groups, submenus) */
    items: MenuEntry[];
    /** Title of the sheet and name of the screen reader action (default "Actions") */
    label?: string;
    /** Accessible name of the sheet's close button */
    closeLabel?: string;
    /** The area, e.g. a list row or card – gets onLongPress */
    children: ReactElement<Record<string, unknown>>;
}

/**
 * Long press on the area opens its actions in a sheet. Screen readers get the actions as an accessibility action
 * (VoiceOver: swipe up/down, TalkBack: actions menu); on the web the context menu key, Shift+F10 and a right click.
 * Offer the actions another way, too (e.g. an IconButton) – a long press is hard to find.
 */
export function ContextMenu({ items, label, closeLabel, children, ...options }: ContextMenuProps) {
    const translations = useTranslations();
    const [open, setOpen] = useState(false);
    const name = label ?? translations.menu.title;
    const web = Platform.OS === 'web';

    const area = cloneElement(children, {
        onLongPress: () => setOpen(true),
        accessibilityActions: [
            { name: 'longpress', label: name },
            { name: 'contextmenu', label: name },
        ],
        onAccessibilityAction: (event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === 'longpress' || event.nativeEvent.actionName === 'contextmenu')
                setOpen(true);
        },
        ...(web
            ? {
                  onContextMenu: (event: { preventDefault(): void }) => {
                      event.preventDefault();
                      setOpen(true);
                  },
                  onKeyDown: (event: { key: string; shiftKey?: boolean; preventDefault(): void }) => {
                      if (event.key === 'ContextMenu' || (event.key === 'F10' && event.shiftKey)) {
                          event.preventDefault();
                          setOpen(true);
                      }
                  },
              }
            : {}),
    });

    return (
        <>
            {area}
            <Menu items={items} open={open} onOpenChange={setOpen} title={name} closeLabel={closeLabel} {...options} />
        </>
    );
}
