import type { InjectionKey, Ref } from 'vue';

export interface OrgChartNode {
    /** Identifies the node (collapsedKeys, selectedKeys, loadChildren) – default: its position, e.g. "0-1" */
    id?: string;
    label: string;
    /** Second line, e.g. the role */
    title?: string;
    children?: OrgChartNode[];
    /** Has a team that is loaded when it is shown (`loadChildren`, `dataSource` or the `loadChildren` event) */
    hasChildren?: boolean;
    /** false: like `hasChildren: true` */
    leaf?: boolean;
}

/** State of a node, passed to the `node` slot */
export interface OrgChartNodeState {
    key: string;
    selected: boolean;
    expanded: boolean;
    loading: boolean;
}

/** What the nodes of an OrgChart read from it */
export interface OrgChartContext {
    keyOf: (node: OrgChartNode, path: string) => string;
    collapsible: Ref<boolean>;
    selectable: Ref<boolean>;
    branch: (node: OrgChartNode) => boolean;
    expanded: (node: OrgChartNode, key: string) => boolean;
    selected: (key: string) => boolean;
    loading: (key: string) => boolean;
    failed: (key: string) => boolean;
    toggle: (node: OrgChartNode, key: string) => void;
    select: (key: string) => void;
}

export const orgChartKey: InjectionKey<OrgChartContext> = Symbol('OrgChart');
