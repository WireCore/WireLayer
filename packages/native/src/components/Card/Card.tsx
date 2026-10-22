import { card, cardParts } from '@wirecore/wirelayer-recipes/native';
import type { ReactNode } from 'react';
import { Pressable, Text, View, type PressableProps, type ViewProps } from 'react-native';

export interface CardProps extends ViewProps {
    /** Makes the whole card pressable (role "button" unless set otherwise) */
    onPress?: PressableProps['onPress'];
    /** Heading of the card */
    title?: string;
    /** Line below the title */
    subtitle?: string;
    /** Level of the title heading – pick the one that fits the screen outline (default 3) */
    headingLevel?: 2 | 3 | 4 | 5 | 6;
    /** Image or video above the content (beside it when horizontal) – reaches the edges of the card */
    media?: ReactNode;
    /** `horizontal`: media at the start, the content beside it */
    orientation?: 'vertical' | 'horizontal';
    /** Extra content in the header, after the title (e.g. a Badge or an IconButton) */
    header?: ReactNode;
    /** Actions at the end of the card */
    footer?: ReactNode;
}

/** Surface for grouped content – with title, subtitle, media and footer, or any children; pressable with `onPress` */
export function Card({
    onPress,
    title,
    subtitle,
    headingLevel = 3,
    media,
    orientation,
    header,
    footer,
    className,
    children,
    ...props
}: CardProps) {
    const parts = cardParts({ orientation });
    const structured = !!(title || subtitle || media || header || footer);
    const content = structured ? (
        <>
            {media && <View className={parts.media()}>{media}</View>}
            <View className={media ? parts.body() : parts.content()}>
                {(title || subtitle || header) && (
                    <View className={parts.header()}>
                        <View className={parts.headings()}>
                            {!!title && (
                                <Text role="heading" aria-level={headingLevel} className={parts.title()}>
                                    {title}
                                </Text>
                            )}
                            {!!subtitle && <Text className={parts.subtitle()}>{subtitle}</Text>}
                        </View>
                        {header}
                    </View>
                )}
                {children}
                {footer && <View className={parts.footer()}>{footer}</View>}
            </View>
        </>
    ) : (
        children
    );
    const classes = [media ? parts.frame() : undefined, className];
    if (onPress) {
        return (
            <Pressable
                role="button"
                {...(props as PressableProps)}
                onPress={onPress}
                className={card({ interactive: true, class: classes })}
            >
                {content}
            </Pressable>
        );
    }
    return (
        <View {...props} className={card({ class: classes })}>
            {content}
        </View>
    );
}
