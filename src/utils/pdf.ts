// Centralised pdf.js setup so the worker is configured exactly once.
//
// Vite resolves the `?url` import to a hashed asset URL and only includes the
// worker chunk when this module is imported -- which (because PdfPageViewer is
// React.lazy'd) means the ~1 MB pdf.js worker is loaded on demand on the reader
// route, not in the main bundle.
import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export { pdfjsLib };

/**
 * Open a PDF for streaming, page-on-demand reading.
 *
 * `disableAutoFetch` stops pdf.js from greedily pulling the whole file; combined
 * with a linearized ("fast web view") PDF on a host that supports HTTP range
 * requests, only the bytes for pages actually viewed are downloaded.
 */
export const loadPdf = (url: string) =>
  pdfjsLib.getDocument({
    url,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 65536,
  });

export type PdfDocument = Awaited<ReturnType<typeof loadPdf>['promise']>;
