import { translateDateAnnouncements } from '@wirecore/wirelayer-recipes';
import { useEffect, useRef, type RefObject } from 'react';
import { useTranslations } from '../LocaleProvider/LocaleProvider.js';

/** The parts of the date fields in `element` announce their changes in the app's language (Ark: always English) */
export function useDateAnnouncements(element: RefObject<Element | null>) {
    const translations = useTranslations();
    const latest = useRef(translations);
    useEffect(() => {
        latest.current = translations;
    });
    useEffect(
        () =>
            translateDateAnnouncements(
                () => element.current,
                () => ({ segments: latest.current.dateSegments, empty: latest.current.dateInput.empty })
            ),
        [element]
    );
}
