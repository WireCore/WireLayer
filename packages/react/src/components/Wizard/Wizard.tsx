import { wizard as wizardRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, useState, type ComponentProps, type ReactNode } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { Stepper } from '../Stepper/Stepper.js';

export interface WizardStep {
    label: string;
    description?: string;
    /**
     * Checks the step before going on ("Next"): false keeps it open (e.g. `() => validateFields(form, ['name'])`
     * from the form subpath); may be async – the step shows a spinner meanwhile. Going back never checks
     */
    validate?: () => boolean | Promise<boolean>;
}

export interface WizardProps extends Omit<ComponentProps<'div'>, 'children'> {
    steps: WizardStep[];
    /** Current step (0-based; steps + summary = done) – controlled with onStepChange */
    step?: number;
    defaultStep?: number;
    onStepChange?: (step: number) => void;
    /** The last step was finished (after its check) */
    onComplete?: () => void;
    /** Content of a step – its fields stay in the form state, so going back loses nothing */
    renderStep: (index: number, step: WizardStep) => ReactNode;
    /** A last step with this summary before finishing */
    summary?: ReactNode;
    /** Name of the summary step (default "Summary") */
    summaryLabel?: string;
    /** Shown after finishing */
    completed?: ReactNode;
    /** Steps listed top to bottom beside the content */
    orientation?: 'horizontal' | 'vertical';
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof wizardRecipe>;
}

/**
 * Multi-step form on the Stepper: "Next" checks the step (async with a spinner), "Back" keeps everything; an
 * optional summary step before finishing.
 */
export function Wizard({
    classes,
    steps,
    step,
    defaultStep = 0,
    onStepChange,
    onComplete,
    renderStep,
    summary,
    summaryLabel,
    completed,
    orientation = 'horizontal',
    className,
    ...props
}: WizardProps) {
    const wizard = useRecipe('wizard', wizardRecipe, classes);
    const translations = useTranslations();
    const styles = wizard();
    const [internal, setInternal] = useState(defaultStep);
    const current = step ?? internal;
    const [checking, setChecking] = useState<number | null>(null);
    const [invalidAt, setInvalidAt] = useState<number | null>(null);
    const root = useRef<HTMLDivElement>(null);
    // After a failed check: the first invalid control of the step gets the focus
    const focusInvalid = useRef(false);
    useEffect(() => {
        if (!focusInvalid.current) return;
        focusInvalid.current = false;
        root.current?.querySelector<HTMLElement>('[role=tabpanel]:not([hidden]) [aria-invalid=true]')?.focus();
    });
    const items = [
        ...steps.map((entry, index) => ({
            label: entry.label,
            description: entry.description,
            loading: checking === index,
        })),
        ...(summary !== undefined ? [{ label: summaryLabel ?? translations.wizard.summary, loading: false }] : []),
    ];
    const set = (next: number) => {
        setInternal(next);
        onStepChange?.(next);
        if (next === items.length) onComplete?.();
    };
    /** Going on checks every step passed (in order); going back is free */
    const change = async (next: number) => {
        if (checking !== null) return;
        setInvalidAt(null);
        for (let index = current; index < next; index++) {
            const validate = steps[index]?.validate;
            if (!validate) continue;
            setChecking(index);
            let valid: boolean;
            try {
                valid = await validate();
            } finally {
                setChecking(null);
            }
            if (!valid) {
                if (index !== current) set(index);
                setInvalidAt(index);
                focusInvalid.current = true;
                return;
            }
        }
        set(next);
    };
    return (
        <div {...props} ref={root} className={styles.base({ class: className })}>
            <Stepper
                items={items}
                step={current}
                linear
                orientation={orientation}
                onStepChange={(next) => void change(next)}
                completed={completed}
            >
                {(index) => (
                    <>
                        {invalidAt === index && (
                            <p className={styles.error()} role="alert">
                                {translations.wizard.invalid}
                            </p>
                        )}
                        {index === steps.length ? (
                            <div className={styles.summary()}>{summary}</div>
                        ) : (
                            renderStep(index, steps[index]!)
                        )}
                    </>
                )}
            </Stepper>
        </div>
    );
}
