import {
    codeFileKind,
    codeTabs as codeTabsRecipe,
    toolbarIndexForKey,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { useId, useRef, useState, type ComponentProps } from 'react';
import { flushSync } from 'react-dom';
import { CopyButton } from '../components/CopyButton/CopyButton.js';
import { useTranslations } from '../components/LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { CodeHighlight } from './CodeHighlight.js';
import { fileIcons } from './file-icons.js';
import type { CodeLanguageInput } from './highlight.js';

/** A file of CodeHighlightTabs */
export interface CodeFile {
    /** File name: the tab's text and icon, the language when `language` is not given */
    name: string;
    code: string;
    language?: string;
    /** Lines to mark (1-based) */
    highlightLines?: readonly number[];
}

export interface CodeHighlightTabsProps extends Omit<ComponentProps<'div'>, 'children' | 'defaultValue'> {
    files: readonly CodeFile[];
    /** Name of the shown file (controlled) */
    value?: string;
    defaultValue?: string;
    onValueChange?: (name: string) => void;
    /** Accessible name of the tabs (default "Files") */
    label?: string;
    lineNumbers?: boolean;
    /** Copy button for the shown file (default true) */
    copyable?: boolean;
    /** Height limit of the code (CSS length) */
    maxHeight?: string;
    /** With `maxHeight`: cut off there, a button shows all of it */
    expandable?: boolean;
    /** Long lines wrap */
    wrap?: boolean;
    /** More grammars than the built-in ones (see CodeHighlight) */
    languages?: readonly CodeLanguageInput[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof codeTabsRecipe>;
}

/** Several files: tabs with the file names (and an icon by type) above the shown code */
export function CodeHighlightTabs({
    files,
    value,
    defaultValue,
    onValueChange,
    label,
    lineNumbers,
    copyable = true,
    maxHeight,
    expandable,
    wrap,
    languages,
    classes,
    className,
    ...props
}: CodeHighlightTabsProps) {
    const codeTabs = useRecipe('codeTabs', codeTabsRecipe, classes);
    const t = useTranslations().codeHighlight;
    const id = useId();
    const styles = codeTabs();
    const list = useRef<HTMLDivElement>(null);
    const [internal, setInternal] = useState(defaultValue);
    const activeName = value ?? internal ?? files[0]?.name;
    const active = files.find((file) => file.name === activeName) ?? files[0];
    const tabId = (index: number) => `${id}tab${index}`;
    const select = (name: string) => {
        setInternal(name);
        onValueChange?.(name);
    };
    return (
        <div {...props} className={styles.base({ class: className })}>
            <div className={styles.header()}>
                <div ref={list} role="tablist" aria-label={label ?? t.files} className={styles.list()}>
                    {files.map((file, index) => {
                        const Icon = fileIcons[codeFileKind(file.name)];
                        const selected = file.name === active?.name;
                        return (
                            <button
                                key={file.name}
                                id={tabId(index)}
                                type="button"
                                role="tab"
                                className={styles.tab()}
                                aria-selected={selected}
                                aria-controls={`${id}panel`}
                                tabIndex={selected ? 0 : -1}
                                onClick={() => select(file.name)}
                                onKeyDown={(event) => {
                                    // Tabs pattern (APG): arrow keys move and select, Home/End jump
                                    const next = toolbarIndexForKey(event.key, index, files.length, list.current);
                                    if (next === undefined) return;
                                    event.preventDefault();
                                    flushSync(() => select(files[next]!.name));
                                    list.current?.querySelectorAll<HTMLElement>('[role=tab]')[next]?.focus();
                                }}
                            >
                                <Icon className={styles.tabIcon()} aria-hidden="true" />
                                {file.name}
                            </button>
                        );
                    })}
                </div>
                {copyable && active && (
                    <div className={styles.actions()}>
                        <CopyButton value={active.code} label={`${t.copy}: ${active.name}`} />
                    </div>
                )}
            </div>
            {active && (
                <div
                    id={`${id}panel`}
                    role="tabpanel"
                    aria-labelledby={tabId(files.indexOf(active))}
                    className={styles.panel()}
                >
                    <CodeHighlight
                        key={active.name}
                        code={active.code}
                        language={active.language}
                        fileName={active.name}
                        highlightLines={active.highlightLines}
                        lineNumbers={lineNumbers}
                        maxHeight={maxHeight}
                        expandable={expandable}
                        wrap={wrap}
                        languages={languages}
                        header={false}
                        className={styles.panelCode()}
                    />
                </div>
            )}
        </div>
    );
}
