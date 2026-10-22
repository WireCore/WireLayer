import { markdownElements, prose, type MarkdownElement } from '@wirecore/wirelayer-recipes/native';
import { Check } from 'lucide-react-native';
import { useMemo, type ReactNode } from 'react';
import { Linking, ScrollView, Text, View, type ViewProps } from 'react-native';
import { Icon } from '../../utils/Icon.js';

export interface MarkdownProps extends ViewProps {
    /** The Markdown text – rendered as elements, never as HTML */
    source: string;
    /** Heading level of `#` (default 2) */
    headingLevel?: number;
    /** A single line break is a break (chat style) instead of a space */
    breaks?: boolean;
    /** A code block, e.g. with own highlighting (default: monospace text) */
    renderCode?: (code: { language?: string; code: string }) => ReactNode;
    /** A tap on a link (default: Linking.openURL) – only http(s), mailto, tel and relative links get here */
    onLinkPress?: (href: string) => void;
    className?: string;
}

type Node = MarkdownElement | string;
const inlineTags = new Set(['strong', 'em', 'del', 'code', 'a', 'br']);
const isInline = (node: Node) => typeof node === 'string' || inlineTags.has(node.tag);

/**
 * Markdown with the shared parser of the web (`markdownElements`): headings, lists and task lists, links, code,
 * quotes and tables as React Native views and nested Text – no HTML, no web view.
 */
export function Markdown({
    source,
    headingLevel,
    breaks,
    renderCode,
    onLinkPress = (href) => void Linking.openURL(href),
    className,
    ...props
}: MarkdownProps) {
    const styles = prose();
    const elements = useMemo(() => markdownElements(source, { headingLevel, breaks }), [source, headingLevel, breaks]);

    const inline = (node: Node, key: number): ReactNode => {
        if (typeof node === 'string') return node;
        const children = node.children.map(inline);
        switch (node.tag) {
            case 'br':
                return '\n';
            case 'strong':
                return (
                    <Text key={key} className={styles.strong()}>
                        {children}
                    </Text>
                );
            case 'em':
                return (
                    <Text key={key} className={styles.em()}>
                        {children}
                    </Text>
                );
            case 'del':
                return (
                    <Text key={key} className={styles.del()}>
                        {children}
                    </Text>
                );
            case 'code':
                return (
                    <Text key={key} className={styles.code()}>
                        {children}
                    </Text>
                );
            case 'a': {
                const href = String(node.attrs.href ?? '');
                return (
                    <Text key={key} role="link" className={styles.link()} onPress={() => onLinkPress(href)}>
                        {children}
                    </Text>
                );
            }
            default:
                return <Text key={key}>{children}</Text>;
        }
    };

    /** Inline content as one Text (a paragraph), blocks as views */
    const content = (nodes: Node[], textClass: string): ReactNode =>
        nodes.every(isInline) ? <Text className={textClass}>{nodes.map(inline)}</Text> : nodes.map(block);

    const block = (node: Node, key: number): ReactNode => {
        if (typeof node === 'string')
            return (
                <Text key={key} className={styles.p()}>
                    {node}
                </Text>
            );
        if (node.code) {
            if (renderCode)
                return <View key={key}>{renderCode({ language: node.code.language, code: node.code.text })}</View>;
            return (
                <ScrollView key={key} horizontal className={styles.pre()}>
                    <Text className={styles.preText()}>{node.code.text}</Text>
                </ScrollView>
            );
        }
        const heading = /^h([1-6])$/.exec(node.tag);
        if (heading) {
            const level = Number(heading[1]) as 1 | 2 | 3 | 4 | 5 | 6;
            const classes = [styles.h1, styles.h2, styles.h3, styles.h4, styles.h5, styles.h6][level - 1]!;
            return (
                <Text key={key} role="heading" aria-level={level} className={classes()}>
                    {node.children.map(inline)}
                </Text>
            );
        }
        switch (node.tag) {
            case 'p':
                return (
                    <Text key={key} className={styles.p()}>
                        {node.children.map(inline)}
                    </Text>
                );
            case 'hr':
                return <View key={key} role="separator" className={styles.hr()} />;
            case 'blockquote':
                return (
                    <View key={key} className={styles.blockquote()}>
                        {node.children.map(block)}
                    </View>
                );
            case 'ul':
            case 'ol': {
                const start = Number(node.attrs.start ?? 1);
                return (
                    <View key={key} role="list" className={styles.list()}>
                        {node.children.map((item, index) =>
                            typeof item === 'string'
                                ? null
                                : listItem(item, index, node.tag === 'ol' ? `${start + index}.` : '•')
                        )}
                    </View>
                );
            }
            case 'table':
                return (
                    <ScrollView key={key} horizontal>
                        <View role="table" className={styles.table()}>
                            {node.children.flatMap((section) =>
                                typeof section === 'string'
                                    ? []
                                    : section.children.map((row, index) =>
                                          tableRow(row, `${section.tag}${index}`, section.tag === 'thead')
                                      )
                            )}
                        </View>
                    </ScrollView>
                );
            default:
                return <View key={key}>{node.children.map(block)}</View>;
        }
    };

    const listItem = (item: MarkdownElement, key: number, marker: string) => {
        if (item.attrs['data-type'] === 'taskItem') {
            // [label > input, div > content]
            const [label, body] = item.children as MarkdownElement[];
            const input = label?.children[0] as MarkdownElement | undefined;
            const checked = !!input?.attrs.checked;
            return (
                <View key={key} role="listitem" className={styles.listItem()}>
                    <View
                        role="checkbox"
                        aria-checked={checked}
                        aria-disabled
                        aria-label={String(input?.attrs['aria-label'] ?? '')}
                        className={styles.check()}
                    >
                        {checked && <Icon icon={Check} className={styles.checkIcon()} />}
                    </View>
                    <View className={styles.listContent()}>{content(body?.children ?? [], styles.p())}</View>
                </View>
            );
        }
        return (
            <View key={key} role="listitem" className={styles.listItem()}>
                <Text className={styles.bullet()} aria-hidden>
                    {marker}
                </Text>
                <View className={styles.listContent()}>{content(item.children, styles.p())}</View>
            </View>
        );
    };

    const tableRow = (row: Node, key: string, header: boolean) =>
        typeof row === 'string' ? null : (
            <View key={key} role="row" className={styles.row()}>
                {row.children.map((cell, index) =>
                    typeof cell === 'string' ? null : (
                        <Text
                            key={index}
                            role={header ? 'columnheader' : 'cell'}
                            className={header ? styles.headerCell() : styles.cell()}
                        >
                            {cell.children.map(inline)}
                        </Text>
                    )
                )}
            </View>
        );

    return (
        <View {...props} className={styles.base({ class: className })}>
            {elements.map(block)}
        </View>
    );
}
