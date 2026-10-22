import {
    addConditionNode,
    announce,
    conditionBuilder as conditionBuilderRecipe,
    emptyConditionGroup,
    isValuelessOperator,
    negateConditionGroup,
    newConditionRule,
    operatorsFor,
    removeConditionNode,
    setConditionField,
    setConditionOperator,
    updateConditionNode,
    type ConditionField,
    type ConditionGroup,
    type ConditionNode,
    type ConditionOperator,
    type ConditionRule,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import {
    Button,
    Checkbox,
    DatePicker,
    IconButton,
    Input,
    MultiSelect,
    NativeSelect,
    NumberInput,
    useRecipe,
    useTranslations,
} from '@wirecore/wirelayer-react';
import { Plus, Trash2 } from 'lucide-react';
import { createContext, useContext, useEffect, useRef, useState, type ComponentProps } from 'react';

/** What the parts of a ConditionBuilder share */
interface ConditionContext {
    fields: ConditionField[];
    maxDepth: number;
    disabled: boolean;
    negatable: boolean;
    update: (id: string, change: (node: ConditionNode) => ConditionNode) => void;
    add: (groupId: string, kind: 'rule' | 'group') => void;
    remove: (id: string, parentId: string) => void;
    operatorLabel: (operator: ConditionOperator) => string;
    classes?: RecipeClasses<typeof conditionBuilderRecipe>;
}

const Context = createContext<ConditionContext | null>(null);

/** The editor for the value of one rule (or one end of a range): matches the field type */
function ConditionValue({
    field,
    rule,
    value,
    label,
    disabled,
    onChange,
}: {
    field: ConditionField | undefined;
    rule: ConditionRule;
    value: unknown;
    label: string;
    disabled: boolean;
    onChange: (value: unknown) => void;
}) {
    const translations = useTranslations();
    const t = translations.conditionBuilder;
    const type = field?.type ?? 'text';
    const options = field?.options ?? [];
    if (type === 'number')
        return (
            <NumberInput
                value={(value as number | null) ?? null}
                aria-label={label}
                disabled={disabled}
                size="sm"
                onValueChange={onChange}
            />
        );
    if (type === 'date')
        return (
            <DatePicker
                value={(value as string | null) ?? null}
                aria-label={label}
                disabled={disabled}
                size="sm"
                onValueChange={onChange}
            />
        );
    if (type === 'select' && rule.operator === 'in')
        return (
            <MultiSelect
                items={options}
                value={(value as string[]) ?? []}
                aria-label={label}
                disabled={disabled}
                onValueChange={onChange}
            />
        );
    if (type === 'select')
        return (
            <NativeSelect
                items={options}
                value={(value as string) ?? ''}
                placeholder={translations.common.placeholder}
                aria-label={label}
                disabled={disabled}
                size="sm"
                onValueChange={onChange}
            />
        );
    if (type === 'boolean')
        return (
            <NativeSelect
                items={[
                    { value: 'true', label: t.yes },
                    { value: 'false', label: t.no },
                ]}
                value={String(value ?? true)}
                aria-label={label}
                disabled={disabled}
                size="sm"
                onValueChange={(next) => onChange(next === 'true')}
            />
        );
    return (
        <Input
            value={(value as string) ?? ''}
            aria-label={label}
            disabled={disabled}
            size="sm"
            onChange={(event) => onChange(event.currentTarget.value)}
        />
    );
}

/** One group of the ConditionBuilder: combinator, its rules and nested groups (recursive) */
function ConditionGroupView({
    group,
    path,
    depth,
    label,
    parentId,
}: {
    group: ConditionGroup;
    /** Position, e.g. "2" or "2.1" ('' for the root) */
    path: string;
    depth: number;
    label?: string;
    parentId?: string;
}) {
    const ctx = useContext(Context)!;
    const conditionBuilder = useRecipe('conditionBuilder', conditionBuilderRecipe, ctx.classes);
    const styles = conditionBuilder({ nested: depth > 0 });
    const t = useTranslations().conditionBuilder;
    const childPath = (index: number) => (path ? `${path}.${index + 1}` : String(index + 1));
    const fieldItems = ctx.fields.map((field) => ({ value: field.id, label: field.label }));
    const fieldOf = (rule: ConditionRule) => ctx.fields.find((field) => field.id === rule.field);
    const updateRule = (rule: ConditionRule, change: (rule: ConditionRule) => ConditionRule) =>
        ctx.update(rule.id, (node) => change(node as ConditionRule));
    return (
        <fieldset className={styles.group()} data-node={group.id}>
            <legend className={styles.legend()}>{path ? t.group(path) : (label ?? t.label)}</legend>
            <div className={styles.groupHeader()}>
                {(ctx.negatable || group.not) && (
                    <Checkbox
                        checked={group.not === true}
                        disabled={ctx.disabled}
                        onCheckedChange={(checked) =>
                            ctx.update(group.id, (node) =>
                                negateConditionGroup(node as ConditionGroup, checked === true)
                            )
                        }
                    >
                        {t.not}
                    </Checkbox>
                )}
                <NativeSelect
                    items={[
                        { value: 'and', label: t.all },
                        { value: 'or', label: t.any },
                    ]}
                    value={group.combinator}
                    aria-label={t.combinator}
                    disabled={ctx.disabled}
                    size="sm"
                    className={styles.combinatorSelect()}
                    onValueChange={(combinator) =>
                        ctx.update(group.id, (node) => ({
                            ...(node as ConditionGroup),
                            combinator: combinator as 'and' | 'or',
                        }))
                    }
                />
                <div className={styles.groupActions()}>
                    <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={Plus}
                        disabled={ctx.disabled}
                        data-action="add-rule"
                        onClick={() => ctx.add(group.id, 'rule')}
                    >
                        {t.addRule}
                    </Button>
                    {depth < ctx.maxDepth && (
                        <Button
                            variant="text"
                            size="sm"
                            leadingIcon={Plus}
                            disabled={ctx.disabled}
                            onClick={() => ctx.add(group.id, 'group')}
                        >
                            {t.addGroup}
                        </Button>
                    )}
                    {parentId && (
                        <IconButton
                            icon={Trash2}
                            label={t.removeGroup(path)}
                            variant="text"
                            size="sm"
                            disabled={ctx.disabled}
                            onClick={() => ctx.remove(group.id, parentId)}
                        />
                    )}
                </div>
            </div>
            {group.children.length ? (
                <ol className={styles.list()}>
                    {group.children.map((child, index) => (
                        <li key={child.id} data-node={child.id}>
                            {index > 0 && (
                                <span className={styles.combinator()} aria-hidden="true">
                                    {group.combinator === 'or' ? t.or : t.and}
                                </span>
                            )}
                            {child.type === 'group' ? (
                                <ConditionGroupView
                                    group={child}
                                    path={childPath(index)}
                                    depth={depth + 1}
                                    parentId={group.id}
                                />
                            ) : (
                                <div role="group" aria-label={t.rule(childPath(index))} className={styles.rule()}>
                                    <NativeSelect
                                        items={fieldItems}
                                        value={child.field}
                                        aria-label={t.field}
                                        disabled={ctx.disabled}
                                        size="sm"
                                        className={styles.field()}
                                        onValueChange={(field) =>
                                            updateRule(child, (rule) => setConditionField(rule, ctx.fields, field))
                                        }
                                    />
                                    <NativeSelect
                                        items={operatorsFor(fieldOf(child)).map((operator) => ({
                                            value: operator,
                                            label: ctx.operatorLabel(operator),
                                        }))}
                                        value={child.operator}
                                        aria-label={t.operator}
                                        disabled={ctx.disabled}
                                        size="sm"
                                        className={styles.operator()}
                                        onValueChange={(operator) =>
                                            updateRule(child, (rule) =>
                                                setConditionOperator(rule, ctx.fields, operator as ConditionOperator)
                                            )
                                        }
                                    />
                                    {child.operator === 'between' ? (
                                        <div className={styles.range()}>
                                            {([0, 1] as const).map((part) => (
                                                <ConditionValue
                                                    key={part}
                                                    field={fieldOf(child)}
                                                    rule={child}
                                                    value={(child.value as unknown[] | undefined)?.[part]}
                                                    label={`${t.value}: ${part === 0 ? t.from : t.to}`}
                                                    disabled={ctx.disabled}
                                                    onChange={(value) =>
                                                        updateRule(child, (rule) => {
                                                            const range = Array.isArray(rule.value)
                                                                ? [...rule.value]
                                                                : [null, null];
                                                            range[part] = value;
                                                            return { ...rule, value: range };
                                                        })
                                                    }
                                                />
                                            ))}
                                        </div>
                                    ) : (
                                        !isValuelessOperator(child.operator) && (
                                            <div className={styles.value()}>
                                                <ConditionValue
                                                    field={fieldOf(child)}
                                                    rule={child}
                                                    value={child.value}
                                                    label={t.value}
                                                    disabled={ctx.disabled}
                                                    onChange={(value) =>
                                                        updateRule(child, (rule) => ({ ...rule, value }))
                                                    }
                                                />
                                            </div>
                                        )
                                    )}
                                    <IconButton
                                        icon={Trash2}
                                        label={t.removeRule(childPath(index))}
                                        variant="text"
                                        size="sm"
                                        disabled={ctx.disabled}
                                        onClick={() => ctx.remove(child.id, group.id)}
                                    />
                                </div>
                            )}
                        </li>
                    ))}
                </ol>
            ) : (
                <p className={styles.empty()}>{t.empty}</p>
            )}
        </fieldset>
    );
}

export interface ConditionBuilderProps extends Omit<ComponentProps<'div'>, 'defaultValue'> {
    /** Fields the rules can test: id, label, type (text, number, date, select, boolean), options of a select */
    fields: ConditionField[];
    /** The condition tree (JSON: groups with combinator and children, rules with field, operator, value) – controlled */
    value?: ConditionGroup;
    defaultValue?: ConditionGroup;
    onValueChange?: (value: ConditionGroup) => void;
    /** Name of the whole tree (default "Conditions") */
    label?: string;
    /** How deep groups can be nested (default 3) */
    maxDepth?: number;
    disabled?: boolean;
    /** A "Not" checkbox per group negates it (`not` in the JSON); groups that are negated already always show it */
    negatable?: boolean;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof conditionBuilderRecipe>;
}

/**
 * Nested and/or groups of rules: field, operator and a value editor matching the field type. Every control is a native
 * or WireLayer form control (Tab, arrow keys); adding focuses the new rule, removing the group's add button.
 */
export function ConditionBuilder({
    classes,
    fields,
    value,
    defaultValue,
    onValueChange,
    label,
    maxDepth = 3,
    disabled = false,
    negatable = false,
    className,
    ...props
}: ConditionBuilderProps) {
    const conditionBuilder = useRecipe('conditionBuilder', conditionBuilderRecipe, classes);
    const translations = useTranslations();
    const t = translations.conditionBuilder;
    const styles = conditionBuilder();
    const [internal, setInternal] = useState(() => defaultValue ?? emptyConditionGroup('and', 'root'));
    const tree = value ?? internal;
    const root = useRef<HTMLDivElement>(null);
    // Where the focus goes after the next render (into a new rule, or a group's add button)
    const focusTarget = useRef<string | null>(null);
    useEffect(() => {
        if (!focusTarget.current) return;
        root.current?.querySelector<HTMLElement>(focusTarget.current)?.focus();
        focusTarget.current = null;
    });
    const set = (next: ConditionGroup) => {
        setInternal(next);
        onValueChange?.(next);
    };
    const context: ConditionContext = {
        fields,
        maxDepth,
        disabled,
        negatable,
        classes,
        update: (id, change) => set(updateConditionNode(tree, id, change)),
        add: (groupId, kind) => {
            const rule = newConditionRule(fields);
            const node = kind === 'rule' ? rule : { ...emptyConditionGroup(), children: [rule] };
            set(addConditionNode(tree, groupId, node));
            announce(kind === 'rule' ? t.added : t.groupAdded);
            focusTarget.current = `[data-node="${rule.id}"] select`;
        },
        remove: (id, parentId) => {
            set(removeConditionNode(tree, id));
            announce(t.removed);
            focusTarget.current = `[data-node="${parentId}"] [data-action="add-rule"]`;
        },
        operatorLabel: (operator) => t.operators[operator] ?? translations.dataTable.matchModes[operator] ?? operator,
    };
    return (
        <Context value={context}>
            <div {...props} ref={root} className={styles.base({ class: className })}>
                <ConditionGroupView group={tree} path="" depth={0} label={label} />
            </div>
        </Context>
    );
}
