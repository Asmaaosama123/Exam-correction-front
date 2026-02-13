// components/MultiPagePdfViewer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';

interface MultiPagePdfViewerProps {
  file: File | null;
  scale: number;
  onDimensions: (dimensions: { width: number; height: number }) => void;
  onNumPages: (numPages: number) => void;
  className?: string;
}

declare global {
  interface Window {
// غير السطرين دول في الـ interface بتاع الـ Props في التلات ملفات
pdfjsLib?: any;
pdfjs?: any;
  }
}


const getPdfJs = () => {
  const pdfjsLib = window.pdfjsLib || window.pdfjs;
  if (!pdfjsLib) throw new Error("PDF.js library not available.");
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
  }
  return pdfjsLib;
};

export default function MultiPagePdfViewer({ file, scale, onDimensions, onNumPages, className }: MultiPagePdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [pages, setPages] = useState<Array<{ canvas: HTMLCanvasElement; width: number; height: number }>>([]);
  const renderTasksRef = useRef<any[]>([]);
  const pdfRef = useRef<any>(null);

  // دالة لإلغاء أي عملية render جارية
  const cancelAllRenderTasks = useCallback(() => {
    renderTasksRef.current.forEach(task => {
      if (task && typeof task.cancel === 'function') {
        task.cancel();
      }
    });
    renderTasksRef.current = [];
    setPages([]);
  }, []);

  // دالة لإغلاق PDF الحالي
  const closePdf = useCallback(() => {
    if (pdfRef.current) {
      try {
        pdfRef.current.destroy();
      } catch (error) {
        console.log('Error closing PDF:', error);
      }
      pdfRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      cancelAllRenderTasks();
      closePdf();
    };
  }, [cancelAllRenderTasks, closePdf]);

  useEffect(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;

    const loadAndRenderPdf = async () => {
      try {
        setIsRendering(true);
        cancelAllRenderTasks();
        closePdf();

        const pdfjs = getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ 
          data: arrayBuffer,
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        }).promise;
        
        pdfRef.current = pdf;
        const numPages = (pdf as any).numPages;
                onNumPages(numPages);

        const newPages = [];
        renderTasksRef.current = new Array(numPages);

        // عرض أول صفحة لحساب الأبعاد
        const firstPage = await pdf.getPage(1);
        
        // استخدام دقة أعلى للصور (2.5 بدلاً من 1.0)
        const viewport = firstPage.getViewport({ scale: 2.5 });
        
        onDimensions({
          width: viewport.width,
          height: viewport.height
        });

        // عرض جميع الصفحات
        for (let i = 1; i <= numPages; i++) {
          const page = await pdf.getPage(i);
          const viewport = page.getViewport({ scale: 2.5 });
          
          // إنشاء canvas للصفحة
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          if (!ctx) continue;

          // تعيين دقة عالية
          const devicePixelRatio = window.devicePixelRatio || 1;
          const outputScale = devicePixelRatio;
          
          canvas.width = Math.floor(viewport.width * outputScale);
          canvas.height = Math.floor(viewport.height * outputScale);
          
          canvas.style.width = `${viewport.width}px`;
          canvas.style.height = `${viewport.height}px`;

          // تحسين جودة العرض
          ctx.scale(outputScale, outputScale);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          // تعيين خلفية بيضاء
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, viewport.width, viewport.height);

          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            background: 'rgba(255, 255, 255, 1)'
          };

          const renderTask = page.render(renderContext);
          renderTasksRef.current[i - 1] = renderTask;
          await renderTask.promise;

          newPages.push({
            canvas,
            width: viewport.width,
            height: viewport.height
          });
        }

        setPages(newPages);

      } catch (error: any) {
        if (error?.name === 'RenderingCancelled' || error?.message?.includes('cancel')) {
          console.log('تم إلغاء عملية الـ render');
        } else {
          console.error('Error loading PDF:', error);
        }
      } finally {
        setIsRendering(false);
      }
    };

    loadAndRenderPdf();

    return () => {
      cancelAllRenderTasks();
    };
  }, [file, onDimensions, onNumPages, cancelAllRenderTasks, closePdf]);

  if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">جاري تحميل {pages.length > 0 ? `${pages.length}/${pages.length}` : ''} PDF...</p>
          </div>
        </div>
      )}
      
      <div className="flex flex-col items-center gap-4">
        {pages.map((page, index) => (
          <div 
            key={index} 
            className="relative bg-white shadow-lg rounded border"
            style={{
              width: `${page.width * scale}px`,
              height: `${page.height * scale}px`,
            }}
          >
            <canvas
              ref={(el) => {
                if (el && page.canvas) {
                  // نسخ محتوى الـ canvas
                  const ctx = el.getContext('2d');
                  if (ctx) {
                    el.width = page.canvas.width;
                    el.height = page.canvas.height;
                    el.style.width = `${page.width * scale}px`;
                    el.style.height = `${page.height * scale}px`;
                    ctx.drawImage(page.canvas, 0, 0);
                  }
                }
              }}
              className="block bg-white w-full h-full"
            />
            <div className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              صفحة {index + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}