import { QrCode as ArkQrCode, useQrCode } from '@ark-ui/react/qr-code';
import { downloadText, qrCode as qrCodeRecipe, type RecipeClasses } from '@wirecore/wirelayer-recipes';
import { Download } from 'lucide-react';
import { useRef, type ComponentProps } from 'react';
import { Button } from '../Button/Button.js';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';
import { useRecipe } from '../RecipesProvider/RecipesProvider.js';

export interface QrCodeProps extends Omit<ComponentProps<'div'>, 'children'> {
    /** Text or URL to encode */
    value: string;
    /** Width and height in px (default 160) */
    size?: number;
    /** Error correction: L 7 %, M 15 % (default), Q 25 %, H 30 % of the code may be covered (H with a logo) */
    errorCorrection?: 'L' | 'M' | 'Q' | 'H';
    /** Image URL shown in the middle (decorative; use error correction "H") */
    logo?: string;
    /** Accessible name (default "QR code: <value>") */
    label?: string;
    /** Shows the encoded value as text below the code */
    showValue?: boolean;
    /** Buttons to download the code as PNG and SVG */
    download?: boolean;
    /** File name of the downloads without extension (default "qr-code") */
    fileName?: string;
    /** Extra classes per part of the component, e.g. { base: "…" } (see the recipe) */
    classes?: RecipeClasses<typeof qrCodeRecipe>;
}

/** QR code as an image named by its value; optional logo, value text and downloads */
export function QrCode({
    classes,
    value,
    size = 160,
    errorCorrection,
    logo,
    label,
    showValue,
    download,
    fileName = 'qr-code',
    className,
    ...props
}: QrCodeProps) {
    const qrCode = useRecipe('qrCode', qrCodeRecipe, classes);
    const styles = qrCode();
    const t = useTranslations().qrCode;
    const api = useQrCode({ value, encoding: { ecc: errorCorrection ?? (logo ? 'H' : 'M') } });
    const frame = useRef<HTMLDivElement>(null);

    const downloadPng = async () => {
        const url = await api.getDataUrl('image/png');
        Object.assign(document.createElement('a'), { href: url, download: `${fileName}.png` }).click();
    };
    // The pattern on a white tile, with explicit colours (the page's CSS does not travel with the file)
    const downloadSvg = () => {
        const svg = frame.current?.querySelector('svg');
        const path = svg?.querySelector('path')?.getAttribute('d') ?? '';
        const box = svg?.getAttribute('viewBox') ?? '0 0 0 0';
        downloadText(
            `${fileName}.svg`,
            `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${box}"><rect width="100%" height="100%" fill="#fff"/><path d="${path}" fill="#000"/></svg>`,
            'image/svg+xml'
        );
    };

    return (
        <div {...props} className={styles.base({ class: className })}>
            <div ref={frame}>
                <ArkQrCode.RootProvider value={api} className={styles.frame()}>
                    <ArkQrCode.Frame
                        className={styles.svg()}
                        style={{ width: `${size}px`, height: `${size}px` }}
                        role="img"
                        aria-label={label ?? t.label(value)}
                    >
                        <ArkQrCode.Pattern className={styles.pattern()} />
                    </ArkQrCode.Frame>
                    {logo && (
                        <ArkQrCode.Overlay className={styles.overlay()}>
                            <img src={logo} alt="" className={styles.logo()} />
                        </ArkQrCode.Overlay>
                    )}
                </ArkQrCode.RootProvider>
            </div>
            {showValue && <span className={styles.value()}>{value}</span>}
            {download && (
                <div className={styles.actions()}>
                    <Button variant="outline" size="sm" leadingIcon={Download} onClick={downloadPng}>
                        {t.downloadPng}
                    </Button>
                    <Button variant="outline" size="sm" leadingIcon={Download} onClick={downloadSvg}>
                        {t.downloadSvg}
                    </Button>
                </div>
            )}
        </div>
    );
}
