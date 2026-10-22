import { highlight, highlightChunks, type HighlightColor } from '@wirecore/wirelayer-recipes/native';
import { Fragment } from 'react';
import { Text } from 'react-native';

export interface HighlightProps {
    text: string;
    /** Word(s) to mark */
    query: string | string[];
    /** Ignores upper and lower case (default true) */
    ignoreCase?: boolean;
    /** Every hit, not only the first (default true) */
    matchAll?: boolean;
    /** Only whole words */
    wholeWord?: boolean;
    /** "Muller" finds "Müller" */
    ignoreAccents?: boolean;
    /** Colour per search term (default warn) */
    colors?: HighlightColor[];
}

/** Marks the search terms in a text – nested Text, so it fits into a surrounding Text (e.g. a search result) */
export function Highlight({ text, query, ignoreCase, matchAll, wholeWord, ignoreAccents, colors }: HighlightProps) {
    const chunks = highlightChunks(text, query, { ignoreCase, matchAll, wholeWord, ignoreAccents });
    return (
        <>
            {chunks.map((chunk, index) =>
                chunk.match ? (
                    <Text key={index} className={highlight({ color: colors?.[chunk.term ?? 0] })}>
                        {chunk.text}
                    </Text>
                ) : (
                    <Fragment key={index}>{chunk.text}</Fragment>
                )
            )}
        </>
    );
}
