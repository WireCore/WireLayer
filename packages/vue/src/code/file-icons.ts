import {
    FileBraces,
    FileCode,
    FileCodeCorner,
    FileImage,
    FileSpreadsheet,
    FileTerminal,
    FileText,
    FileType,
} from '@lucide/vue';
import type { CodeFileKind } from '@wirecore/wirelayer-recipes';
import type { Component } from 'vue';

/** Icon of a file by its kind (from the extension) */
export const fileIcons: Record<CodeFileKind, Component> = {
    code: FileCode,
    json: FileBraces,
    markup: FileCodeCorner,
    style: FileType,
    terminal: FileTerminal,
    data: FileSpreadsheet,
    text: FileText,
    image: FileImage,
};
