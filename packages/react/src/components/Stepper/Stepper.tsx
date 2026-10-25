import { Steps } from '@ark-ui/react/steps';
import { stepper as stepperRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Check, LoaderCircle } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Button } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface StepperItem {
    label: string;
    description?: string;
    /** The step is busy (e.g. saving): a spinner instead of its number, aria-busy on the step */
    loading?: boolean;
}

export interface StepperProps {
    items: readonly StepperItem[];
    /** Current step (0-based; items.length = all done) */
    step?: number;
    defaultStep?: number;
    onStepChange?: (step: number) => void;
    /** Steps only in order: no jumping ahead via the step list */
    linear?: boolean;
    /** Blocks "Next" while a step is not valid (with linear) */
    isStepValid?: (index: number) => boolean;
    /** Steps listed top to bottom beside the content */
    orientation?: 'horizontal' | 'vertical';
    /** Label beside the number (default) or below it */
    labelPlacement?: 'end' | 'bottom';
    /** Content of a step */
    children: (index: number) => ReactNode;
    /** Shown after the last step */
    completed?: ReactNode;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof stepperRecipe>;
}

// null removes Ark's aria-current from the item (Ark skips undefined when merging)
const noCurrent = null as unknown as undefined;

/** Steps list (tabs) with one panel per step and back/next buttons; the last "Next" finishes */
export function Stepper({
    classes,
    items,
    step,
    defaultStep = 0,
    onStepChange,
    linear = false,
    isStepValid,
    orientation = 'horizontal',
    labelPlacement = 'end',
    children,
    completed,
    className,
    style,
}: StepperProps) {
    const stepper = useRecipe('stepper', stepperRecipe, classes);
    const styles = stepper({ vertical: orientation === 'vertical', labelBottom: labelPlacement === 'bottom' });
    const translations = useTranslations();
    const t = translations.stepper;
    return (
        <Steps.Root
            className={styles.base({ class: className })}
            style={style}
            count={items.length}
            step={step}
            defaultStep={defaultStep}
            onStepChange={(details) => onStepChange?.(details.step)}
            linear={linear}
            isStepValid={isStepValid}
            orientation={orientation}
        >
            <Steps.List className={styles.list()}>
                {items.map((item, index) => (
                    // Only a wrapper between tablist and tab: the tab itself is the selected step (aria-selected)
                    <Steps.Item
                        key={index}
                        index={index}
                        className={styles.item()}
                        role="presentation"
                        aria-current={noCurrent}
                    >
                        <Steps.Trigger className={styles.trigger()} aria-busy={item.loading || undefined}>
                            <Steps.Indicator className={styles.indicator()}>
                                <Steps.ItemContext>
                                    {(state) =>
                                        item.loading ? (
                                            <LoaderCircle className={styles.spinner()} aria-hidden="true" />
                                        ) : state.completed ? (
                                            <Check className={styles.indicatorIcon()} aria-hidden="true" />
                                        ) : (
                                            index + 1
                                        )
                                    }
                                </Steps.ItemContext>
                            </Steps.Indicator>
                            <span className={styles.text()}>
                                <span className={styles.label()}>{item.label}</span>
                                {item.description && <span className={styles.description()}>{item.description}</span>}
                            </span>
                        </Steps.Trigger>
                        {index < items.length - 1 && <Steps.Separator className={styles.separator()} />}
                    </Steps.Item>
                ))}
            </Steps.List>
            {items.map((_, index) => (
                <Steps.Content key={index} index={index} className={styles.content()}>
                    {children(index)}
                </Steps.Content>
            ))}
            <Steps.CompletedContent className={styles.content()}>{completed}</Steps.CompletedContent>
            <Steps.Context>
                {(api) =>
                    !api.isCompleted && (
                        <div className={styles.actions()}>
                            <Steps.PrevTrigger asChild>
                                <Button variant="outline">{t.prev}</Button>
                            </Steps.PrevTrigger>
                            {/* With linear, an invalid step blocks going on – shown as a disabled button */}
                            <Steps.NextTrigger asChild>
                                <Button disabled={linear && !api.isStepValid(api.value)}>
                                    {api.value === api.count - 1 ? t.finish : t.next}
                                </Button>
                            </Steps.NextTrigger>
                        </div>
                    )
                }
            </Steps.Context>
        </Steps.Root>
    );
}
