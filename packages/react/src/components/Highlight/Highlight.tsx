import { Highlight as ArkHighlight } from '@ark-ui/react/highlight';
import {
    highlight as highlightRecipe,
    highlightChunks,
    type HighlightColor,
    type RecipeClasses,
} from '@wirecore/wirelayer-recipes';
import { Fragment } from 'react';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface HighlightProps {
    text: string;
    /** Word(s) to mark */
    query: string | string[];
    ignoreCase?: boolean;
    /** Every hit, not only the first */
    matchAll?: boolean;
    /** Only complete words ("Server" does not mark "Webserver") */
    wholeWord?: boolean;
    /** Ignores accents: "Muller" finds "Müller" */
    ignoreAccents?: boolean;
    /** Colour per search term, in the order of `query` (default: all warn) */
    colors?: HighlightColor[];
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof highlightRecipe>;
}

/** Text with the hits as <mark> */
export function Highlight({
    classes,
    text,
    query,
    ignoreCase = true,
    matchAll = true,
    wholeWord = false,
    ignoreAccents = false,
    colors,
}: HighlightProps) {
    const highlight = useRecipe('highlight', highlightRecipe, classes);
    // Ark marks plain hits; whole words, accents and colours per term need the own splitting
    if (!wholeWord && !ignoreAccents && !colors?.length) {
        return (
            <ArkHighlight
                text={text}
                query={query}
                ignoreCase={ignoreCase}
                matchAll={matchAll}
                className={highlight()}
            />
        );
    }
    return (
        <>
            {highlightChunks(text, query, { ignoreCase, matchAll, wholeWord, ignoreAccents }).map((chunk, index) =>
                chunk.match ? (
                    <mark key={index} className={highlight({ color: colors?.[chunk.term ?? 0] })}>
                        {chunk.text}
                    </mark>
                ) : (
                    <Fragment key={index}>{chunk.text}</Fragment>
                )
            )}
        </>
    );
}
