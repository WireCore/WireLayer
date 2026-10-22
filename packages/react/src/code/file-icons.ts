import {
    FileBraces,
    FileCode,
    FileCodeCorner,
    FileImage,
    FileSpreadsheet,
    FileTerminal,
    FileText,
    FileType,
    type LucideIcon,
} from 'lucide-react';
import type { CodeFileKind } from '@wirecore/wirelayer-recipes';

/** Icon of a file by its kind (from the extension) */
export const fileIcons: Record<CodeFileKind, LucideIcon> = {
    code: FileCode,
    json: FileBraces,
    markup: FileCodeCorner,
    style: FileType,
    terminal: FileTerminal,
    data: FileSpreadsheet,
    text: FileText,
    image: FileImage,
};
