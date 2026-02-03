import { useState, useRef, useEffect } from "react";
import {
  Upload,
  FileText,
  X,
  Loader2,
  CheckCircle2,
  Camera,
  CameraOff,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useGradePaper } from "@/hooks/use-grading";
import { toast } from "sonner";

const ACCEPTED_TYPES = [
  "application/pdf",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
];
const ACCEPT_ATTR =
  "application/pdf,image/jpeg,image/jpg,image/png,image/webp,image/gif";
const MAX_CAMERA_PHOTOS = 150;

export function GradePaperUpload() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const gradeMutation = useGradePaper();

  // Camera state
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [capturedPhotos, setCapturedPhotos] = useState<File[]>([]);
  const [isCameraSectionOpen, setIsCameraSectionOpen] = useState(false);

  const toggleCameraSection = () => {
    if (isCameraSectionOpen && isCameraActive) {
      // Stop camera when closing section
      stopCamera();
    }
    setIsCameraSectionOpen(!isCameraSectionOpen);
  };

  const handleFileSelect = (file: File) => {
    if (file && ACCEPTED_TYPES.includes(file.type)) {
      setSelectedFile(file);
    } else {
      toast.error("يرجى اختيار ملف PDF أو صورة (JPG, PNG, WebP, GIF)");
    }
  };

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGrade = async () => {
    if (!selectedFile) {
      toast.error("يرجى اختيار ملف (PDF أو صورة) للتصحيح");
      return;
    }

    gradeMutation.mutate(
      { file: selectedFile },
      {
        onSuccess: () => {
          // Reset file after successful grading
          handleRemoveFile();
        },
      }
    );
  };

  const startCamera = async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      toast.error("الكاميرا غير مدعومة في هذا المتصفح");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      setCameraStream(stream);
      setIsCameraActive(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("تعذر تشغيل الكاميرا. يرجى التحقق من الأذونات.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    setCameraStream(null);
    setIsCameraActive(false);
  };

  const handleCapturePhoto = () => {
    if (!isCameraActive || !videoRef.current) return;

    if (capturedPhotos.length >= MAX_CAMERA_PHOTOS) {
      toast.error(`لا يمكن التقاط أكثر من ${MAX_CAMERA_PHOTOS} صورة للكاميرا`);
      return;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File(
          [blob],
          `camera-${new Date().toISOString()}.jpg`,
          { type: "image/jpeg" }
        );
        setCapturedPhotos((prev) => [...prev, file]);
      },
      "image/jpeg",
      0.9
    );
  };

  const handleClearCaptured = () => {
    setCapturedPhotos([]);
  };

  const handleGradeCaptured = async () => {
    if (capturedPhotos.length === 0) {
      toast.error("لا توجد صور ممسوحة للتصحيح");
      return;
    }

    // Grade each captured photo sequentially using the same mutation
    for (const photo of capturedPhotos.slice(0, MAX_CAMERA_PHOTOS)) {
      try {
        await (
          gradeMutation as typeof gradeMutation & {
            mutateAsync?: (vars: { file: File }) => Promise<unknown>;
          }
        ).mutateAsync?.({ file: photo });
      } catch {
        // errors handled inside useGradePaper
      }
    }

    toast.success("تم إرسال جميع صور الكاميرا للتصحيح");
    setCapturedPhotos([]);
  };

  // Attach/detach camera stream to video element
  useEffect(() => {
    const video = videoRef.current;
    if (video && cameraStream) {
      try {
        // Attach stream (supported in modern browsers)
        (video as HTMLVideoElement).srcObject = cameraStream;
        // Ensure video is muted to allow autoplay on mobile
        video.muted = true;
        const playPromise = video.play();
        if (playPromise && typeof playPromise.then === "function") {
          playPromise.catch((err) => {
            console.warn("Unable to autoplay video", err);
          });
        }
      } catch (e) {
        console.error("Failed to attach video stream", e);
        toast.error("تعذر تشغيل معاينة الكاميرا");
      }
    }

    return () => {
      if (video && (video as HTMLVideoElement).srcObject) {
        const stream = (video as HTMLVideoElement).srcObject as MediaStream;
        stream.getTracks().forEach((t) => t.stop());
        (video as HTMLVideoElement).srcObject = null;
      }
    };
  }, [cameraStream]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>تصحيح ورقة اختبار</CardTitle>
        <CardDescription>
          ارفع ورقة الاختبار الممسوحة ضوئياً وسيقوم النظام بقراءة الباركود
          وتصحيح الورقة تلقائياً
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File Upload Area */}
        {!selectedFile ? (
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`flex items-center justify-center w-full h-40 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              dragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:bg-muted/50"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex flex-col items-center justify-center">
              <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                <span className="font-semibold">انقر للرفع</span> أو اسحب الملف
                هنا
              </p>
              <p className="text-xs text-muted-foreground">
                PDF أو صورة (JPG, PNG, WebP, GIF)
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              accept={ACCEPT_ATTR}
              onChange={handleFileInputChange}
            />
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-primary" />
                <div>
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRemoveFile}
                disabled={gradeMutation.isPending}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <Button
              onClick={handleGrade}
              disabled={gradeMutation.isPending}
              className="w-full"
              size="lg"
            >
              {gradeMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري التصحيح...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  تصحيح الورقة
                </>
              )}
            </Button>
          </div>
        )}

        {/* Camera Scan Section */}
        <div className="pt-4 border-t">
          <button
            type="button"
            onClick={toggleCameraSection}
            className="flex w-full items-center justify-between gap-2 py-2 text-right transition-colors hover:text-foreground"
          >
            <div className="flex items-center gap-2">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  مسح أوراق الاختبار باستخدام الكاميرا
                </p>
                <p className="text-xs text-muted-foreground">
                  يمكنك التقاط حتى {MAX_CAMERA_PHOTOS} صورة، ثم إرسالها للتصحيح
                  تلقائياً.
                </p>
              </div>
            </div>
            {isCameraSectionOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground shrink-0" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
            )}
          </button>

          {isCameraSectionOpen && (
            <div className="pt-3 space-y-3">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] items-start">
                {/* Camera preview & controls */}
                <div className="space-y-3">
                  <div className="aspect-video w-full bg-muted rounded-md overflow-hidden border flex items-center justify-center">
                    {isCameraActive ? (
                      <video
                        ref={videoRef}
                        className="w-full h-full object-contain"
                        autoPlay
                        playsInline
                        muted
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground px-4 text-center">
                        اضغط على زر "تشغيل الكاميرا" لبدء مسح أوراق الاختبار.
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={isCameraActive ? "destructive" : "outline"}
                      onClick={isCameraActive ? stopCamera : startCamera}
                    >
                      {isCameraActive ? (
                        <>
                          <CameraOff className="h-4 w-4 ml-2" />
                          إيقاف الكاميرا
                        </>
                      ) : (
                        <>
                          <Camera className="h-4 w-4 ml-2" />
                          تشغيل الكاميرا
                        </>
                      )}
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleCapturePhoto}
                      disabled={
                        !isCameraActive ||
                        capturedPhotos.length >= MAX_CAMERA_PHOTOS
                      }
                    >
                      التقاط صورة
                    </Button>
                  </div>
                </div>

                {/* Captured photos list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>
                      الصور الملتقطة:{" "}
                      <span className="font-medium text-foreground">
                        {capturedPhotos.length} / {MAX_CAMERA_PHOTOS}
                      </span>
                    </span>
                    {capturedPhotos.length > 0 && (
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={handleClearCaptured}
                      >
                        مسح جميع الصور
                      </Button>
                    )}
                  </div>
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border rounded-md p-2 bg-muted/40">
                    {capturedPhotos.length === 0 ? (
                      <p className="col-span-3 text-[11px] text-muted-foreground text-center">
                        لم يتم التقاط أي صور بعد.
                      </p>
                    ) : (
                      capturedPhotos.map((photo, index) => {
                        const url = URL.createObjectURL(photo);
                        return (
                          <div
                            key={photo.name + index}
                            className="relative rounded overflow-hidden border bg-background"
                          >
                            <img
                              src={url}
                              alt={`capture-${index + 1}`}
                              className="w-full h-16 object-cover"
                              onLoad={() => URL.revokeObjectURL(url)}
                            />
                            <span className="absolute bottom-0 right-0 text-[10px] bg-black/60 text-white px-1">
                              #{index + 1}
                            </span>
                          </div>
                        );
                      })
                    )}
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    className="w-full"
                    onClick={handleGradeCaptured}
                    disabled={
                      capturedPhotos.length === 0 || gradeMutation.isPending
                    }
                  >
                    {gradeMutation.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                        جاري إرسال الصور للتصحيح...
                      </>
                    ) : (
                      "تصحيح جميع صور الكاميرا"
                    )}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
