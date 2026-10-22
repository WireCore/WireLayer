import { tour } from '@wirecore/wirelayer-recipes/native';
import { useEffect, useId, useRef, useState, type ComponentRef, type RefObject } from 'react';
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
}

export interface TourProps {
    steps: TourStep[];
    /** Starts the tour */
    open?: boolean;
    /** Called with false when it is finished, skipped or closed */
    onOpenChange?: (open: boolean) => void;
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
export function Tour({ steps, open = false, onOpenChange, onComplete }: TourProps) {
    const translations = useTranslations();
    const t = translations.tour;
    const styles = tour();
    const reducedMotion = useReducedMotion();
    const id = useId();
    const [index, setIndex] = useState(0);
    const [box, setBox] = useState<{ step: string; box: Box } | null>(null);
    const [bubbleHeight, setBubbleHeight] = useState(0);
    const title = useRef<ComponentRef<typeof Text>>(null);
    const next = useRef<ComponentRef<typeof Pressable>>(null);
    const step = steps[Math.min(index, steps.length - 1)];
    const end = () => {
        setIndex(0);
        onOpenChange?.(false);
    };
    useEscape(open, end);

    // Measure the target of the step; move the focus to the step
    useEffect(() => {
        if (!open || !step) return;
        step.target?.current?.measureInWindow((x: number, y: number, width: number, height: number) =>
            setBox({ step: step.id, box: { x, y, width, height } })
        );
        const timer = setTimeout(() => {
            if (Platform.OS === 'web') next.current?.focus();
            else focusElement(title.current);
        }, 50);
        return () => clearTimeout(timer);
    }, [open, step]);

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
        <Modal visible={open} transparent animationType={reducedMotion ? 'none' : 'fade'} onRequestClose={end}>
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
                                <Button variant="outline" size="sm" onPress={() => setIndex(index - 1)}>
                                    {t.prevStep}
                                </Button>
                            )}
                            <Button
                                ref={next}
                                variant="primary"
                                size="sm"
                                onPress={() => {
                                    if (!last) return setIndex(index + 1);
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
