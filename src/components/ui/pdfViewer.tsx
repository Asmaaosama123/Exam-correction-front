// components/PdfViewer.tsx
import { useEffect, useRef, useState, useCallback } from 'react';

interface PdfViewerProps {
  file: File | null;
  scale: number;
  onDimensions: (dimensions: { width: number; height: number }) => void;
  onNumPages: (numPages: number) => void;
  className?: string;
}

declare global {
  interface Window {
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

export default function PdfViewer({ file, scale, onDimensions, onNumPages, className }: PdfViewerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const renderTaskRef = useRef<any>(null);
  const pdfRef = useRef<any>(null);

  // دالة لإلغاء أي عملية render جارية
  const cancelRender = useCallback(() => {
    if (renderTaskRef.current) {
      try {
        renderTaskRef.current.cancel();
      } catch (error) {
        // تجاهل أي أخطاء أثناء الإلغاء
      }
      renderTaskRef.current = null;
    }
  }, []);

  // دالة لإغلاق PDF الحالي
  const closePdf = useCallback(() => {
    if (pdfRef.current) {
      try {
        pdfRef.current.destroy();
      } catch (error) {
        // تجاهل أي أخطاء أثناء الإغلاق
      }
      pdfRef.current = null;
    }
  }, []);

  useEffect(() => {
    // تنظيف عند إلغاء المكون
    return () => {
      cancelRender();
      closePdf();
    };
  }, [cancelRender, closePdf]);

  useEffect(() => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) return;

    const loadAndRenderPdf = async () => {
      try {
        setIsRendering(true);
        
        // إلغاء أي عملية render جارية
        cancelRender();
        
        // إغلاق أي PDF مفتوح
        closePdf();

        const pdfjs = getPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ 
          data: arrayBuffer,
          // تحسين الأداء والذاكرة
          cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/cmaps/',
          cMapPacked: true,
        }).promise;
        
        pdfRef.current = pdf;
        onNumPages(pdf.numPages);
        
        // الحصول على أبعاد الصفحة الأولى
        const firstPage = await pdf.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        
        onDimensions({
          width: viewport.width,
          height: viewport.height
        });

        // حساب حجم العرض بناءً على الـ scale
        const displayWidth = Math.round(viewport.width * scale);
        const displayHeight = Math.round(viewport.height * scale);

        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d');
          
          if (!ctx) return;

          // إعادة تعيين أبعاد الـ canvas
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          canvas.style.width = `${displayWidth}px`;
          canvas.style.height = `${displayHeight}px`;

          // تنظيف الـ canvas تماماً
          ctx.save();
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.restore();
          
          // تعيين خلفية بيضاء
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // عرض الصفحة الأولى فقط
          const renderContext = {
            canvasContext: ctx,
            viewport: viewport,
            background: 'rgba(255, 255, 255, 1)'
          };

          const renderTask = firstPage.render(renderContext);
          renderTaskRef.current = renderTask;
          
          await renderTask.promise;
          renderTaskRef.current = null;
        }

      } catch (error: any) {
        // تجاهل أخطاء الإلغاء
        if (error?.name === 'RenderingCancelled' || error?.message?.includes('cancel')) {
          console.log('تم إلغاء عملية الـ render');
        } else {
          console.error('Error loading PDF:', error);
        }
      } finally {
        setIsRendering(false);
      }
    };

    // استخدام setTimeout لمنع عمليات render متعددة متزامنة
    const timer = setTimeout(() => {
      loadAndRenderPdf();
    }, 100);

    return () => {
      clearTimeout(timer);
      cancelRender();
    };
  }, [file, scale, onDimensions, onNumPages, cancelRender, closePdf]);

  // معالجة تغيير الـ scale
  useEffect(() => {
    if (!pdfRef.current || !canvasRef.current) return;

    const updateScale = async () => {
      try {
        if (!pdfRef.current || !canvasRef.current) return;

        const firstPage = await pdfRef.current.getPage(1);
        const viewport = firstPage.getViewport({ scale: 1.0 });
        
        const displayWidth = Math.round(viewport.width * scale);
        const displayHeight = Math.round(viewport.height * scale);

        const canvas = canvasRef.current;
        canvas.style.width = `${displayWidth}px`;
        canvas.style.height = `${displayHeight}px`;
      } catch (error) {
        console.error('Error updating scale:', error);
      }
    };

    updateScale();
  }, [scale]);

  if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
    return null;
  }

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      {isRendering && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">جاري تحميل PDF...</p>
          </div>
        </div>
      )}
      <canvas
        ref={canvasRef}
        className="block bg-white shadow-md"
        key={`canvas-${file.name}-${scale}`} // إضافة key لإجبار إعادة إنشاء الـ canvas
      />
    </div>
  );
}