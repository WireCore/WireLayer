import { prepareTourStep, tour, tourSkipTarget } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useId, useMemo, useRef, useState, type ComponentRef, type RefObject } from 'react';
import { Dimensions, Modal, Platform, Pressable, Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { focusElement } from '../../utils/focus-registry.js';
import { useEscape } from '../../utils/useEscape.js';
import { useReducedMotion } from '../../utils/useReducedMotion.js';
import { Button } from '../Button/Button.js';

/** Anything that can be measured on screen – a View ref */
export interface TourTarget {
    measureInWindow(callback: (x: number, y: number, width: number, height: number) => void): void;
}

export interface TourStep {
    id: string;
    title: string;
    description: string;
    /** The element the step points at – without one the step is shown in the middle */
    target?: RefObject<TourTarget | null>;
    /** Bubble below (default) or above the target */
    placement?: 'top' | 'bottom';
    /** Runs before the step is shown (also for the first step and when going back), may be async – e.g. switches a tab */
    before?: () => void | Promise<void>;
    /** How long (ms) to wait for `target` after `before`, e.g. while it loads (default 0: look once) */
    waitFor?: number;
}

export interface TourProps {
    steps: TourStep[];
    /** Starts the tour */
    open?: boolean;
    /** Called with false when it is finished, skipped or closed */
    onOpenChange?: (open: boolean) => void;
    /** Id of the step shown, null while the tour does not run; setting it moves there */
    step?: string | null;
    onStepChange?: (step: string | null) => void;
    /** A step whose target is not there (after `waitFor`): skip it (default) or show it in the middle */
    missingTarget?: 'skip' | 'dialog';
    /** The last step was confirmed */
    onComplete?: () => void;
}

interface Box {
    x: number;
    y: number;
    width: number;
    height: number;
}

const pad = 6;

/**
 * Coachmarks: the screen is dimmed around the target of each step, a bubble explains it with Back/Next.
 * Each step is a dialog – the screen reader starts at its title; the back button, Escape (web) and "Skip"
 * end it.
 */
export function Tour({
    steps,
    open = false,
    onOpenChange,
    step: stepId,
    onStepChange,
    missingTarget = 'skip',
    onComplete,
}: TourProps) {
    const translations = useTranslations();
    const t = translations.tour;
    const styles = tour();
    const reducedMotion = useReducedMotion();
    const id = useId();
    // The step shown (kept while the tour fades out) and whether one is shown
    const [index, setIndex] = useState(0);
    const [shown, setShown] = useState(false);
    // A step is shown once its `before` has run and its target is there; meanwhile the previous one stays, busy
    const [pending, setPending] = useState(false);
    const [box, setBox] = useState<{ step: string; box: Box } | null>(null);
    const [bubbleHeight, setBubbleHeight] = useState(0);
    const title = useRef<ComponentRef<typeof Text>>(null);
    const next = useRef<ComponentRef<typeof Pressable>>(null);
    const step = steps[Math.min(index, steps.length - 1)];
    const visible = open && shown;

    // The latest props for the steps being prepared (they finish later)
    const latest = useRef({ steps, stepId, missingTarget, onOpenChange, onStepChange, onComplete });
    useEffect(() => {
        latest.current = { steps, stepId, missingTarget, onOpenChange, onStepChange, onComplete };
    });
    // Index of the step shown (-1: none) – a missing step is skipped in the direction the tour moves
    const current = useRef(-1);
    // Cancels the step being prepared
    const cancel = useRef(() => {});
    const { go, stop, end } = useMemo(() => {
        // Hides the tour, a step being prepared is dropped
        const stop = () => {
            cancel.current();
            setPending(false);
            setShown(false);
            current.current = -1;
        };
        const end = () => {
            const wasShown = current.current >= 0;
            stop();
            if (wasShown) latest.current.onStepChange?.(null);
            latest.current.onOpenChange?.(false);
        };
        const go = (to: number) => {
            cancel.current();
            const target = latest.current.steps[to];
            if (!target) return;
            setPending(true);
            const find = target.target ? () => target.target!.current : undefined;
            cancel.current = prepareTourStep({ before: target.before, find, waitFor: target.waitFor }, (_, missing) => {
                setPending(false);
                if (missing && latest.current.missingTarget === 'skip') {
                    const instead = tourSkipTarget(to, current.current, latest.current.steps.length);
                    if (typeof instead === 'number') return go(instead);
                    if (instead !== 'end') return;
                    if (current.current >= 0) latest.current.onComplete?.();
                    return end();
                }
                current.current = to;
                setIndex(to);
                setShown(true);
                latest.current.onStepChange?.(target.id);
            });
        };
        return { go, stop, end };
    }, []);
    useEscape(open, end);

    // open starts the tour (at `step` if given) – it ends itself; closed from outside, it stops
    useEffect(() => {
        if (!open) return;
        const start = latest.current.steps.findIndex((entry) => entry.id === latest.current.stepId);
        go(Math.max(0, start));
        return stop;
    }, [open, go, stop]);
    // A step set from outside: move there (only when it changes – the tour moves on by itself)
    const requested = useRef(stepId);
    useEffect(() => {
        if (requested.current === stepId) return;
        requested.current = stepId;
        const to = steps.findIndex((entry) => entry.id === stepId);
        if (open && shown && to >= 0 && steps[index]?.id !== stepId) go(to);
    }, [stepId, steps, open, shown, index, go]);

    // Measure the target of the step; move the focus to the step
    useEffect(() => {
        if (!visible || !step) return;
        step.target?.current?.measureInWindow((x: number, y: number, width: number, height: number) =>
            setBox({ step: step.id, box: { x, y, width, height } })
        );
        const timer = setTimeout(() => {
            if (Platform.OS === 'web') next.current?.focus();
            else focusElement(title.current);
        }, 50);
        return () => clearTimeout(timer);
    }, [visible, step]);

    if (!step) return null;
    const screen = Dimensions.get('window');
    const target = step.target && box?.step === step.id ? box.box : null;
    const hole = target && {
        x: target.x - pad,
        y: target.y - pad,
        width: target.width + pad * 2,
        height: target.height + pad * 2,
    };
    const below = hole
        ? step.placement === 'top'
            ? hole.y - bubbleHeight - 12 < 16
            : hole.y + hole.height + 12 + bubbleHeight <= screen.height - 16
        : false;
    const bubbleTop = hole
        ? below
            ? hole.y + hole.height + 12
            : Math.max(16, hole.y - bubbleHeight - 12)
        : (screen.height - bubbleHeight) / 2;
    const last = index === steps.length - 1;

    return (
        <Modal visible={visible} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={end}>
            <View className={styles.root()}>
                {hole ? (
                    <>
                        <View
                            className={styles.shade()}
                            style={{ left: 0, right: 0, top: 0, height: Math.max(0, hole.y) }}
                        />
                        <View
                            className={styles.shade()}
                            style={{ left: 0, right: 0, top: hole.y + hole.height, bottom: 0 }}
                        />
                        <View
                            className={styles.shade()}
                            style={{ left: 0, width: Math.max(0, hole.x), top: hole.y, height: hole.height }}
                        />
                        <View
                            className={styles.shade()}
                            style={{ left: hole.x + hole.width, right: 0, top: hole.y, height: hole.height }}
                        />
                        <View className={styles.ring()} style={hole} aria-hidden />
                    </>
                ) : (
                    <View className={styles.shade()} style={{ left: 0, right: 0, top: 0, bottom: 0 }} />
                )}
                <View
                    role="dialog"
                    aria-labelledby={`${id}title`}
                    {...({ 'aria-describedby': `${id}description` } as object)}
                    accessibilityViewIsModal
                    aria-busy={pending || undefined}
                    className={styles.bubble()}
                    style={{ top: bubbleTop }}
                    onLayout={(event) => setBubbleHeight(event.nativeEvent.layout.height)}
                >
                    <Text className={styles.progress()}>{t.progressText({ current: index, total: steps.length })}</Text>
                    <Text ref={title} nativeID={`${id}title`} role="heading" className={styles.title()}>
                        {step.title}
                    </Text>
                    <Text nativeID={`${id}description`} className={styles.description()}>
                        {step.description}
                    </Text>
                    <View className={styles.footer()}>
                        <Button variant="text" size="sm" onPress={end}>
                            {last ? t.close : t.skip}
                        </Button>
                        <View className={styles.buttons()}>
                            {index > 0 && (
                                <Button variant="outline" size="sm" disabled={pending} onPress={() => go(index - 1)}>
                                    {t.prevStep}
                                </Button>
                            )}
                            <Button
                                ref={next}
                                variant="primary"
                                size="sm"
                                disabled={pending}
                                onPress={() => {
                                    if (!last) return go(index + 1);
                                    onComplete?.();
                                    end();
                                }}
                            >
                                {last ? t.done : t.nextStep}
                            </Button>
                        </View>
                    </View>
                </View>
            </View>
        </Modal>
    );
}
