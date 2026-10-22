import { accordion } from '@wirecore/wirelayer-recipes/native';
import { ChevronDown } from 'lucide-react-native';
import { createContext, useContext, useId, type ReactNode } from 'react';
import { Pressable, Text, View, type ViewProps } from 'react-native';
import { Icon, type IconComponent } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';

interface AccordionContextValue {
    open: string[];
    toggle: (value: string) => void;
}

const AccordionContext = createContext<AccordionContextValue>({ open: [], toggle: () => {} });

export interface AccordionProps extends ViewProps {
    /** Open items */
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Several items open at once */
    multiple?: boolean;
    /** The open item can be closed again (single mode, default true) */
    collapsible?: boolean;
    className?: string;
    children?: ReactNode;
}

/** Sections that open and close; each heading is a button with aria-expanded */
export function Accordion({
    value,
    defaultValue = [],
    onValueChange,
    multiple = false,
    collapsible = true,
    className,
    children,
    ...props
}: AccordionProps) {
    const [open, setOpen] = useControllable(value, defaultValue, onValueChange);
    const toggle = (item: string) => {
        if (open.includes(item) && !multiple && !collapsible) return;
        setOpen(open.includes(item) ? open.filter((entry) => entry !== item) : multiple ? [...open, item] : [item]);
    };
    return (
        <AccordionContext.Provider value={{ open, toggle }}>
            <View {...props} className={accordion().base({ class: className })}>
                {children}
            </View>
        </AccordionContext.Provider>
    );
}

export interface AccordionItemProps extends ViewProps {
    value: string;
    title: string;
    /** Icon component before the title */
    icon?: IconComponent;
    disabled?: boolean;
    /** Level of the heading around the trigger, to fit the screen outline (default 3) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Own controls next to the heading (e.g. an IconButton) – beside the trigger, not inside it */
    actions?: ReactNode;
    className?: string;
    children?: ReactNode;
}

/** One section of an Accordion: a heading with a button (aria-expanded) and its content; own actions beside it */
export function AccordionItem({
    value,
    title,
    icon,
    disabled,
    headingLevel = 3,
    actions,
    className,
    children,
    ...props
}: AccordionItemProps) {
    const context = useContext(AccordionContext);
    const open = context.open.includes(value);
    const styles = accordion({ open });
    const contentId = `${useId()}content`;
    const heading = (
        <View role="heading" aria-level={headingLevel} className={actions ? styles.heading() : undefined}>
            <Pressable
                role="button"
                aria-expanded={open}
                disabled={disabled}
                aria-disabled={disabled || undefined}
                {...({ 'aria-controls': open ? contentId : undefined } as object)}
                className={styles.trigger()}
                onPress={() => context.toggle(value)}
            >
                {icon && <Icon icon={icon} className={styles.icon()} />}
                <Text className={styles.title()}>{title}</Text>
                <Icon icon={ChevronDown} className={styles.indicator()} />
            </Pressable>
        </View>
    );
    return (
        <View {...props} className={styles.item({ class: className })}>
            {actions ? (
                <View className={styles.header()}>
                    {heading}
                    <View className={styles.actions()}>{actions}</View>
                </View>
            ) : (
                heading
            )}
            {open && (
                <View nativeID={contentId} className={styles.content()}>
                    {typeof children === 'string' ? <Text className={styles.body()}>{children}</Text> : children}
                </View>
            )}
        </View>
    );
}
