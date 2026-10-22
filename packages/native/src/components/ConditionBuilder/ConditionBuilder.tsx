import {
    addConditionNode,
    conditionBuilder,
    conditionId,
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
} from '@wirecore/wirelayer-recipes/native';
import { FolderPlus, Plus, Trash2 } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { useTranslations } from '../../locale.js';
import { useAnnouncer } from '../../utils/announce.js';
import { useControllable } from '../../utils/useControllable.js';
import { Button } from '../Button/Button.js';
import { Checkbox } from '../Checkbox/Checkbox.js';
import { DatePicker } from '../DatePicker/DatePicker.js';
import { IconButton } from '../IconButton/IconButton.js';
import { Input } from '../Input/Input.js';
import { MultiSelect } from '../MultiSelect/MultiSelect.js';
import { NumberInput } from '../NumberInput/NumberInput.js';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl.js';
import { Select } from '../Select/Select.js';

export interface ConditionBuilderProps {
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
    /** A "Not" checkbox per group negates it (`not` in the JSON) */
    negatable?: boolean;
    className?: string;
}

/**
 * Nested and/or groups of rules as cards (the mobile layout of the web ConditionBuilder): field, operator and a value
 * editor matching the field type, each a WireLayer control; adding and removing is announced. Same JSON as the web.
 */
export function ConditionBuilder({
    fields,
    value,
    defaultValue,
    onValueChange,
    label,
    maxDepth = 3,
    disabled = false,
    negatable = false,
    className,
}: ConditionBuilderProps) {
    const translations = useTranslations();
    const t = translations.conditionBuilder;
    // The root has a fixed id – the same on server and client
    const [tree, setTree] = useControllable(value, defaultValue ?? emptyConditionGroup('and', 'root'), onValueChange);
    const { announce, region } = useAnnouncer();
    const styles = conditionBuilder();
    const operatorLabel = (operator: ConditionOperator) =>
        translations.dataTable.matchModes[operator] ?? t.operators[operator] ?? operator;
    const change = (id: string, update: (node: ConditionNode) => ConditionNode) =>
        setTree(updateConditionNode(tree, id, update));

    const valueEditor = (rule: ConditionRule, path: string) => {
        const field = fields.find((entry) => entry.id === rule.field);
        if (!field || isValuelessOperator(rule.operator)) return null;
        const name = `${t.value}, ${t.rule(path)}`;
        const set = (next: unknown) => change(rule.id, (node) => ({ ...(node as ConditionRule), value: next }));
        const options = (field.options ?? []).map((option) => ({ value: option.value, label: option.label }));
        if (rule.operator === 'in')
            return (
                <MultiSelect
                    items={options}
                    value={(rule.value as string[] | undefined) ?? []}
                    onValueChange={set}
                    aria-label={name}
                    disabled={disabled}
                />
            );
        const single = (current: unknown, update: (next: unknown) => void, aria: string) => {
            switch (field.type) {
                case 'number':
                    return (
                        <NumberInput
                            value={(current as number | null | undefined) ?? null}
                            onValueChange={update}
                            aria-label={aria}
                            disabled={disabled}
                        />
                    );
                case 'date':
                    return (
                        <DatePicker
                            value={(current as string | null | undefined) ?? null}
                            onValueChange={update}
                            aria-label={aria}
                            disabled={disabled}
                        />
                    );
                case 'select':
                    return (
                        <Select
                            items={options}
                            value={(current as string | null | undefined) ?? null}
                            onValueChange={update}
                            aria-label={aria}
                            disabled={disabled}
                        />
                    );
                case 'boolean':
                    return (
                        <SegmentedControl
                            label={aria}
                            items={[
                                { value: 'true', label: t.yes },
                                { value: 'false', label: t.no },
                            ]}
                            value={current === false ? 'false' : 'true'}
                            onValueChange={(next) => update(next === 'true')}
                            disabled={disabled}
                        />
                    );
                default:
                    return (
                        <Input
                            value={(current as string | undefined) ?? ''}
                            onChangeText={update}
                            aria-label={aria}
                            disabled={disabled}
                        />
                    );
            }
        };
        if (rule.operator === 'between') {
            const range = (rule.value as [unknown, unknown] | undefined) ?? [null, null];
            return (
                <View className={styles.actions()}>
                    {single(range[0], (next) => set([next, range[1]]), `${t.from}, ${t.rule(path)}`)}
                    {single(range[1], (next) => set([range[0], next]), `${t.to}, ${t.rule(path)}`)}
                </View>
            );
        }
        return single(rule.value, set, name);
    };

    const ruleCard = (rule: ConditionRule, path: string) => {
        const field = fields.find((entry) => entry.id === rule.field);
        return (
            <View key={rule.id} role="group" aria-label={t.rule(path)} className={styles.rule()}>
                <View className={styles.ruleHeader()}>
                    <Text className={styles.ruleTitle()} aria-hidden>
                        {t.rule(path)}
                    </Text>
                    <IconButton
                        icon={Trash2}
                        label={t.removeRule(path)}
                        variant="text"
                        size="sm"
                        disabled={disabled}
                        onPress={() => {
                            setTree(removeConditionNode(tree, rule.id));
                            announce(t.removed);
                        }}
                    />
                </View>
                <Select
                    items={fields.map((entry) => ({ value: entry.id, label: entry.label }))}
                    value={rule.field}
                    onValueChange={(next) =>
                        next && change(rule.id, (node) => setConditionField(node as ConditionRule, fields, next))
                    }
                    aria-label={`${t.field}, ${t.rule(path)}`}
                    disabled={disabled}
                />
                <Select
                    items={operatorsFor(field).map((operator) => ({ value: operator, label: operatorLabel(operator) }))}
                    value={rule.operator}
                    onValueChange={(next) =>
                        next &&
                        change(rule.id, (node) =>
                            setConditionOperator(node as ConditionRule, fields, next as ConditionOperator)
                        )
                    }
                    aria-label={`${t.operator}, ${t.rule(path)}`}
                    disabled={disabled}
                />
                {valueEditor(rule, path)}
            </View>
        );
    };

    const groupCard = (group: ConditionGroup, path: string, depth: number): ReactNode => {
        const root = depth === 0;
        const name = root ? (label ?? t.label) : t.group(path);
        return (
            <View
                key={group.id}
                role="group"
                aria-label={name}
                className={conditionBuilder({ depth: depth % 2 ? 'odd' : 'even' }).group()}
            >
                <View className={styles.groupHeader()}>
                    <SegmentedControl
                        label={`${t.combinator}, ${name}`}
                        size="sm"
                        items={[
                            { value: 'and', label: t.and },
                            { value: 'or', label: t.or },
                        ]}
                        value={group.combinator}
                        onValueChange={(next) =>
                            change(group.id, (node) => ({
                                ...(node as ConditionGroup),
                                combinator: next as 'and' | 'or',
                            }))
                        }
                        disabled={disabled}
                    />
                    {(negatable || group.not) && (
                        <Checkbox
                            checked={!!group.not}
                            disabled={disabled}
                            onCheckedChange={(checked) =>
                                change(group.id, (node) =>
                                    negateConditionGroup(node as ConditionGroup, checked === true)
                                )
                            }
                        >
                            {t.not}
                        </Checkbox>
                    )}
                    {!root && (
                        <IconButton
                            icon={Trash2}
                            label={t.removeGroup(path)}
                            variant="text"
                            size="sm"
                            disabled={disabled}
                            onPress={() => {
                                setTree(removeConditionNode(tree, group.id));
                                announce(t.groupRemoved);
                            }}
                        />
                    )}
                </View>
                <Text className={styles.connector()} aria-hidden>
                    {group.combinator === 'and' ? t.all : t.any}
                </Text>
                <View className={styles.children()}>
                    {group.children.length === 0 && root && <Text className={styles.empty()}>{t.empty}</Text>}
                    {group.children.map((child, index) => {
                        const childPath = root ? String(index + 1) : `${path}.${index + 1}`;
                        return child.type === 'group'
                            ? groupCard(child, childPath, depth + 1)
                            : ruleCard(child, childPath);
                    })}
                </View>
                <View className={styles.actions()}>
                    <Button
                        variant="outline"
                        size="sm"
                        leadingIcon={Plus}
                        disabled={disabled || !fields.length}
                        onPress={() => {
                            setTree(addConditionNode(tree, group.id, newConditionRule(fields)));
                            announce(t.added);
                        }}
                    >
                        {t.addRule}
                    </Button>
                    {depth + 1 < maxDepth && (
                        <Button
                            variant="text"
                            size="sm"
                            leadingIcon={FolderPlus}
                            disabled={disabled || !fields.length}
                            onPress={() => {
                                const added: ConditionGroup = {
                                    ...emptyConditionGroup('and', conditionId()),
                                    children: [newConditionRule(fields)],
                                };
                                setTree(addConditionNode(tree, group.id, added));
                                announce(t.groupAdded);
                            }}
                        >
                            {t.addGroup}
                        </Button>
                    )}
                </View>
            </View>
        );
    };

    return (
        <View className={styles.base({ class: className })}>
            {groupCard(tree, '', 0)}
            {region}
        </View>
    );
}
