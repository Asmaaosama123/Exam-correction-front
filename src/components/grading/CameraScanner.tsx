import { useState, useRef, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2, FileText, RefreshCw, Trash2, CheckSquare, Square, Eye, ScanLine } from "lucide-react";
import { toast } from "sonner";
import type { ExamResult } from "@/types/grading";
import jsPDF from "jspdf";
import { gradingApi } from "@/lib/grading-api";
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from "@/components/ui/dialog";

interface CameraScannerProps {
  onComplete?: (results: ExamResult[]) => void;
  onScan?: (file: File) => void; // New prop for generic file scanning
  actionLabel?: string;          // New prop for custom button label
  fullscreen?: boolean;
  onBack?: () => void;
  videoConstraints?: any;
}

export function CameraScanner({
  onComplete,
  onScan,
  actionLabel,
  fullscreen = false,
  onBack,
}: CameraScannerProps) {
  const webcamRef = useRef<Webcam>(null);
  const [capturedImages, setCapturedImages] = useState<{ id: string; src: string; file: File }[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [filterMode, setFilterMode] = useState(0);
  const [showSheet, setShowSheet] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const videoConstraints = {
    facingMode: "environment",
    aspectRatio: 9 / 16,
  };

  const enableCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(track => track.stop());
      setIsCameraActive(true);
    } catch (err: any) {
      let errorMessage = "لم نتمكن من الوصول إلى الكاميرا";
      if (err.name === "NotAllowedError") {
        errorMessage = "تم رفض الإذن بالوصول إلى الكاميرا. يرجى السماح بالوصول في إعدادات المتصفح.";
      } else if (err.name === "NotFoundError") {
        errorMessage = "لم يتم العثور على كاميرا في هذا الجهاز.";
      } else if (err.name === "NotReadableError") {
        errorMessage = "الكاميرا مشغولة بتطبيق آخر.";
      }
      setCameraError(errorMessage);
      setIsCameraActive(false);
      toast.error(errorMessage);
    }
  }, []);

  useEffect(() => {
    enableCamera();
  }, [enableCamera]);

  const dataURLtoBlob = (dataURL: string): Blob => {
    const arr = dataURL.split(",");
    const mime = arr[0].match(/:(.*?);/)![1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
  };

  const applyFilterToImage = (src: string, mode: number): Promise<string> => {
    return new Promise((resolve) => {
      if (mode === 0) {
        resolve(src);
        return;
      }
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        if (mode === 1) {
          for (let i = 0; i < data.length; i += 4) {
            const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            data[i] = data[i + 1] = data[i + 2] = y;
          }
        } else if (mode === 2) {
          for (let i = 0; i < data.length; i += 4) {
            const y = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
            const v = y > 128 ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = v;
          }
        }
        ctx.putImageData(imageData, 0, 0);
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      img.src = src;
    });
  };

  const capture = useCallback(async () => {
    if (!isCameraActive || cameraError) return;
    const imageSrc = webcamRef.current?.getScreenshot();
    if (!imageSrc) {
      toast.error("فشل التقاط الصورة");
      return;
    }
    const filteredSrc = await applyFilterToImage(imageSrc, filterMode);
    const blob = dataURLtoBlob(filteredSrc);
    const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
    setCapturedImages((prev) => [
      ...prev,
      { id: crypto.randomUUID(), src: filteredSrc, file },
    ]);
    toast.success("تم التقاط الصورة");
  }, [webcamRef, filterMode, isCameraActive, cameraError]);

  const removeImage = (id: string) => {
    setCapturedImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    });
    toast.success("تم حذف الصورة");
  };

  const removeSelected = () => {
    if (selectedIds.size === 0) {
      toast.error("لم تختر أي صور للحذف");
      return;
    }
    setCapturedImages((prev) => prev.filter((img) => !selectedIds.has(img.id)));
    setSelectedIds(new Set());
    toast.success(`تم حذف ${selectedIds.size} صور`);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === capturedImages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(capturedImages.map((img) => img.id)));
    }
  };

  const uploadAllAndComplete = async () => {
    if (capturedImages.length === 0) {
      toast.error("لا توجد صور للمعالجة");
      return;
    }

    setIsUploading(true);

    try {
      toast.info("جاري دمج الصور في ملف PDF...");
      const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

      for (let i = 0; i < capturedImages.length; i++) {
        const img = capturedImages[i];
        if (i > 0) pdf.addPage();

        const imgProps = pdf.getImageProperties(img.src);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(img.src, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
      }

      const pdfBlob = pdf.output("blob");
      const pdfFile = new File([pdfBlob], `scan_bundle_${Date.now()}.pdf`, { type: "application/pdf" });

      // If onScan is provided, just return the file and don't grade
      if (onScan) {
        onScan(pdfFile);
        toast.success("تم تجهيز الملف بنجاح");
        setIsUploading(false);
        return;
      }

      // Otherwise, proceed with grading
      toast.info("جاري رفع وتصحيح الملف...");

      const response = await gradingApi.processExam(pdfFile);

      if (response.results && response.results.length > 0) {
        toast.success(`تم استلام ${response.results.length} نتيجة`);
        if (onComplete) {
          onComplete(response.results);
        } else {
          onBack?.();
        }
      } else {
        toast.warning("تمت العملية ولكن لم يتم استرجاع نتائج");
      }

    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || error.message || "فشل في عملية المعالجة";
      toast.error(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const exportToPDF = async () => {
    if (capturedImages.length === 0) {
      toast.error("لا توجد صور لتصديرها");
      return;
    }
    toast.info("جاري إنشاء ملف PDF...");
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    for (let i = 0; i < capturedImages.length; i++) {
      const img = capturedImages[i];
      if (i > 0) pdf.addPage();
      const imgProps = pdf.getImageProperties(img.src);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(img.src, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");
    }
    pdf.save(`scans_${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.pdf`);
    toast.success("تم تصدير PDF بنجاح");
  };

  const cycleFilter = () => {
    setFilterMode((prev) => (prev + 1) % 3);
    toast(["ملوّن", "رمادي", "أبيض وأسود"][(filterMode + 1) % 3]);
  };

  const toggleFlash = async () => {
    if (!webcamRef.current?.video) return;

    // تحويل النوع لضمان الوصول للمسار
    const stream = webcamRef.current.video.srcObject as MediaStream;
    const track = stream?.getVideoTracks()[0];

    if (!track) {
      toast("الكاميرا غير متصلة");
      return;
    }

    // استخدام أي (any) هنا لتجاوز قيود TypeScript على ميزات المتصفح التجريبية مثل الفلاش
    const imageTrack = track as any;

    if (!imageTrack.getCapabilities?.().torch) {
      toast("الفلاش غير مدعوم في هذا المتصفح/الجهاز");
      return;
    }

    const isTorchOn = imageTrack.getSettings().torch;
    try {
      await imageTrack.applyConstraints({
        advanced: [{ torch: !isTorchOn }]
      });
      toast(!isTorchOn ? "الفلاش: تشغيل" : "الفلاش: إيقاف");
    } catch (err) {
      toast("تعذّر تبديل الفلاش");
    }
  };

  const retryCamera = () => enableCamera();

  if (!fullscreen) return <div>الوضع العادي غير مستخدم حالياً</div>;

  return (
    <div className="fixed inset-0 bg-black z-[40] flex flex-col">
      {/* شريط علوي */}
      <header className="absolute top-0 inset-x-0 flex items-center justify-between px-4 pt-3 z-30">
        <button onClick={onBack} className="text-white/95 text-lg">إلغاء</button>
        <div className="flex items-center gap-6">
          <button onClick={cycleFilter} className="text-2xl text-white" title="اللون">⧉</button>
          <button onClick={toggleFlash} className="text-2xl text-white" title="فلاش">⚡</button>
        </div>
      </header>

      {/* الكاميرا */}
      <div className="flex-1 relative bg-black">
        {cameraError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
            <Camera className="h-16 w-16 text-white/50 mb-4" />
            <p className="text-white/90 text-lg mb-2">{cameraError}</p>
            <Button onClick={retryCamera} className="bg-primary text-white">
              <RefreshCw className="ml-2 h-4 w-4" /> إعادة المحاولة
            </Button>
          </div>
        ) : isCameraActive ? (
          <Webcam
            ref={webcamRef}
            audio={false}
            screenshotFormat="image/jpeg"
            videoConstraints={videoConstraints}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full bg-slate-800">
            <Camera className="h-12 w-12 text-slate-400" />
          </div>
        )}

        {/* طبقة التراكب (Overlay) لتوجيه المستخدم - تظهر فقط عندما تكون الكاميرا نشطة ولا يوجد خطأ */}
        {isCameraActive && !cameraError && !showSheet && (
          <div className="absolute inset-0 pointer-events-none z-20 flex items-center justify-center">
            {/* الخلفية المعتمة حول الإطار */}
            <div className="absolute inset-0 bg-black/40 mask-scan-area"></div>

            {/* إطار المسح */}
            <div className="relative w-[85%] aspect-[3/4] max-w-md border-2 border-white/50 rounded-2xl shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* أركان الإطار */}
              <div className="absolute -top-1 -left-1 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-xl"></div>
              <div className="absolute -top-1 -right-1 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-xl"></div>
              <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-xl"></div>
              <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-xl"></div>

              {/* خط المسح المتحرك */}
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/80 shadow-[0_0_15px_rgba(59,130,246,0.8)] animate-scan-line"></div>

              {/* نص توجيهي */}
              <div className="absolute -bottom-12 left-0 right-0 text-center">
                <p className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full inline-flex items-center gap-2">
                  <ScanLine className="h-4 w-4" /> ضع المستند داخل الإطار
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* رسالة الحالة */}
      <div className="absolute inset-x-0 bottom-36 mx-auto w-max rounded-full bg-white/10 backdrop-blur px-4 py-2 text-base text-white z-30">
        {isUploading ? "جاري التصحيح..." : capturedImages.length > 0 ? `${capturedImages.length} صورة ملتقطة` : "جاهز للتصوير"}
      </div>

      {/* المصغّر وزر التصحيح */}
      {!cameraError && capturedImages.length > 0 && (
        <>
          <button
            onClick={() => setShowSheet(true)}
            className="absolute bottom-6 right-4 z-30 w-16 h-16 rounded-sm border border-white/50 overflow-hidden bg-black/50"
          >
            <img
              src={capturedImages[capturedImages.length - 1].src}
              className="w-full h-full object-cover"
              alt="آخر صورة"
            />
          </button>
          <button
            onClick={uploadAllAndComplete}
            disabled={isUploading}
            className="absolute bottom-6 left-4 z-40 bg-primary text-white border border-white/20 rounded-full px-4 py-2 text-base flex items-center gap-1 shadow-lg active:scale-95 transition-transform"
          >
            {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {actionLabel || "تصحيح"} ({capturedImages.length})
          </button>
        </>
      )}

      {/* زر الغالق */}
      {!cameraError && (
        <div className="absolute inset-x-0 bottom-4 safe-bottom grid place-items-center z-30 pointer-events-none">
          <button
            onClick={capture}
            disabled={!isCameraActive}
            className="shutter w-[88px] h-[88px] rounded-full bg-white/12 border-6 border-white/95 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.2)] active:scale-98 disabled:opacity-50 pointer-events-auto"
            aria-label="التقاط"
          />
        </div>
      )}

      {/* شيت المعرض */}
      {showSheet && (
        <div className="absolute inset-0 bg-black/60 z-40 flex items-end">
          <div className="w-full bg-neutral-900 rounded-t-2xl p-4 max-h-[80vh] overflow-auto">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-white">المعرض ({capturedImages.length})</h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={selectAll}
                  className="bg-white/10 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  {selectedIds.size === capturedImages.length ? <Square className="h-4 w-4" /> : <CheckSquare className="h-4 w-4" />}
                  الكل
                </button>
                {selectedIds.size > 0 && (
                  <button
                    onClick={removeSelected}
                    className="bg-red-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                  >
                    <Trash2 className="h-4 w-4" /> حذف ({selectedIds.size})
                  </button>
                )}
                <button
                  onClick={exportToPDF}
                  className="bg-green-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1"
                >
                  <FileText className="h-4 w-4" /> PDF
                </button>
                <button
                  onClick={() => setShowSheet(false)}
                  className="bg-white/10 text-white px-3 py-1.5 rounded-lg"
                >
                  إغلاق
                </button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {capturedImages.map((img, i) => {
                const objectUrl = URL.createObjectURL(img.file);
                const isSelected = selectedIds.has(img.id);
                return (
                  <div
                    key={img.id}
                    className={`relative rounded-md overflow-hidden border transition-all ${isSelected ? 'border-primary border-4 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'border-white/15'} bg-white/5`}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleSelect(img.id); }}
                      className="absolute top-2 right-2 z-20 bg-black/60 rounded-md p-1.5 hover:bg-black/80 transition-colors"
                    >
                      {isSelected ? <CheckSquare className="h-6 w-6 text-primary shadow-sm" /> : <Square className="h-6 w-6 text-white/90 shadow-sm" />}
                    </button>

                    {/* زر المعاينة - يفتح الصورة بالحجم الكامل */}
                    <Dialog>
                      <DialogTrigger asChild>
                        <button className="w-full h-40 relative group">
                          <img src={objectUrl} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt={`scan ${i + 1}`} onLoad={() => URL.revokeObjectURL(objectUrl)} />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                            <Eye className="text-white w-8 h-8 drop-shadow-md" />
                          </div>
                        </button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl w-full p-0 overflow-hidden bg-black/90 border-0">
                        <DialogTitle className="sr-only">معاينة الصورة</DialogTitle>
                        <div className="relative w-full h-[80vh] flex items-center justify-center">
                          <img src={img.src} alt="Full view" className="max-w-full max-h-full object-contain" />
                        </div>
                      </DialogContent>
                    </Dialog>

                    <div className="flex items-center justify-between p-2 text-sm text-white">
                      <span>صورة {i + 1}</span>
                      <div className="flex gap-1">
                        <a download={`scan_${i + 1}.jpg`} href={URL.createObjectURL(img.file)} className="bg-primary px-2 py-1 rounded text-white text-xs" onClick={(e) => e.stopPropagation()}>تنزيل</a>
                        <button onClick={() => { removeImage(img.id); if (capturedImages.length === 1) setShowSheet(false); }} className="bg-red-500/80 px-2 py-1 rounded text-white text-xs hover:bg-red-600"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}