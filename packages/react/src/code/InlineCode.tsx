import { inlineCode as inlineCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { useEffect, useState, type ComponentProps } from 'react';
import { useRecipe } from '../components/RecipesProvider/RecipesProvider.js';
import { plainLines, tokenize, tokenStyle, type CodeLanguageInput, type CodeToken } from './highlight.js';

export interface InlineCodeProps extends Omit<ComponentProps<'code'>, 'children'> {
    /** The code (one line) */
    code: string;
    /** Language id or alias, e.g. "ts", "css", "bash" (default: plain text) */
    language?: string;
    /** More grammars than the built-in ones (see CodeHighlight) */
    languages?: readonly CodeLanguageInput[];
    /** Extra classes of the recipe (see the recipe) */
    classes?: RecipeClasses<typeof inlineCodeRecipe>;
}

const noLanguages: CodeLanguageInput[] = [];

/** Code inside a sentence, with syntax colours */
export function InlineCode({
    code,
    language = 'text',
    languages = noLanguages,
    classes,
    className,
    ...props
}: InlineCodeProps) {
    const inlineCode = useRecipe('inlineCode', inlineCodeRecipe, classes);
    const [tokens, setTokens] = useState<{ key: string; tokens: CodeToken[] } | null>(null);
    const key = `${language}\u0000${code}`;
    useEffect(() => {
        let cancelled = false;
        void tokenize(code, language, languages).then((lines) => {
            if (!cancelled) setTokens({ key: `${language}\u0000${code}`, tokens: lines.flat() });
        });
        return () => {
            cancelled = true;
        };
    }, [code, language, languages]);
    const shown = tokens?.key === key ? tokens.tokens : plainLines(code).flat();
    return (
        <code {...props} className={inlineCode({ class: className })}>
            {shown.map((token, index) => (
                <span key={index} style={tokenStyle(token)}>
                    {token.content}
                </span>
            ))}
        </code>
    );
}
