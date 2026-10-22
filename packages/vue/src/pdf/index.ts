// PDF viewer on pdf.js – requires pdfjs-dist (optional peer dependency, Apache-2.0) and its stylesheet
// (`import 'pdfjs-dist/legacy/web/pdf_viewer.css'`); pdf.js is loaded in the browser on first use
export { default as PdfViewer, type PdfViewerProps } from './PdfViewer.vue';
export type { PdfAssets, PdfOutlineItem, PdfSource } from './engine.js';
export { pdfTools, pdfZoomSteps, type PdfTool, type PdfZoom } from '@wirecore/wirelayer-recipes';
