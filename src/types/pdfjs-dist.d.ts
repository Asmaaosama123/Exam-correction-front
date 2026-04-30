declare module "pdfjs-dist" {
  export const version: string;
  export const GlobalWorkerOptions: {
    workerSrc: string;
  };
  export function getDocument(src: { data: ArrayBuffer }): {
    promise: Promise<PDFDocumentProxy>;
  };

  export interface PDFDocumentProxy {
    getPage(pageNumber: number): Promise<PDFPageProxy>;
  }

  export interface PDFPageProxy {
    getViewport(params: { scale: number }): Viewport;
  }

  export interface Viewport {
    width: number;
    height: number;
  }
}
