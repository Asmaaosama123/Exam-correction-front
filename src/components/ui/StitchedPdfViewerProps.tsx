// components/StitchedPdfViewer.tsx
import { useEffect, useState } from 'react';

interface StitchedPdfViewerProps {
  file: File;
  scale?: number;
  onLoaded?: (data: { 
    width: number; 
    height: number; 
    pageCount: number; 
    imageUrl: string 
  }) => void;
  onError?: (error: string) => void;
  hidden?: boolean;
}

// متغير عالمي لـ PDF.js
declare global {
  interface Window {
    pdfjsLib?: any;
  }
}

export default function StitchedPdfViewer({ 
  file, 
  scale = 1,
  onLoaded,
  onError,
  hidden = false
}: StitchedPdfViewerProps) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageCount, setPageCount] = useState(0);

  // دالة لتحميل مكتبة PDF.js
  const loadPdfJs = () => {
    if (window.pdfjsLib) {
      return window.pdfjsLib;
    }
    
    // تحميل PDF.js من CDN
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
    script.onload = () => {
      // تحميل worker
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = 
          'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
      }
    };
    document.head.appendChild(script);
    
    return window.pdfjsLib;
  };

  // الدالة الرئيسية لتحويل PDF إلى صورة طويلة
  const convertPdfToLongImage = async (pdfFile: File) => {
    setLoading(true);
    setError(null);

    try {
      // 1. تحميل PDF.js
      const pdfjs = loadPdfJs();
      if (!pdfjs) {
        throw new Error('تعذر تحميل مكتبة PDF.js');
      }

      // انتظار تحميل المكتبة
      await new Promise(resolve => setTimeout(resolve, 500));

      // 2. قراءة ملف PDF
      const arrayBuffer = await pdfFile.arrayBuffer();
      
      // 3. تحميل مستند PDF
      const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
      const numPages = (pdf as any).numPages;
            setPageCount(numPages);

      // 4. تحويل كل صفحة إلى صورة
      const pageImages: HTMLCanvasElement[] = [];
      let maxWidth = 0;
      let totalHeight = 0;

      for (let pageNum = 1; pageNum <= numPages; pageNum++) {
        const page = await pdf.getPage(pageNum);
        
        // استخدام viewport للحصول على أبعاد الصفحة
        const viewport = page.getViewport({ scale: 2.0 }); // جودة عالية
        
        // إنشاء canvas للصفحة
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          throw new Error('تعذر إنشاء canvas');
        }

        // تعيين أبعاد canvas
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // تعيين خلفية بيضاء
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // رسم صفحة PDF على canvas
        const renderContext = {
          canvasContext: ctx,
          viewport: viewport
        };

        await page.render(renderContext).promise;
        
        // حفظ الصورة وإضافة أبعادها
        pageImages.push(canvas);
        maxWidth = Math.max(maxWidth, canvas.width);
        totalHeight += canvas.height;
      }

      // 5. إنشاء صورة طويلة واحدة
      const longCanvas = document.createElement('canvas');
      longCanvas.width = maxWidth;
      longCanvas.height = totalHeight;
      
      const longCtx = longCanvas.getContext('2d');
      if (!longCtx) {
        throw new Error('تعذر إنشاء canvas للصورة الطويلة');
      }

      // تعيين خلفية بيضاء للصورة الطويلة
      longCtx.fillStyle = 'white';
      longCtx.fillRect(0, 0, maxWidth, totalHeight);

      // 6. دمج جميع الصفحات في صورة واحدة
      let currentY = 0;
      for (const pageCanvas of pageImages) {
        longCtx.drawImage(pageCanvas, 0, currentY);
        currentY += pageCanvas.height;
      }

      // 7. تحويل canvas إلى صورة
      const dataUrl = longCanvas.toDataURL('image/png');
      
      // 8. حفظ النتائج
      setImageUrl(dataUrl);
      setDimensions({ width: maxWidth, height: totalHeight });
      
      if (onLoaded) {
        onLoaded({ width: maxWidth, height: totalHeight, pageCount: numPages, imageUrl: dataUrl });
      }

    } catch (err: any) {
      console.error('خطأ في تحويل PDF:', err);
      const errorMessage = err.message || 'حدث خطأ أثناء تحويل PDF';
      setError(errorMessage);
      if (onError) {
        onError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  // عند تغيير الملف، نبدأ التحويل
  useEffect(() => {
    if (!file) return;
    convertPdfToLongImage(file);
  }, [file]);

  // إذا كان hidden، لا نعرض أي شيء
  if (hidden) {
    return null;
  }

  // UI بسيط وواضح
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
        <p className="text-gray-700 font-medium">جاري تحويل PDF إلى صورة طويلة...</p>
        <p className="text-sm text-gray-500 mt-2">
          {pageCount > 0 ? `تم معالجة ${pageCount} صفحة` : 'جاري تحميل الصفحات...'}
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="text-red-700 font-medium">❌ خطأ في التحويل</h3>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button 
          onClick={() => convertPdfToLongImage(file)}
          className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm hover:bg-red-200"
        >
          حاول مرة أخرى
        </button>
      </div>
    );
  }

  if (!imageUrl || !dimensions) {
    return (
      <div className="text-center p-8 text-gray-500">
        اختر ملف PDF لبدء التحويل
      </div>
    );
  }

  return (
    <div className="relative">
      {/* الصورة الطويلة */}
      <img
        src={imageUrl}
        alt="PDF كصورة طويلة"
        className="mx-auto bg-white shadow-lg rounded-lg border"
        style={{
          width: `${dimensions.width * scale}px`,
          maxWidth: '100%',
          height: 'auto'
        }}
      />
      
      {/* معلومات عن الصورة */}
      <div className="mt-4 bg-gray-50 p-3 rounded-lg">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">عدد الصفحات:</span>
            <span className="mr-2"> {pageCount}</span>
          </div>
          <div>
            <span className="font-medium">أبعاد الصورة:</span>
            <span className="mr-2"> {Math.round(dimensions.width)} × {Math.round(dimensions.height)} بكسل</span>
          </div>
          <div>
            <span className="font-medium">نوع الملف:</span>
            <span className="mr-2"> PNG</span>
          </div>
          <div>
            <span className="font-medium">مقياس العرض:</span>
            <span className="mr-2"> {scale}x</span>
          </div>
        </div>
      </div>
      
      {/* زر تحميل */}
      <div className="mt-4 text-center">
        <a
          href={imageUrl}
          download={`${file.name.replace('.pdf', '')}_صورة-طويلة.png`}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          تحميل الصورة الطويلة
        </a>
      </div>
    </div>
  );
}