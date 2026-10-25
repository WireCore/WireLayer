// The answers of the MCP tools – plain text (Markdown), from the collected component data

export interface PropInfo {
    name: string;
    type: string;
    optional: boolean;
    description: string;
}

/** A slot of a Vue component (`#name`), with the type of its slot props */
export interface SlotInfo {
    name: string;
    props: string;
    description: string;
}

/** An event of a Vue component (`@name`), with its payload */
export interface EventInfo {
    name: string;
    payload: string;
    description: string;
}

export interface ComponentInfo {
    name: string;
    subpath: string;
    description: string;
    category: string;
    story: string | null;
    extends: string | null;
    props: PropInfo[];
    /** "blocks": from @wirecore/wirelayer-blocks-react / @wirecore/wirelayer-blocks-vue instead of @wirecore/wirelayer-react / @wirecore/wirelayer-vue */
    package?: 'blocks';
    /** Slots and events of the Vue component, when it declares any */
    vue?: { slots: SlotInfo[]; events: EventInfo[] };
}

/** Import path of a web component for React or Vue */
export const importPath = (component: ComponentInfo, framework: 'react' | 'vue') =>
    component.package === 'blocks'
        ? `@wirecore/wirelayer-blocks-${framework}`
        : `@wirecore/wirelayer-${framework}${component.subpath}`;

export interface Collected {
    components: ComponentInfo[];
    functions: { name: string; subpath: string; description: string }[];
    guides: { id: string; title: string; text: string }[];
    /** React Native components of @wirecore/wirelayer-native */
    native?: { components: ComponentInfo[]; functions: { name: string; subpath: string; description: string }[] };
    /** Functions and composables of @wirecore/wirelayer-vue */
    vue?: { functions: { name: string; subpath: string; description: string }[] };
}

/** Web (Vue and React) or React Native */
export type Framework = 'web' | 'native';

export const kebab = (value: string) => value.replace(/[A-Z]/g, (char) => `-${char.toLowerCase()}`);

/** How a Vue event is used in a template: update:modelValue → v-model, update:open → v-model:open, filterChange → @filter-change */
export function vueEvent(name: string) {
    const model = name.match(/^update:(.+)$/)?.[1];
    if (model) return model === 'modelValue' ? 'v-model' : `v-model:${kebab(model)}`;
    return `@${kebab(name)}`;
}

/** Vue name of a React prop: className → class, value/onValueChange → v-model, onX → @x */
export function vueName(prop: string, props: string[]) {
    if (prop === 'className') return 'class';
    const model = prop.match(/^on(\w+)Change$/);
    if (model) {
        const name = model[1]!.charAt(0).toLowerCase() + model[1]!.slice(1);
        if (props.includes(name)) return name === 'value' ? 'v-model' : `v-model:${kebab(name)}`;
    }
    if (/^on[A-Z]/.test(prop)) return `@${kebab(prop.slice(2).charAt(0).toLowerCase() + prop.slice(3))}`;
    if (prop === 'value') return 'v-model (modelValue)';
    return kebab(prop);
}

const words = (text: string) => text.toLowerCase().split(/\s+/).filter(Boolean);

export function createTools(data: Collected) {
    const nativeComponents = data.native?.components ?? [];
    const componentsOf = (framework: Framework = 'web') =>
        framework === 'native' ? nativeComponents : data.components;
    const findIn = (list: ComponentInfo[], name: string) =>
        list.find((component) => component.name.toLowerCase() === name.trim().toLowerCase());
    const find = (name: string) => findIn(data.components, name);
    const line = (component: ComponentInfo, framework: Framework = 'web') =>
        `- ${component.name} (${component.category || 'Other'}, ${framework === 'native' ? `@wirecore/wirelayer-native${component.subpath}` : importPath(component, 'react')}): ${component.description || '–'}`;
    const nativeText = (component: ComponentInfo) =>
        [
            `# ${component.name} (React Native)`,
            '',
            component.description || '(no description)',
            '',
            `Import: import { ${component.name} } from '@wirecore/wirelayer-native${component.subpath}'`,
            component.category ? `Category: ${component.category}` : '',
            component.story ? `Storybook: ?path=/story/native_${component.story}` : '',
            component.extends ? `Also takes the props of: ${component.extends}` : '',
            '',
            'Props (name: type – description):',
            ...component.props.map(
                (prop) =>
                    `- ${prop.name}${prop.optional ? '?' : ''}: ${prop.type}${prop.description ? ` – ${prop.description}` : ''}`
            ),
        ]
            .filter((entry, index, all) => entry !== '' || all[index - 1] !== '')
            .join('\n');
    return {
        list(category?: string, framework: Framework = 'web') {
            const all = componentsOf(framework);
            const list = category
                ? all.filter((component) => component.category.toLowerCase() === category.toLowerCase())
                : all;
            if (list.length === 0)
                return `No components in "${category}". Categories: ${[...new Set(all.map((c) => c.category))].join(', ')}`;
            return list.map((component) => line(component, framework)).join('\n');
        },
        get(name: string, framework?: Framework) {
            const nativeComponent = findIn(nativeComponents, name);
            // React Native when asked for it – or when only React Native has the component
            if (nativeComponent && (framework === 'native' || !find(name))) return nativeText(nativeComponent);
            const component = framework === 'native' ? undefined : find(name);
            if (!component) {
                const similar = componentsOf(framework).filter((c) =>
                    c.name.toLowerCase().includes(name.toLowerCase())
                );
                return `No component "${name}"${framework === 'native' ? ' in React Native' : ''}.${similar.length ? ` Did you mean: ${similar.map((c) => c.name).join(', ')}?` : ''}`;
            }
            const names = component.props.map((prop) => prop.name);
            return [
                `# ${component.name}`,
                '',
                component.description || '(no description)',
                '',
                `React: import { ${component.name} } from '${importPath(component, 'react')}'`,
                `Vue: import { ${component.name} } from '${importPath(component, 'vue')}'`,
                component.category ? `Category: ${component.category}` : '',
                component.story ? `Storybook: ?path=/story/react_${component.story}` : '',
                component.extends ? `Also takes the attributes of: ${component.extends}` : '',
                nativeComponent
                    ? `React Native: import { ${nativeComponent.name} } from '@wirecore/wirelayer-native${nativeComponent.subpath}' (get_component with framework "native")`
                    : '',
                '',
                'Props (React name → Vue name: type – description):',
                ...component.props.map(
                    (prop) =>
                        `- ${prop.name}${prop.optional ? '?' : ''} → ${vueName(prop.name, names)}: ${prop.type}${prop.description ? ` – ${prop.description}` : ''}`
                ),
                ...(component.vue?.events.length
                    ? [
                          '',
                          'Vue events (in the template: payload – description):',
                          ...component.vue.events.map(
                              (event) =>
                                  `- ${vueEvent(event.name)}: ${event.payload || '–'}${event.description ? ` – ${event.description}` : ''}`
                          ),
                      ]
                    : []),
                ...(component.vue?.slots.length
                    ? [
                          '',
                          'Vue slots (#name: slot props – description; React: the props of type ReactNode or render functions):',
                          ...component.vue.slots.map(
                              (slot) =>
                                  `- #${slot.name}: ${slot.props || '–'}${slot.description ? ` – ${slot.description}` : ''}`
                          ),
                      ]
                    : []),
            ]
                .filter((entry, index, all) => entry !== '' || all[index - 1] !== '')
                .join('\n');
        },
        search(query: string, framework: Framework = 'web') {
            const terms = words(query);
            const scored = componentsOf(framework)
                .map((component) => {
                    const haystack = [
                        component.name,
                        component.description,
                        component.category,
                        ...component.props.map((prop) => `${prop.name} ${prop.description}`),
                    ]
                        .join(' ')
                        .toLowerCase();
                    const score = terms.reduce(
                        (sum, term) =>
                            sum +
                            (component.name.toLowerCase().includes(term) ? 5 : 0) +
                            (haystack.includes(term) ? 1 : 0),
                        0
                    );
                    return { component, score };
                })
                .filter((entry) => entry.score > 0)
                .sort((a, b) => b.score - a.score)
                .slice(0, 12);
            return scored.length
                ? scored.map((entry) => line(entry.component, framework)).join('\n')
                : `Nothing found for "${query}".`;
        },
        guide(topic?: string) {
            const list = () => data.guides.map((guide) => `- ${guide.id}: ${guide.title}`).join('\n');
            if (!topic) return `Guides:\n${list()}`;
            const terms = words(topic);
            const guide =
                data.guides.find((entry) => entry.id === topic) ??
                data.guides.find((entry) =>
                    terms.every((term) => `${entry.id} ${entry.title}`.toLowerCase().includes(term))
                );
            return guide ? `# ${guide.title}\n\n${guide.text}` : `No guide "${topic}". Guides:\n${list()}`;
        },
    };
}
