import { cookies } from 'next/headers';
import { isDemoLocale, texts } from './texts';

/** Language of the request (cookie) and the page texts for server components */
export async function serverTexts() {
    const stored = (await cookies()).get('locale')?.value;
    return texts[isDemoLocale(stored) ? stored : 'en-US'];
}
