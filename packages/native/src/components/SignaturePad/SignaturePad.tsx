import { pointsToPath, signaturePad, signatureSvg, typedSignature } from '@wirecore/wirelayer-recipes/native';
import { Eraser, Keyboard, PenLine, Undo2 } from 'lucide-react-native';
import { useId, useState } from 'react';
import { Text, View, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { Field } from '../Field/Field.js';
import { Input } from '../Input/Input.js';

export interface SignaturePadProps {
    /** The signature as SVG data URL ("" when empty, controlled) */
    value?: string;
    onValueChange?: (value: string) => void;
    /** The strokes as SVG paths (controlled – to restore or store them) */
    paths?: string[];
    defaultPaths?: string[];
    onPathsChange?: (paths: string[]) => void;
    /** Visible label, also the name of the field (default "Signature") */
    label?: string;
    /** Ink colour – a real colour (it is exported), default black on the light sheet */
    color?: string;
    /** Stroke width in pt (default 2) */
    strokeWidth?: number;
    /** Offers typing the name instead of drawing (accessible alternative) */
    typedAlternative?: boolean;
    /** The typed name (controlled) */
    typedName?: string;
    onTypedNameChange?: (name: string) => void;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    className?: string;
}

interface Point {
    x: number;
    y: number;
}

/**
 * Signature field: draw with the finger (react-native-svg, gesture responder); "Undo" removes the last stroke. With
 * typedAlternative the name can be typed instead – for screen reader and switch users. The value is an SVG data URL.
 */
export function SignaturePad({
    value,
    onValueChange,
    paths: pathsProp,
    defaultPaths = [],
    onPathsChange,
    label,
    color = '#1a1a1a',
    strokeWidth = 2,
    typedAlternative = false,
    typedName: typedNameProp,
    onTypedNameChange,
    disabled = false,
    readOnly = false,
    invalid = false,
    className,
}: SignaturePadProps) {
    const translations = useTranslations();
    const t = translations.signaturePad;
    const [paths, setPaths] = useControllable(pathsProp, defaultPaths, onPathsChange);
    const [typedName, setTypedName] = useControllable(typedNameProp, '', onTypedNameChange);
    const [, setValue] = useControllable(value, '', onValueChange);
    const [typing, setTyping] = useState(false);
    const [stroke, setStroke] = useState<Point[]>([]);
    const [size, setSize] = useState({ width: 320, height: 160 });
    const id = useId();
    const { announce, region } = useAnnouncer();
    const styles = signaturePad({ invalid, disabled });
    const locked = disabled || readOnly;
    const commit = (next: string[]) => {
        setPaths(next);
        setValue(signatureSvg(next, { width: size.width, height: size.height, color, strokeWidth }));
    };
    const at = (event: GestureResponderEvent): Point => ({
        x: event.nativeEvent.locationX,
        y: event.nativeEvent.locationY,
    });
    const drawing = !locked && !typing;
    // Gesture responder of the canvas: a stroke from touch to release
    const gestures = {
        onStartShouldSetResponder: () => drawing,
        onMoveShouldSetResponder: () => drawing,
        // Keep the stroke while the finger moves – a surrounding ScrollView must not take it over
        onResponderTerminationRequest: () => false,
        onResponderGrant: (event: GestureResponderEvent) => setStroke([at(event)]),
        onResponderMove: (event: GestureResponderEvent) => {
            const point = at(event);
            setStroke((current) => [...current, point]);
        },
        onResponderRelease: () => {
            if (stroke.length) commit([...paths, pointsToPath(stroke)]);
            setStroke([]);
        },
    };
    const typeName = (name: string) => {
        setTypedName(name);
        setValue(name.trim() ? typedSignature(name.trim(), { width: size.width, height: size.height, color }) : '');
    };
    const name = label ?? t.label;
    const empty = typing ? !typedName.trim() : !paths.length && !stroke.length;

    return (
        <View className={styles.base({ class: className })}>
            <Text nativeID={`${id}label`} className={styles.label()}>
                {name}
            </Text>
            <View
                role="application"
                aria-label={`${name}: ${t.control}`}
                aria-disabled={disabled || undefined}
                {...({ 'aria-invalid': invalid || undefined } as object)}
                className={styles.canvas()}
                onLayout={(event: LayoutChangeEvent) =>
                    setSize({ width: event.nativeEvent.layout.width, height: event.nativeEvent.layout.height })
                }
                {...gestures}
            >
                <View className={styles.baseline()} pointerEvents="none" />
                {typing ? (
                    <View className={styles.typed()} pointerEvents="none">
                        <Text className={styles.typedText()} numberOfLines={1} aria-hidden>
                            {typedName}
                        </Text>
                    </View>
                ) : (
                    <Svg width={size.width} height={size.height} pointerEvents="none" aria-hidden>
                        {paths.map((path, index) => (
                            <Path
                                key={index}
                                d={path}
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        ))}
                        {stroke.length > 0 && (
                            <Path
                                d={pointsToPath(stroke)}
                                stroke={color}
                                strokeWidth={strokeWidth}
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                            />
                        )}
                    </Svg>
                )}
                {empty && (
                    <Text className={styles.placeholder()} pointerEvents="none" aria-hidden>
                        {t.placeholder}
                    </Text>
                )}
            </View>
            {typing && (
                <Field label={t.typedLabel}>
                    <Input value={typedName} onChangeText={typeName} autoComplete="name" editable={!locked} />
                </Field>
            )}
            {!readOnly && (
                <View className={styles.toolbar()}>
                    <View className={styles.tools()}>
                        {!typing && (
                            <Button
                                variant="text"
                                size="sm"
                                leadingIcon={Undo2}
                                disabled={disabled || !paths.length}
                                onPress={() => commit(paths.slice(0, -1))}
                            >
                                {t.undo}
                            </Button>
                        )}
                        <Button
                            variant="text"
                            size="sm"
                            leadingIcon={Eraser}
                            disabled={disabled || empty}
                            onPress={() => {
                                if (typing) typeName('');
                                else commit([]);
                                announce(t.cleared);
                            }}
                        >
                            {t.clear}
                        </Button>
                    </View>
                    {typedAlternative && (
                        <Button
                            variant="outline"
                            size="sm"
                            leadingIcon={typing ? PenLine : Keyboard}
                            disabled={disabled}
                            onPress={() => {
                                const next = !typing;
                                setTyping(next);
                                setValue(
                                    next
                                        ? typedName.trim()
                                            ? typedSignature(typedName.trim(), { ...size, color })
                                            : ''
                                        : signatureSvg(paths, { ...size, color, strokeWidth })
                                );
                            }}
                        >
                            {typing ? t.draw : t.type}
                        </Button>
                    )}
                </View>
            )}
            {region}
        </View>
    );
}
