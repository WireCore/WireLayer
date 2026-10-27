import { RatingGroup as ArkRatingGroup } from '@ark-ui/react/rating-group';
import { controlIds, rating as ratingRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Star } from 'lucide-react';
import { useRef, type ComponentType, type CSSProperties } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';
import { useLabelForWarning } from '../../utils/label-for.js';

export interface RatingProps {
    value?: number;
    defaultValue?: number;
    onValueChange?: (value: number) => void;
    /** Number of stars */
    count?: number;
    allowHalf?: boolean;
    /** Clicking the chosen star again (or Delete/Backspace) clears the rating (value 0) */
    allowClear?: boolean;
    /** Own symbol instead of the star, e.g. a heart (filled when chosen – it gets `fill`) */
    icon?: ComponentType<{ className?: string; fill?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
    readOnly?: boolean;
    disabled?: boolean;
    /** Visible label, also the group's accessible name */
    label?: string;
    'aria-label'?: string;
    /** Id of the root element; a `<label for>` cannot name the rating, use a Field or aria-label */
    id?: string;
    size?: 'sm' | 'md' | 'lg';
    name?: string;
    className?: string;
    style?: CSSProperties;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof ratingRecipe>;
}

/** Star rating: a radio group – arrow keys change the value, each star reads "3 stars" */
export function Rating({
    classes,
    value,
    defaultValue,
    onValueChange,
    count = 5,
    allowHalf,
    allowClear = false,
    icon: Icon = Star,
    readOnly,
    disabled,
    label,
    'aria-label': ariaLabel,
    id,
    size,
    name,
    className,
    style,
}: RatingProps) {
    useLabelForWarning('Rating', id);
    const rating = useRecipe('rating', ratingRecipe, classes);
    const translations = useTranslations();
    const styles = rating({ size });
    // allowClear: the value before the click – clicking it again clears
    const before = useRef<number | null>(null);

    return (
        <ArkRatingGroup.Root
            {...controlIds(id, 'root')}
            className={styles.base({ class: className })}
            style={style}
            count={count}
            value={value}
            defaultValue={defaultValue}
            // A cleared rating is -1 in Ark – reported as 0
            onValueChange={(details) => onValueChange?.(Math.max(0, details.value))}
            allowHalf={allowHalf}
            readOnly={readOnly}
            disabled={disabled}
            name={name}
            aria-label={label ? undefined : ariaLabel}
            translations={translations.rating}
        >
            {label && <ArkRatingGroup.Label className={styles.label()}>{label}</ArkRatingGroup.Label>}
            <ArkRatingGroup.Control className={styles.control()}>
                <ArkRatingGroup.Context>
                    {(api) =>
                        api.items.map((index) => (
                            <ArkRatingGroup.Item
                                key={index}
                                index={index}
                                className={styles.item()}
                                onPointerDown={() => (before.current = api.value)}
                                onClick={() => {
                                    const clicked = api.hoveredValue > 0 ? api.hoveredValue : index;
                                    if (allowClear && before.current === clicked) api.clearValue();
                                    before.current = null;
                                }}
                                onKeyDown={(event) => {
                                    if (!allowClear || (event.key !== 'Delete' && event.key !== 'Backspace')) return;
                                    event.preventDefault();
                                    api.clearValue();
                                }}
                            >
                                <ArkRatingGroup.ItemContext>
                                    {(item) => (
                                        <>
                                            <Icon
                                                className={styles.icon()}
                                                fill={item.highlighted && !item.half ? 'currentColor' : 'none'}
                                                aria-hidden="true"
                                            />
                                            {item.half && (
                                                <span className={styles.half()}>
                                                    <Icon
                                                        className={styles.icon()}
                                                        fill="currentColor"
                                                        aria-hidden="true"
                                                    />
                                                </span>
                                            )}
                                        </>
                                    )}
                                </ArkRatingGroup.ItemContext>
                            </ArkRatingGroup.Item>
                        ))
                    }
                </ArkRatingGroup.Context>
            </ArkRatingGroup.Control>
            <ArkRatingGroup.HiddenInput />
        </ArkRatingGroup.Root>
    );
}
