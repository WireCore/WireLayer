import { useStore, type AnyFieldApi } from '@tanstack/react-form';
import { formList as formListRecipe, visuallyHidden, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState, type ComponentProps, type KeyboardEvent, type ReactNode } from 'react';
import { Button } from '../components/Button/Button.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

export interface FormListItemProps {
    index: number;
    /** Name of the entry, e.g. "Contact 2" */
    itemLabel: string;
    remove: () => void;
    moveUp: () => void;
    moveDown: () => void;
}

export interface FormListProps extends Omit<ComponentProps<'fieldset'>, 'children'> {
    /** The TanStack Form field of the array (`<form.Field name="contacts" mode="array">`) */
    field: AnyFieldApi;
    /** Visible name of the list (legend), e.g. "Contacts" */
    label: string;
    /** The value of a new entry, e.g. `() => ({ name: '', email: '' })` */
    newItem: () => unknown;
    /** One entry: its fields (e.g. `<form.Field name={`contacts[${index}].name`}>`) */
    renderItem: (props: FormListItemProps) => ReactNode;
    /** Name of an entry by position (1-based), e.g. (n) => `Contact ${n}` – names the buttons and announcements */
    itemLabel?: (position: number) => string;
    /** Text of the add button (default "Add entry") */
    addLabel?: string;
    /** Fewest entries: remove is disabled at this count */
    min?: number;
    /** Most entries: add is disabled at this count */
    max?: number;
    /** Up/down buttons and Alt+↑/↓ to move entries (default true) */
    reorderable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof formListRecipe>;
}

const CONTROLS = 'input, select, textarea, button:not(:disabled), [tabindex]';
/** All controls, also disabled ones – to find the same control in another entry */
const ALL_CONTROLS = 'input, select, textarea, button, [tabindex]';
const moveButton = (item: HTMLElement) =>
    item.querySelector<HTMLElement>('[data-action=up]:not(:disabled)') ??
    item.querySelector<HTMLElement>('[data-action=down]:not(:disabled)');

/**
 * Repeated entries of a form: numbered list with move up/down (also Alt+↑/↓) and remove per entry, an add button,
 * min/max limits; changes are announced and the focus follows the entry.
 */
export function FormList({
    classes,
    field,
    label,
    newItem,
    renderItem,
    itemLabel,
    addLabel,
    min = 0,
    max,
    reorderable = true,
    className,
    ...props
}: FormListProps) {
    const formList = useRecipe('formList', formListRecipe, classes);
    const t = useTranslations().formList;
    const styles = formList();
    const value = useStore(field.store, (state) => state.value as unknown[] | undefined) ?? [];
    const count = value.length;
    const atMax = max !== undefined && count >= max;
    const atMin = count <= min;
    const [status, setStatus] = useState('');
    const list = useRef<HTMLOListElement>(null);
    const addButton = useRef<HTMLButtonElement>(null);
    const itemName = (index: number) => (itemLabel ?? t.item)(index + 1);
    // What gets the focus after the update: an entry (with a chooser) or the add button
    const [focusTarget, setFocusTarget] = useState<{
        index: number;
        pick?: (item: HTMLElement) => HTMLElement | null | undefined;
    } | null>(null);
    useEffect(() => {
        if (!focusTarget) return;
        if (focusTarget.index < 0) return void addButton.current?.focus();
        const item = list.current?.querySelectorAll<HTMLElement>(':scope > li')[focusTarget.index];
        if (item) (focusTarget.pick?.(item) ?? item.querySelector<HTMLElement>(CONTROLS))?.focus();
    }, [focusTarget]);

    const add = () => {
        if (atMax) return;
        field.pushValue(newItem());
        setStatus(t.added(itemName(count)));
        setFocusTarget({ index: count });
    };
    const remove = (index: number) => {
        if (atMin) return;
        field.removeValue(index);
        setStatus(t.removed(itemName(index)));
        // The entry now in its place, the one before, or the add button
        setFocusTarget(
            count > 1
                ? {
                      index: Math.min(index, count - 2),
                      pick: (item) => item.querySelector<HTMLElement>('[data-action="remove"]:not(:disabled)'),
                  }
                : { index: -1 }
        );
    };
    /** Moves entry `index` by `step`; the focus follows the entry (its move button, or what `pick` chooses) */
    const move = (
        index: number,
        step: -1 | 1,
        pick: (item: HTMLElement) => HTMLElement | null | undefined = moveButton
    ) => {
        const target = index + step;
        if (target < 0 || target >= count) return;
        field.moveValue(index, target);
        setStatus(t.moved(itemName(index), target + 1));
        setFocusTarget({ index: target, pick });
    };
    // Alt+↑/↓ inside an entry moves it; the focus stays on the same control of the moved entry
    const onItemKey = (index: number, event: KeyboardEvent<HTMLLIElement>) => {
        if (!reorderable || !event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
        event.preventDefault();
        const controls = [...event.currentTarget.querySelectorAll<HTMLElement>(ALL_CONTROLS)];
        const position = controls.indexOf(event.target as HTMLElement);
        move(index, event.key === 'ArrowUp' ? -1 : 1, (item) => {
            const same = item.querySelectorAll<HTMLElement>(ALL_CONTROLS)[position];
            return same && !same.matches(':disabled') ? same : moveButton(item);
        });
    };
    const hint = [min > 0 ? t.min(min) : '', max !== undefined ? t.max(max) : ''].filter(Boolean).join(' · ');
    return (
        <fieldset {...props} className={styles.base({ class: className })}>
            <legend className={styles.legend()}>{label}</legend>
            <ol ref={list} className={styles.list()}>
                {value.map((_, index) => (
                    <li
                        key={index}
                        className={styles.item()}
                        aria-label={itemName(index)}
                        onKeyDown={(event) => onItemKey(index, event)}
                    >
                        <span className={styles.index()} aria-hidden="true">
                            {index + 1}
                        </span>
                        <div className={styles.body()}>
                            {renderItem({
                                index,
                                itemLabel: itemName(index),
                                remove: () => remove(index),
                                moveUp: () => move(index, -1),
                                moveDown: () => move(index, 1),
                            })}
                        </div>
                        <div className={styles.actions()}>
                            {reorderable && (
                                <>
                                    <IconButton
                                        icon={ArrowUp}
                                        label={t.moveUp(itemName(index))}
                                        variant="text"
                                        size="sm"
                                        data-action="up"
                                        disabled={index === 0}
                                        onClick={() => move(index, -1)}
                                    />
                                    <IconButton
                                        icon={ArrowDown}
                                        label={t.moveDown(itemName(index))}
                                        variant="text"
                                        size="sm"
                                        data-action="down"
                                        disabled={index === count - 1}
                                        onClick={() => move(index, 1)}
                                    />
                                </>
                            )}
                            <IconButton
                                icon={Trash2}
                                label={t.remove(itemName(index))}
                                variant="text"
                                size="sm"
                                data-action="remove"
                                disabled={atMin}
                                onClick={() => remove(index)}
                            />
                        </div>
                    </li>
                ))}
            </ol>
            <div className={styles.footer()}>
                <Button
                    ref={addButton}
                    variant="outline"
                    size="sm"
                    leadingIcon={Plus}
                    data-action="add"
                    disabled={atMax}
                    onClick={add}
                >
                    {addLabel ?? t.add}
                </Button>
                {hint && <span className={styles.hint()}>{hint}</span>}
            </div>
            <span role="status" className={visuallyHidden()}>
                {status}
            </span>
        </fieldset>
    );
}
