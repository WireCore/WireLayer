// Plain calendar dates ("2026-10-20") for Calendar and DatePicker – no time zones involved.

export interface CalendarDate {
    year: number;
    month: number; // 1–12
    day: number;
}

export const parseDate = (value: string | null | undefined): CalendarDate | null => {
    const match = value?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return match ? { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) } : null;
};

const pad = (number: number) => String(number).padStart(2, '0');
export const toIso = ({ year, month, day }: CalendarDate) => `${year}-${pad(month)}-${pad(day)}`;

/** Noon UTC – the same calendar day in every time zone for Intl formatting */
export const toJsDate = ({ year, month, day }: CalendarDate) => new Date(Date.UTC(year, month - 1, day, 12));

export const today = (): CalendarDate => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1, day: now.getDate() };
};

export const addMonths = ({ year, month }: CalendarDate, months: number): CalendarDate => {
    const index = year * 12 + month - 1 + months;
    return { year: Math.floor(index / 12), month: (index % 12) + 1, day: 1 };
};

/** First day of the week: Sunday in the US and a few others, Monday elsewhere */
export function firstDayOfWeek(locale: string): number {
    try {
        const info = new Intl.Locale(locale) as Intl.Locale & {
            getWeekInfo?: () => { firstDay: number };
            weekInfo?: { firstDay: number };
        };
        const firstDay = info.getWeekInfo?.().firstDay ?? info.weekInfo?.firstDay;
        if (firstDay) return firstDay % 7;
    } catch {
        // no Intl.Locale – fall through
    }
    return /-(US|CA|JP|BR|MX|IL|IN|PH|KR|TW|HK)$/i.test(locale) ? 0 : 1;
}

/** Six weeks of days around the month (days of other months included); `weekStart` overrides the locale's */
export function monthGrid(visible: CalendarDate, locale: string, weekStart?: number): CalendarDate[][] {
    const first = toJsDate({ ...visible, day: 1 });
    const offset = (first.getUTCDay() - (weekStart ?? firstDayOfWeek(locale)) + 7) % 7;
    const start = Date.UTC(visible.year, visible.month - 1, 1 - offset, 12);
    return Array.from({ length: 6 }, (_, week) =>
        Array.from({ length: 7 }, (_, weekday) => {
            const date = new Date(start + (week * 7 + weekday) * 86_400_000);
            return { year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate() };
        })
    );
}

/** "TT.MM.JJJJ" / "mm/dd/yyyy": the locale's order with the placeholder of each part */
export function datePattern(locale: string, parts: { year: string; month: string; day: string }) {
    return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' })
        .formatToParts(new Date(Date.UTC(2026, 9, 20)))
        .map((part) => (part.type === 'literal' ? part.value : (parts[part.type as keyof typeof parts] ?? '')))
        .join('');
}
