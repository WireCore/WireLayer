import { warnLabelFor } from '@wirecore/wirelayer-recipes';
import { onMounted } from 'vue';

/** Development warning when a `<label for>` points at this control, which a label element cannot name */
export function useLabelForWarning(component: string, id: () => unknown) {
    onMounted(() => warnLabelFor(component, id() as string | undefined));
}
