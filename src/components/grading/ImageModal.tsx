import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FileImage, ZoomIn, XCircle, ImageOff, ExternalLink } from "lucide-react";
import { useState } from "react";

// استخدم الرابط الصحيح للصور – يمكنك تغييره من هنا أو من متغير البيئة
const IMAGE_BASE_URL = "http://76.13.51.15:8000";

interface ImageModalProps {
  imageUrl: string;
  filename: string;
}

export function ImageModal({ imageUrl, filename }: ImageModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const fullImageUrl = imageUrl.startsWith("http")
    ? imageUrl
    : `${IMAGE_BASE_URL}${imageUrl}`;

  const handleImageError = () => setImageError(true);
  const handleRetry = () => setImageError(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 hover:border-indigo-300 text-indigo-700 hover:text-indigo-800 transition-all duration-200 shadow-sm hover:shadow"
        >
          <FileImage className="h-4 w-4" />
          <span>عرض الوثيقة</span>
          <ZoomIn className="h-3 w-3 opacity-70" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl w-[95vw] p-0 overflow-hidden rounded-2xl border-0 shadow-2xl">
        <div className="relative bg-black/5 backdrop-blur-sm">
          {/* رأس الصورة مع اسم الملف */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-black/70 text-white px-3 py-1.5 rounded-full text-sm backdrop-blur-md">
            <FileImage className="h-4 w-4" />
            <span className="max-w-[200px] truncate">{filename}</span>
          </div>

          {/* زر الإغلاق */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-3 right-3 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full"
            onClick={() => setIsOpen(false)}
          >
            <XCircle className="h-5 w-5" />
          </Button>

          {/* زر فتح الصورة في تبويب جديد */}
          <a
            href={fullImageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="absolute bottom-3 left-3 z-10 flex items-center gap-2 bg-black/70 hover:bg-black/90 text-white px-4 py-2 rounded-full text-sm backdrop-blur-md transition-all"
          >
            <ExternalLink className="h-4 w-4" />
            فتح بالحجم الكامل
          </a>

          {/* حاوية الصورة - معدلة لعرض كامل الصورة بدون سكرول */}
          <div className="relative w-full h-[80vh] bg-white flex items-center justify-center p-2">
            {!imageError ? (
              <img
                src={fullImageUrl}
                alt={`Annotated ${filename}`}
                className="max-h-full max-w-full object-contain"
                onError={handleImageError}
              />
            ) : (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-gray-50 rounded-xl border border-gray-100 mx-4">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4 shadow-inner">
                  <ImageOff className="h-10 w-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  تعذر عرض المعاينة
                </h3>
                <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
                  قد يكون هناك قيود أمنية (Mixed Content) تمنع عرض الصورة مباشرة.
                  <br />
                  يرجى استخدام زر <strong>"فتح بالحجم الكامل"</strong> لمشاهدة الوثيقة.
                </p>
                <div className="flex flex-col gap-3 w-full max-w-xs">
                  <a
                    href={fullImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-all font-medium"
                  >
                    <ExternalLink className="h-4 w-4" />
                    فتح الصورة في نافذة جديدة
                  </a>
                  <Button variant="outline" size="sm" onClick={handleRetry} className="w-full">
                    <RefreshCw className="mr-2 h-3.5 w-3.5" />
                    إعادة المحاولة
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}