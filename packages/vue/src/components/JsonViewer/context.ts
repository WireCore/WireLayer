import type { JsonNode } from '@wirecore/wirelayer-recipes';
import type { ComputedRef, InjectionKey } from 'vue';

/** What every node of the JsonViewer reads */
export interface JsonViewerContext {
    query: ComputedRef<string>;
    matches: ComputedRef<Set<string>>;
    copyable: ComputedRef<boolean>;
    showTypes: ComputedRef<boolean>;
    copy: (node: JsonNode) => void;
}

export const jsonViewerKey: InjectionKey<JsonViewerContext> = Symbol('wirecore-json-viewer');
