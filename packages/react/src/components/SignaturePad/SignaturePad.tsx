import { useFieldContext } from '@ark-ui/react/field';
import { SignaturePad as ArkSignaturePad, useSignaturePad } from '@ark-ui/react/signature-pad';
import {
    announce,
    signaturePad as signaturePadRecipe,
    typedSignature,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Eraser, Keyboard, PenLine, Undo2 } from 'lucide-react';
import { useEffect, useId, useRef, useState, type CSSProperties } from 'react';
import { Button } from '../Button/Button.js';
import { Input } from '../Input/Input.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface SignaturePadProps {
    /** The signature as data URL ("" when empty, controlled) */
    value?: string;
    onValueChange?: (value: string) => void;
    /** The strokes as SVG paths (controlled – to restore or store them) */
    paths?: string[];
    defaultPaths?: string[];
    onPathsChange?: (paths: string[]) => void;
    /** Format of the data URL: png (default) or svg; a typed signature is always svg */
    format?: 'png' | 'svg';
    /** Visible label, also the name of the field (default "Signature"; a surrounding Field names it, too) */
    label?: string;
    /** Ink colour – a real colour (it is exported), default black on the light sheet */
    color?: string;
    /** Stroke width in px (default 2) */
    strokeWidth?: number;
    /** Offers typing the name instead of drawing (accessible alternative) */
    typedAlternative?: boolean;
    /** The typed name (controlled) */
    typedName?: string;
    onTypedNameChange?: (name: string) => void;
    disabled?: boolean;
    readOnly?: boolean;
    invalid?: boolean;
    required?: boolean;
    /** Name of the hidden form field (its value is the data URL) */
    name?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof signaturePadRecipe>;
}

/**
 * Signature field (role="application"): draw with mouse, pen or finger; "Undo" removes the last stroke.
 * With typedAlternative the name can be typed instead – the field shows it in a handwriting font.
 */
export function SignaturePad({
    classes,
    value,
    onValueChange,
    paths,
    defaultPaths,
    onPathsChange,
    format = 'png',
    label,
    color = '#000000',
    strokeWidth = 2,
    typedAlternative,
    typedName,
    onTypedNameChange,
    disabled,
    readOnly,
    invalid,
    required,
    name,
    className,
    style,
}: SignaturePadProps) {
    const signaturePad = useRecipe('signaturePad', signaturePadRecipe, classes);
    const styles = signaturePad();
    const field = useFieldContext();
    const t = useTranslations().signaturePad;
    const id = useId();
    const labelId = `${id}label`;
    const [internalPaths, setInternalPaths] = useState<string[]>(defaultPaths ?? []);
    const strokes = paths ?? internalPaths;
    const [internalName, setInternalName] = useState('');
    const typed = typedName ?? internalName;
    const [typing, setTyping] = useState(false);
    const [current, setCurrent] = useState(value ?? '');
    const shown = value ?? current;
    const isDisabled = disabled ?? field?.disabled;
    const isReadOnly = readOnly ?? field?.readOnly;
    const isInvalid = invalid ?? field?.invalid;
    const nameText = label ?? t.label;
    const mime = format === 'svg' ? 'image/svg+xml' : 'image/png';
    // Undo/clear: the image is made from the rendered strokes after the next render
    const regenerate = useRef(false);

    const setValue = (next: string) => {
        setCurrent(next);
        onValueChange?.(next);
    };
    const setPaths = (next: string[], render = true) => {
        setInternalPaths(next);
        onPathsChange?.(next);
        regenerate.current = render;
    };
    const api = useSignaturePad({
        id,
        ids: { label: labelId },
        paths: strokes,
        drawing: { fill: color, size: strokeWidth, simulatePressure: true },
        disabled: isDisabled,
        readOnly: isReadOnly,
        required: required ?? field?.required,
        name,
        translations: { control: nameText, clearTrigger: t.clear },
        onDrawEnd: (details) => {
            setPaths(details.paths, false);
            details.getDataUrl(mime).then(setValue, () => undefined);
        },
    });
    useEffect(() => {
        if (!regenerate.current) return;
        regenerate.current = false;
        api.getDataUrl(mime).then(setValue, () => undefined);
    });

    const setName = (next: string) => {
        setInternalName(next);
        onTypedNameChange?.(next);
        setValue(next.trim() ? typedSignature(next.trim(), { color }) : '');
    };
    const clear = () => {
        if (typing) setName('');
        else setPaths([]);
        announce(t.cleared);
    };
    const toggleTyping = () => {
        const next = !typing;
        setTyping(next);
        if (next) setName(typed);
        else setPaths(strokes);
    };

    return (
        <ArkSignaturePad.RootProvider
            value={api}
            className={styles.base({ class: className })}
            style={style}
            data-invalid={isInvalid || undefined}
        >
            {(label || !field) && <ArkSignaturePad.Label className={styles.label()}>{nameText}</ArkSignaturePad.Label>}
            {!typing ? (
                <ArkSignaturePad.Control
                    className={styles.control()}
                    aria-labelledby={label || !field ? labelId : field.ids.label}
                    aria-roledescription={t.roleDescription}
                    aria-describedby={field?.ariaDescribedby}
                    aria-invalid={isInvalid || undefined}
                    data-invalid={isInvalid || undefined}
                >
                    <ArkSignaturePad.Segment className={styles.segment()} aria-hidden="true" />
                    <ArkSignaturePad.Guide className={styles.guide()} />
                    {!strokes.length && (
                        <span className={styles.placeholder()} aria-hidden="true">
                            {t.placeholder}
                        </span>
                    )}
                </ArkSignaturePad.Control>
            ) : (
                <div className={styles.typed()}>
                    <Input
                        value={typed}
                        onChange={(event) => setName(event.currentTarget.value)}
                        aria-label={t.typedLabel}
                        aria-describedby={field?.ariaDescribedby}
                        disabled={isDisabled}
                        readOnly={isReadOnly}
                        autoComplete="name"
                    />
                    <div className={styles.preview()} aria-hidden="true">
                        {typed}
                    </div>
                </div>
            )}
            {!isReadOnly && (
                <div className={styles.toolbar()}>
                    {!typing && (
                        <Button
                            variant="outline"
                            size="sm"
                            leadingIcon={Undo2}
                            disabled={isDisabled || !strokes.length}
                            onClick={() => setPaths(strokes.slice(0, -1))}
                        >
                            {t.undo}
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={Eraser}
                        disabled={isDisabled || !shown}
                        onClick={clear}
                    >
                        {t.clear}
                    </Button>
                    {typedAlternative && (
                        <Button
                            variant="text"
                            size="sm"
                            leadingIcon={typing ? PenLine : Keyboard}
                            disabled={isDisabled}
                            onClick={toggleTyping}
                        >
                            {typing ? t.draw : t.type}
                        </Button>
                    )}
                </div>
            )}
            {name && <ArkSignaturePad.HiddenInput value={shown} />}
        </ArkSignaturePad.RootProvider>
    );
}
