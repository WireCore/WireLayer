import { modeScript } from '@wirecore/wirelayer-recipes';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { Shell } from './shell';
import { isDemoLocale } from './texts';
import './globals.css';

export const metadata: Metadata = { title: 'WireLayer Admin' };

// Set up as in Storybook › Getting started › Welcome › Next.js; the language comes from a cookie, so the server renders it too
export default async function RootLayout({ children }: { children: ReactNode }) {
    const stored = (await cookies()).get('locale')?.value;
    const locale = isDemoLocale(stored) ? stored : 'en-US';
    return (
        <html lang={locale} suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: modeScript() }} />
            </head>
            <body>
                <Shell initialLocale={locale}>{children}</Shell>
            </body>
        </html>
    );
}
