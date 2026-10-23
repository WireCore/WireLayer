'use client';

import { ModeToggle } from '@wirecore/wirelayer-blocks-react';
import {
    AppShell,
    ConfirmDialog,
    LocaleProvider,
    registerLocale,
    SegmentedControl,
    SegmentedControlItem,
    SidebarNav,
    Toaster,
} from '@wirecore/wirelayer-react';
import { de } from '@wirecore/wirelayer-react/locales/de';
import { Gauge, Send } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createContext, useContext, useState, type ReactNode } from 'react';
import { isDemoLocale, texts, type DemoLocale } from './texts';

// German is a separate language module – registered once, before the first render (server and browser)
registerLocale('de', de);

const TextsContext = createContext(texts['en-US']);

/** Texts of the page in the chosen language */
export const usePageTexts = () => useContext(TextsContext);

/** App frame (client component: icons are functions and the language switches here) */
export function Shell({ initialLocale, children }: { initialLocale: DemoLocale; children: ReactNode }) {
    const [locale, setLocale] = useState(initialLocale);
    const pathname = usePathname();
    const router = useRouter();
    const t = texts[locale];
    const choose = (next: string | null) => {
        if (!isDemoLocale(next)) return;
        setLocale(next);
        document.cookie = `locale=${next}; path=/; max-age=31536000; samesite=lax`;
        document.documentElement.lang = next;
        // Server components read the cookie – render them again in the new language
        router.refresh();
    };
    const navigation = [
        { label: t.overview, href: '/', icon: Gauge, current: pathname === '/' },
        { label: t.request, href: '/anfrage', icon: Send, current: pathname === '/anfrage' },
    ];

    return (
        <LocaleProvider locale={locale}>
            <TextsContext.Provider value={t}>
                <AppShell
                    header={
                        <div className="flex flex-1 items-center justify-between gap-3">
                            <Link href="/" className="text-base font-semibold">
                                {t.title}
                            </Link>
                            <div className="flex items-center gap-2">
                                <SegmentedControl value={locale} onValueChange={choose} label={t.language} size="sm">
                                    <SegmentedControlItem value="en-US">EN</SegmentedControlItem>
                                    <SegmentedControlItem value="de-DE">DE</SegmentedControlItem>
                                </SegmentedControl>
                                <ModeToggle />
                            </div>
                        </div>
                    }
                    navbar={<SidebarNav items={navigation} label={t.title} />}
                >
                    {children}
                </AppShell>
                <Toaster />
                <ConfirmDialog />
            </TextsContext.Provider>
        </LocaleProvider>
    );
}
