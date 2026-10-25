import { Popover as ArkPopover } from '@ark-ui/react/popover';
import { Portal } from '@ark-ui/react/portal';
import {
    dataTable as dataTableRecipe,
    emptyFilterRule,
    isActiveFilter,
    isRangeMatchMode,
    matchModeDefinition,
    matchModeLabel,
    matchModesFor,
    toFilterRule,
    type DataTableFilterRule,
    type DataTableFilterType,
    type DataTableFilterValue,
    type DataTableMatchMode,
} from '@wirecore/wirelayer-recipes';
import { Filter, Plus, Trash2 } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { Button } from '../components/Button/Button.js';
import { IconButton } from '../components/IconButton/IconButton.js';
import { Select } from '../components/Select/Select.js';
import { useLocale, useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { ValueInput } from './ValueInput.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';

export interface FilterMenuProps {
    header: string;
    type: DataTableFilterType;
    value: DataTableFilterValue | undefined;
    onChange: (value: DataTableFilterValue | undefined) => void;
    options?: readonly unknown[];
    matchModes?: readonly DataTableMatchMode[];
    maxConstraints: number;
    /** Own input for the value of a condition (the column's renderFilter) */
    renderValue?: (props: { value: unknown; setValue: (value: unknown) => void }) => ReactNode;
}

/** Filter menu of a column: conditions (match mode + value) joined with and/or, applied together */
export function FilterMenu({
    header,
    type,
    value,
    onChange,
    options,
    matchModes,
    maxConstraints,
    renderValue,
}: FilterMenuProps) {
    const dataTable = useRecipe('dataTable', dataTableRecipe);
    const styles = dataTable();
    const t = useTranslations().dataTable;
    const { locale } = useLocale();
    const [open, setOpen] = useState(false);
    const [draft, setDraft] = useState<DataTableFilterRule>(() => emptyFilterRule(type));
    const active = isActiveFilter(value);
    const modes = matchModesFor(type, matchModes);
    /** Input of a condition: the one of an own match mode, or of the filter type */
    const inputType = (mode: DataTableMatchMode) => matchModeDefinition(mode)?.input ?? type;

    const onOpenChange = (next: boolean) => {
        // A copy: nothing changes until "Apply"
        if (next) setDraft(structuredClone(toFilterRule(value ?? emptyFilterRule(type), type)));
        setOpen(next);
    };
    const update = (index: number, change: Partial<DataTableFilterRule['constraints'][number]>) =>
        setDraft((old) => ({
            ...old,
            constraints: old.constraints.map((constraint, position) =>
                position === index ? { ...constraint, ...change } : constraint
            ),
        }));
    const setMode = (index: number, matchMode: DataTableMatchMode) => {
        const constraint = draft.constraints[index]!;
        // "between" takes two values, the others one
        const reset = isRangeMatchMode(matchMode) !== isRangeMatchMode(constraint.matchMode);
        update(index, reset ? { matchMode, value: isRangeMatchMode(matchMode) ? [null, null] : null } : { matchMode });
    };
    const setRange = (index: number, part: 0 | 1, next: unknown) => {
        const constraint = draft.constraints[index]!;
        const range = Array.isArray(constraint.value) ? [...constraint.value] : [null, null];
        range[part] = next;
        update(index, { value: range });
    };
    const apply = () => {
        onChange(isActiveFilter(draft) ? structuredClone(draft) : undefined);
        setOpen(false);
    };
    const clear = () => {
        onChange(undefined);
        setOpen(false);
    };

    return (
        <ArkPopover.Root
            open={open}
            onOpenChange={(details) => onOpenChange(details.open)}
            positioning={{ placement: 'bottom-end', gutter: 4 }}
            lazyMount
            unmountOnExit
        >
            <ArkPopover.Trigger
                className={styles.headButton()}
                aria-label={t.filterMenu(header, active)}
                data-active={active || undefined}
            >
                <Filter className={styles.headButtonIcon()} aria-hidden="true" />
            </ArkPopover.Trigger>
            <Portal>
                <ArkPopover.Positioner>
                    <ArkPopover.Content className={styles.filterPanel()} aria-label={t.filterMenu(header, false)}>
                        <form
                            className={styles.filterForm()}
                            onSubmit={(event) => {
                                event.preventDefault();
                                apply();
                            }}
                        >
                            {draft.constraints.length > 1 && (
                                <Select
                                    aria-label={t.operator}
                                    items={[
                                        { value: 'and', label: t.matchAll },
                                        { value: 'or', label: t.matchAny },
                                    ]}
                                    value={draft.operator}
                                    onValueChange={(next) =>
                                        setDraft((old) => ({ ...old, operator: next === 'or' ? 'or' : 'and' }))
                                    }
                                />
                            )}
                            {draft.constraints.map((constraint, index) => (
                                <div key={index} className={styles.filterRule()}>
                                    <div className={styles.filterRuleHead()}>
                                        {modes.length > 1 && (
                                            <Select
                                                className={styles.filterMode()}
                                                aria-label={t.matchMode(index)}
                                                items={modes.map((mode) => ({
                                                    value: mode,
                                                    label: matchModeLabel(mode, t.matchModes, locale),
                                                }))}
                                                value={constraint.matchMode}
                                                onValueChange={(next) =>
                                                    setMode(index, (next ?? modes[0]) as DataTableMatchMode)
                                                }
                                            />
                                        )}
                                        {draft.constraints.length > 1 && (
                                            <IconButton
                                                icon={Trash2}
                                                label={t.removeRule(index)}
                                                variant="text"
                                                size="sm"
                                                onClick={() =>
                                                    setDraft((old) => ({
                                                        ...old,
                                                        constraints: old.constraints.filter(
                                                            (_, position) => position !== index
                                                        ),
                                                    }))
                                                }
                                            />
                                        )}
                                    </div>
                                    {renderValue ? (
                                        renderValue({
                                            value: constraint.value,
                                            setValue: (next) => update(index, { value: next }),
                                        })
                                    ) : isRangeMatchMode(constraint.matchMode) ? (
                                        <div className={styles.filterRange()}>
                                            <ValueInput
                                                type={inputType(constraint.matchMode)}
                                                label={`${t.value(index)}, ${t.from}`}
                                                options={options}
                                                value={Array.isArray(constraint.value) ? constraint.value[0] : null}
                                                onChange={(next) => setRange(index, 0, next)}
                                            />
                                            <ValueInput
                                                type={inputType(constraint.matchMode)}
                                                label={`${t.value(index)}, ${t.to}`}
                                                options={options}
                                                value={Array.isArray(constraint.value) ? constraint.value[1] : null}
                                                onChange={(next) => setRange(index, 1, next)}
                                            />
                                        </div>
                                    ) : (
                                        <ValueInput
                                            type={inputType(constraint.matchMode)}
                                            label={t.value(index)}
                                            options={options}
                                            value={constraint.value}
                                            onChange={(next) => update(index, { value: next })}
                                        />
                                    )}
                                </div>
                            ))}
                            {draft.constraints.length < maxConstraints && (
                                <Button
                                    variant="text"
                                    size="sm"
                                    className={styles.filterAdd()}
                                    leadingIcon={Plus}
                                    onClick={() =>
                                        setDraft((old) => ({
                                            ...old,
                                            constraints: [...old.constraints, { matchMode: modes[0]!, value: null }],
                                        }))
                                    }
                                >
                                    {t.addRule}
                                </Button>
                            )}
                            <div className={styles.filterActions()}>
                                <Button variant="outline" size="sm" onClick={clear}>
                                    {t.clear}
                                </Button>
                                <Button type="submit" size="sm">
                                    {t.apply}
                                </Button>
                            </div>
                        </form>
                    </ArkPopover.Content>
                </ArkPopover.Positioner>
            </Portal>
        </ArkPopover.Root>
    );
}
