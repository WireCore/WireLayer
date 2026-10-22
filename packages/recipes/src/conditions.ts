import { dataTableMatchModes, matchesConstraint, type DataTableFilterType } from './data-table.js';

// Condition trees for the ConditionBuilder and the DataTable's advanced filter: nested and/or groups of rules
// (field, operator, value). Plain JSON – store it, send it to a server or test rows with matchesCondition.

export type ConditionFieldType = 'text' | 'number' | 'date' | 'select' | 'boolean';

export interface ConditionFieldOption {
    value: string;
    label: string;
}

/** A field rules can test, e.g. { id: 'load', label: 'Load', type: 'number' } */
export interface ConditionField {
    id: string;
    label: string;
    type: ConditionFieldType;
    /** Choices of a `select` field */
    options?: ConditionFieldOption[];
    /** Operators offered for the field (default: all of its type) */
    operators?: ConditionOperator[];
    /** Reads the value of a row (default: `row[id]`) */
    accessor?: (row: never) => unknown;
}

/**
 * Operators: the DataTable match modes of the field type (`contains`, `equals`, `gt`, `between`, `dateBefore`, `in` …)
 * plus `empty` and `notEmpty`
 */
export type ConditionOperator =
    | 'startsWith'
    | 'contains'
    | 'notContains'
    | 'endsWith'
    | 'equals'
    | 'notEquals'
    | 'lt'
    | 'lte'
    | 'gt'
    | 'gte'
    | 'between'
    | 'in'
    | 'dateIs'
    | 'dateIsNot'
    | 'dateBefore'
    | 'dateAfter'
    | 'empty'
    | 'notEmpty';

export interface ConditionRule {
    type: 'rule';
    id: string;
    field: string;
    operator: ConditionOperator;
    /** The value; `between` takes [from, to], `in` a list, `empty`/`notEmpty` none */
    value?: unknown;
}

export interface ConditionGroup {
    type: 'group';
    id: string;
    /** `and`: all children hold; `or`: one is enough */
    combinator: 'and' | 'or';
    /** Negates the group ("not") */
    not?: boolean;
    children: ConditionNode[];
}

export type ConditionNode = ConditionRule | ConditionGroup;

/** Operators per field type – the first is the default */
export const conditionOperators: Record<ConditionFieldType, ConditionOperator[]> = {
    text: [...(dataTableMatchModes.text as ConditionOperator[]), 'empty', 'notEmpty'],
    number: [...(dataTableMatchModes.number as ConditionOperator[]), 'empty', 'notEmpty'],
    date: [...(dataTableMatchModes.date as ConditionOperator[]), 'empty', 'notEmpty'],
    select: ['equals', 'notEquals', 'in', 'empty', 'notEmpty'],
    boolean: ['equals'],
};

/** Operators that take no value */
export const isValuelessOperator = (operator: ConditionOperator) => operator === 'empty' || operator === 'notEmpty';

let counter = 0;
/** A new id for a node */
export const conditionId = () => `c${Date.now().toString(36)}${(counter++).toString(36)}`;

/** An empty group */
export function emptyConditionGroup(combinator: 'and' | 'or' = 'and', id = conditionId()): ConditionGroup {
    return { type: 'group', id, combinator, children: [] };
}

/** The operators of a field */
export function operatorsFor(field: ConditionField | undefined): ConditionOperator[] {
    if (!field) return [];
    return field.operators ?? conditionOperators[field.type];
}

/** Value a fresh rule (or a rule after changing the operator) starts with */
export function initialConditionValue(field: ConditionField | undefined, operator: ConditionOperator): unknown {
    if (!field || isValuelessOperator(operator)) return undefined;
    if (operator === 'between') return [null, null];
    if (operator === 'in') return [];
    if (field.type === 'boolean') return true;
    if (field.type === 'number' || field.type === 'date') return null;
    return '';
}

/** A new rule for the first field (or the given one) */
export function newConditionRule(fields: ConditionField[], fieldId?: string, id = conditionId()): ConditionRule {
    const field = fields.find((entry) => entry.id === fieldId) ?? fields[0];
    const operator = operatorsFor(field)[0] ?? 'equals';
    return { type: 'rule', id, field: field?.id ?? '', operator, value: initialConditionValue(field, operator) };
}

/** The group negated (`not: true`) or not – without `not` in the JSON when not negated */
export function negateConditionGroup(group: ConditionGroup, not: boolean): ConditionGroup {
    const rest = { ...group };
    delete rest.not;
    return not ? { ...rest, not: true } : rest;
}

/** Applies `change` to the node with `id` (anywhere in the tree); returns a new tree */
export function updateConditionNode(
    tree: ConditionGroup,
    id: string,
    change: (node: ConditionNode) => ConditionNode
): ConditionGroup {
    if (tree.id === id) return change(tree) as ConditionGroup;
    return {
        ...tree,
        children: tree.children.map((child) =>
            child.id === id ? change(child) : child.type === 'group' ? updateConditionNode(child, id, change) : child
        ),
    };
}

/** Adds a node at the end of the group `groupId` */
export function addConditionNode(tree: ConditionGroup, groupId: string, node: ConditionNode): ConditionGroup {
    return updateConditionNode(tree, groupId, (group) =>
        group.type === 'group' ? { ...group, children: [...group.children, node] } : group
    );
}

/** Removes the node `id` (the root stays) */
export function removeConditionNode(tree: ConditionGroup, id: string): ConditionGroup {
    return {
        ...tree,
        children: tree.children
            .filter((child) => child.id !== id)
            .map((child) => (child.type === 'group' ? removeConditionNode(child, id) : child)),
    };
}

/** Changes the field of a rule: the operator and value start over when the type changes */
export function setConditionField(rule: ConditionRule, fields: ConditionField[], fieldId: string): ConditionRule {
    const before = fields.find((field) => field.id === rule.field);
    const field = fields.find((entry) => entry.id === fieldId);
    if (!field) return rule;
    if (before?.type === field.type && operatorsFor(field).includes(rule.operator)) return { ...rule, field: fieldId };
    const operator = operatorsFor(field)[0] ?? 'equals';
    return { ...rule, field: fieldId, operator, value: initialConditionValue(field, operator) };
}

/** Changes the operator of a rule: the value is kept if it still fits */
export function setConditionOperator(
    rule: ConditionRule,
    fields: ConditionField[],
    operator: ConditionOperator
): ConditionRule {
    const field = fields.find((entry) => entry.id === rule.field);
    const shape = (op: ConditionOperator) =>
        isValuelessOperator(op) ? 'none' : op === 'between' ? 'range' : op === 'in' ? 'list' : 'single';
    if (shape(operator) === shape(rule.operator)) return { ...rule, operator };
    return { ...rule, operator, value: initialConditionValue(field, operator) };
}

/** Rules and groups in the tree (the root not counted) */
export function countConditions(tree: ConditionGroup): { rules: number; groups: number } {
    let rules = 0;
    let groups = 0;
    for (const child of tree.children) {
        if (child.type === 'rule') rules++;
        else {
            groups++;
            const inner = countConditions(child);
            rules += inner.rules;
            groups += inner.groups;
        }
    }
    return { rules, groups };
}

const isEmptyValue = (value: unknown) =>
    value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0);

/** Whether a rule has what it needs to filter: a known field and a value (unless the operator takes none) */
export function isCompleteRule(rule: ConditionRule, fields?: ConditionField[]): boolean {
    if (fields && !fields.some((field) => field.id === rule.field)) return false;
    if (isValuelessOperator(rule.operator)) return true;
    if (rule.operator === 'between') return Array.isArray(rule.value) && rule.value.some((part) => !isEmptyValue(part));
    return !isEmptyValue(rule.value);
}

/** Whether a tree filters anything (has at least one complete rule) */
export function isActiveCondition(tree: ConditionGroup | null | undefined, fields?: ConditionField[]): boolean {
    if (!tree) return false;
    return tree.children.some((child) =>
        child.type === 'rule' ? isCompleteRule(child, fields) : isActiveCondition(child, fields)
    );
}

const filterType = (type: ConditionFieldType | undefined): DataTableFilterType => type ?? 'text';

function matchesRule(row: unknown, rule: ConditionRule, fields: ConditionField[] | undefined, locale?: string) {
    const field = fields?.find((entry) => entry.id === rule.field);
    if (fields && !field) return true;
    const cell = field?.accessor
        ? field.accessor(row as never)
        : (row as Record<string, unknown> | null | undefined)?.[rule.field];
    if (rule.operator === 'empty') return isEmptyValue(cell);
    if (rule.operator === 'notEmpty') return !isEmptyValue(cell);
    if (!isCompleteRule(rule)) return true;
    const type = filterType(field?.type);
    if (type === 'select' && rule.operator === 'in')
        return (rule.value as unknown[]).map(String).includes(String(cell ?? ''));
    if (type === 'select') {
        const same = String(cell ?? '') === String(rule.value);
        return rule.operator === 'notEquals' ? !same : same;
    }
    if (type === 'boolean') {
        const truthy = cell === true || cell === 'true';
        return truthy === (rule.value === true || rule.value === 'true');
    }
    return matchesConstraint(cell, { matchMode: rule.operator, value: rule.value }, type, locale);
}

/**
 * Whether a row passes the condition tree. Incomplete rules and empty groups do not filter; fields are looked up in
 * `fields` (type and accessor) – without them the row's property is compared as text.
 */
export function matchesCondition(
    row: unknown,
    tree: ConditionNode | null | undefined,
    fields?: ConditionField[],
    locale?: string
): boolean {
    if (!tree) return true;
    if (tree.type === 'rule') return matchesRule(row, tree, fields, locale);
    const active = tree.children.filter((child) =>
        child.type === 'rule' ? isCompleteRule(child, fields) : isActiveCondition(child, fields)
    );
    if (!active.length) return true;
    const result =
        tree.combinator === 'or'
            ? active.some((child) => matchesCondition(row, child, fields, locale))
            : active.every((child) => matchesCondition(row, child, fields, locale));
    return tree.not ? !result : result;
}

/** The parts of a DataTable column the advanced filter reads */
interface ColumnLike<T> {
    id: string;
    header?: string;
    filter?: string;
    filterOptions?: readonly (string | number | boolean | { value: unknown; label: string })[];
    accessor?: PropertyKey | ((row: T) => unknown);
    columns?: readonly ColumnLike<T>[];
}

/**
 * Condition fields from DataTable columns (DataTable `advancedFilter: true`): every leaf column with a filter type;
 * select columns offer their filterOptions or the values of `rows`
 */
export function conditionFieldsFromColumns<T>(
    columns: readonly ColumnLike<T>[],
    rows: readonly T[] = []
): ConditionField[] {
    const leaves: ColumnLike<T>[] = [];
    const walk = (list: readonly ColumnLike<T>[]) =>
        list.forEach((column) => (column.columns ? walk(column.columns) : leaves.push(column)));
    walk(columns);
    const read = (column: ColumnLike<T>, row: T) =>
        typeof column.accessor === 'function'
            ? column.accessor(row)
            : (row as Record<PropertyKey, unknown>)[column.accessor ?? column.id];
    return leaves
        .filter((column) => column.filter)
        .map((column): ConditionField => {
            const type: ConditionFieldType =
                column.filter === 'number' || column.filter === 'date' || column.filter === 'boolean'
                    ? column.filter
                    : column.filter === 'select' || column.filter === 'multiSelect'
                      ? 'select'
                      : 'text';
            const options =
                type === 'select'
                    ? (
                          column.filterOptions ??
                          [...new Set(rows.map((row) => read(column, row)))].filter(
                              (value): value is string | number => value !== null && value !== undefined && value !== ''
                          )
                      ).map((option) =>
                          typeof option === 'object' && option !== null
                              ? { value: String(option.value), label: option.label }
                              : { value: String(option), label: String(option) }
                      )
                    : undefined;
            return {
                id: column.id,
                label: column.header ?? column.id,
                type,
                ...(options ? { options } : {}),
                accessor: ((row: T) => read(column, row)) as ConditionField['accessor'],
            };
        });
}
