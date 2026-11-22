import { translateDateAnnouncements } from '@wirecore/wirelayer-recipes';
import { onBeforeUnmount, onMounted } from 'vue';
import { useTranslations } from '../../locale.js';

/** The parts of the date fields in `element` announce their changes in the app's language (Ark: always English) */
export function useDateAnnouncements(element: () => Element | null | undefined) {
    const translations = useTranslations();
    let stop = () => {};
    onMounted(() => {
        stop = translateDateAnnouncements(
            () => element() ?? null,
            () => ({ segments: translations.dateSegments, empty: translations.dateInput.empty })
        );
    });
    onBeforeUnmount(() => stop());
}
