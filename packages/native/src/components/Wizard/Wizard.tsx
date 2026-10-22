import { wizard } from '@wirecore/wirelayer-recipes/native';
import { useState, type ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useControllable } from '../../utils/useControllable.js';
import { Stepper } from '../Stepper/Stepper.js';

export interface WizardStep {
    label: string;
    description?: string;
    /**
     * Checks the step before going on ("Next"): false keeps it open (e.g. `() => validateFields(form, ['name'])`
     * from @wirecore/wirelayer-native/form); may be async – the button shows a spinner meanwhile. Going back never checks
     */
    validate?: () => boolean | Promise<boolean>;
}

export interface WizardProps {
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
    /** `vertical`: the steps with their labels top to bottom */
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

/**
 * Multi-step form on the Stepper: "Next" checks the step (async with a spinner; a failed check is announced),
 * "Back" keeps everything; an optional summary step before finishing.
 */
export function Wizard({
    steps,
    step,
    defaultStep = 0,
    onStepChange,
    onComplete,
    renderStep,
    summary,
    summaryLabel,
    completed,
    orientation,
    className,
}: WizardProps) {
    const translations = useTranslations();
    const t = translations.wizard;
    const [current, setCurrent] = useControllable(step, defaultStep, onStepChange);
    const [failed, setFailed] = useState(-1);
    const { announce, region } = useAnnouncer();
    const items = [...steps, ...(summary !== undefined ? [{ label: summaryLabel ?? t.summary }] : [])];
    const styles = wizard();

    return (
        <View className={className}>
            <Stepper
                items={items}
                step={current}
                onStepChange={(next) => {
                    setFailed(-1);
                    setCurrent(next);
                    if (next >= items.length) onComplete?.();
                }}
                linear
                orientation={orientation}
                onNext={async (index) => {
                    const ok = (await steps[index]?.validate?.()) ?? true;
                    setFailed(ok ? -1 : index);
                    if (!ok) announce(t.invalid);
                    return ok;
                }}
                completed={completed}
            >
                {(index) => (
                    <View>
                        {index < steps.length ? renderStep(index, steps[index]!) : summary}
                        {failed === index && (
                            <Text role="alert" className={styles.status()}>
                                {t.invalid}
                            </Text>
                        )}
                    </View>
                )}
            </Stepper>
            {region}
        </View>
    );
}
