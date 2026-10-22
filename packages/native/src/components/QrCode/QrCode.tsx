import { qrCode, qrCodePath } from '@wirecore/wirelayer-recipes/native';
import { useMemo } from 'react';
import { Image, Text, View, type ViewProps } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { encode } from 'uqr';
import { useTranslations } from '../../locale.js';

export interface QrCodeProps extends Omit<ViewProps, 'children'> {
    /** Text or URL to encode */
    value: string;
    /** Width and height in pt (default 160) */
    size?: number;
    /** Error correction (default M, H with a logo) */
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    /** Decorative image in the middle (URL) */
    logo?: string;
    /** Accessible name (default "QR code: <value>") */
    label?: string;
    /** The value as text below the code */
    showValue?: boolean;
    className?: string;
}

/**
 * QR code drawn with react-native-svg (matrix from uqr, MIT – the encoder behind Ark/Zag on the web): black on
 * white for every theme, an image (role img) named by its value.
 */
export function QrCode({
    value,
    size = 160,
    errorCorrection,
    logo,
    label,
    showValue = false,
    className,
    ...props
}: QrCodeProps) {
    const translations = useTranslations();
    const styles = qrCode();
    const ecc = errorCorrection ?? (logo ? 'H' : 'M');
    const matrix = useMemo(() => encode(value, { ecc }), [value, ecc]);
    const path = useMemo(() => qrCodePath(matrix.data), [matrix]);
    return (
        <View {...props} className={styles.base({ class: className })}>
            <View role="img" aria-label={label ?? translations.qrCode.label(value)} className={styles.frame()}>
                <Svg
                    width={size}
                    height={size}
                    viewBox={`0 0 ${matrix.size} ${matrix.size}`}
                    aria-hidden
                    pointerEvents="none"
                >
                    <Path d={path} fill="#000000" />
                </Svg>
                {!!logo && (
                    <Image
                        source={{ uri: logo }}
                        alt=""
                        aria-hidden
                        className={styles.logo()}
                        style={{ width: size * 0.22, height: size * 0.22, left: size * 0.39 + 8, top: size * 0.39 + 8 }}
                    />
                )}
            </View>
            {showValue && <Text className={styles.value()}>{value}</Text>}
        </View>
    );
}
