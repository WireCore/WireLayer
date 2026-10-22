import { Accordion as ArkAccordion } from '@ark-ui/react/accordion';
import { accordion as accordionRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ChevronDown } from 'lucide-react';
import type { ComponentProps, ReactNode } from 'react';
import type { IconComponent } from '../../types.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface AccordionProps extends Omit<ComponentProps<'div'>, 'defaultValue' | 'dir'> {
    /** Open items (values of AccordionItem) */
    value?: string[];
    defaultValue?: string[];
    onValueChange?: (value: string[]) => void;
    /** Several items open at once */
    multiple?: boolean;
    /** The open item can be closed again (single mode) */
    collapsible?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof accordionRecipe>;
}

/** Sections that open and close (one or several at a time); each item is a heading with a button (aria-expanded) */
export function Accordion({
    classes,
    value,
    defaultValue,
    onValueChange,
    multiple = false,
    collapsible = true,
    className,
    ...props
}: AccordionProps) {
    const accordion = useRecipe('accordion', accordionRecipe, classes);
    const styles = accordion();
    return (
        <ArkAccordion.Root
            {...props}
            className={styles.base({ class: className })}
            value={value}
            defaultValue={defaultValue}
            onValueChange={(details) => onValueChange?.(details.value)}
            multiple={multiple}
            collapsible={collapsible}
        />
    );
}

export interface AccordionItemProps extends Omit<ComponentProps<'div'>, 'title'> {
    value: string;
    title: ReactNode;
    /** Icon component before the title */
    icon?: IconComponent;
    disabled?: boolean;
    /** Level of the heading around the trigger, to fit the page outline */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Own controls next to the heading (e.g. an IconButton) – beside the trigger, not inside it */
    actions?: ReactNode;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof accordionRecipe>;
}

/** One section of an Accordion: heading button and content */
export function AccordionItem({
    classes,
    value,
    title,
    icon: Icon,
    disabled,
    headingLevel = 3,
    actions,
    className,
    children,
    ...props
}: AccordionItemProps) {
    const accordion = useRecipe('accordion', accordionRecipe, classes);
    const styles = accordion({ withActions: !!actions });
    const Heading = `h${headingLevel}` as const;
    const heading = (
        <Heading className={styles.heading()}>
            <ArkAccordion.ItemTrigger className={styles.trigger()}>
                {Icon && <Icon className={styles.icon()} aria-hidden="true" />}
                <span className={styles.title()}>{title}</span>
                <ArkAccordion.ItemIndicator className={styles.indicator()}>
                    <ChevronDown className={styles.indicatorIcon()} aria-hidden="true" />
                </ArkAccordion.ItemIndicator>
            </ArkAccordion.ItemTrigger>
        </Heading>
    );

    return (
        <ArkAccordion.Item {...props} value={value} disabled={disabled} className={styles.item({ class: className })}>
            {actions ? (
                <div className={styles.header()}>
                    {heading}
                    <div className={styles.actions()}>{actions}</div>
                </div>
            ) : (
                heading
            )}
            <ArkAccordion.ItemContent className={styles.content()}>
                <div className={styles.body()}>{children}</div>
            </ArkAccordion.ItemContent>
        </ArkAccordion.Item>
    );
}
