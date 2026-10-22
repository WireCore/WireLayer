// Storybook only: react-native-pdf is a native view (PDFKit/PdfiumAndroid) that react-native-web cannot render.
// PdfViewer shows its web note instead and never renders this stand-in; apps keep react-native-pdf.
export default function Pdf() {
    return null;
}
