import { stepper, visuallyHidden } from '@wirecore/wirelayer-recipes/native';
import { Check } from 'lucide-react-native';
import { Fragment, useState, type ReactNode } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { Icon } from '../../utils/Icon.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';

export interface StepperItem {
    label: string;
    description?: string;
}

export interface StepperProps {
    items: StepperItem[];
    /** Current step (0-based; items.length = all done) */
    step?: number;
    defaultStep?: number;
    onStepChange?: (step: number) => void;
    /** Steps only in order: no jumping ahead via the step list */
    linear?: boolean;
    /** Blocks "Next" while a step is not valid (with linear) */
    isStepValid?: (index: number) => boolean;
    /** Checks a step when "Next" is pressed: false keeps it (may be async – the button shows a spinner meanwhile) */
    onNext?: (index: number) => boolean | Promise<boolean>;
    /** Content of a step */
    children: (index: number) => ReactNode;
    /** Shown after the last step */
    completed?: ReactNode;
    /** `vertical`: the steps with their labels top to bottom above the content */
    orientation?: 'horizontal' | 'vertical';
    className?: string;
}

/**
 * Wizard for small screens: numbered steps in a row (each named with its status), the title of the current
 * step as a heading, its content and back/next below; the last "Next" finishes.
 */
export function Stepper({
    items,
    step,
    defaultStep = 0,
    onStepChange,
    linear = false,
    isStepValid,
    onNext,
    children,
    completed,
    orientation,
    className,
}: StepperProps) {
    const vertical = orientation === 'vertical';
    const translations = useTranslations();
    const t = translations.stepper;
    const [current, setCurrent] = useControllable(step, defaultStep, onStepChange);
    const done = current >= items.length;
    const active = items[current];
    const valid = !linear || !isStepValid || isStepValid(current);
    const [checking, setChecking] = useState(false);
    const next = async () => {
        if (onNext) {
            setChecking(true);
            const ok = await Promise.resolve(onNext(current)).catch(() => false);
            setChecking(false);
            if (!ok) return;
        }
        setCurrent(current + 1);
    };
    const styles = stepper({ orientation });

    return (
        <View className={styles.base({ class: className })}>
            <View role="list" className={styles.list()}>
                {items.map((item, index) => {
                    const state = index < current ? 'done' : index === current ? 'active' : 'todo';
                    const look = stepper({ state, orientation });
                    // Vertical on the web: the name comes from the visible "3 Review" and a hidden status (WCAG 2.5.3)
                    const fromContent = vertical && Platform.OS === 'web';
                    const name = fromContent
                        ? undefined
                        : vertical
                          ? `${index + 1} ${item.label}, ${t.status[state]}`
                          : `${index + 1}. ${item.label}, ${t.status[state]}`;
                    // Without linear, earlier and later steps can be opened from the list
                    const canJump = !linear || index < current;
                    const indicator = (
                        <View className={look.indicator()}>
                            {state === 'done' ? (
                                <Icon icon={Check} className={look.icon()} />
                            ) : (
                                <Text className={look.number()}>{index + 1}</Text>
                            )}
                        </View>
                    );
                    // Vertical: the label is visible beside the number (and the row the touch target)
                    const content = vertical ? (
                        <View className={look.step()}>
                            {indicator}
                            <Text className={look.stepLabel()}>
                                {item.label}
                                {fromContent && <Text className={visuallyHidden()}>{`, ${t.status[state]}`}</Text>}
                            </Text>
                        </View>
                    ) : (
                        indicator
                    );
                    return (
                        <Fragment key={item.label}>
                            {index > 0 && (
                                <View className={vertical ? look.connector() : look.separator()} aria-hidden />
                            )}
                            <View role="listitem" className={vertical ? undefined : look.step()}>
                                {canJump && index !== current ? (
                                    <Pressable role="button" aria-label={name} onPress={() => setCurrent(index)}>
                                        {content}
                                    </Pressable>
                                ) : (
                                    <View
                                        aria-label={name}
                                        {...({ 'aria-current': index === current ? 'step' : undefined } as object)}
                                    >
                                        {content}
                                    </View>
                                )}
                            </View>
                        </Fragment>
                    );
                })}
            </View>
            {done ? (
                completed
            ) : (
                <>
                    <View className="gap-1">
                        <Text className={styles.description()}>{t.progress(current + 1, items.length)}</Text>
                        <Text role="heading" className={styles.title()}>
                            {active!.label}
                        </Text>
                        {active!.description && <Text className={styles.description()}>{active!.description}</Text>}
                    </View>
                    <View>{children(current)}</View>
                    <View className={styles.footer()}>
                        <Button variant="outline" disabled={current === 0} onPress={() => setCurrent(current - 1)}>
                            {t.prev}
                        </Button>
                        <Button disabled={!valid} loading={checking} onPress={() => void next()}>
                            {current === items.length - 1 ? t.finish : t.next}
                        </Button>
                    </View>
                </>
            )}
        </View>
    );
}
