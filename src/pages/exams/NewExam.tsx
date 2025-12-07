import { useState, useRef } from "react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Loader2, Move, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout/MainLayout";
import { useUploadExam } from "@/hooks/use-exams";
import type { UploadExamRequest } from "@/types/exams";
import { toast } from "sonner";

interface BarcodeArea {
  x: number;
  y: number; // Y from bottom
  canvasHeight: number;
}

const BARCODE_WIDTH = 200;
const BARCODE_HEIGHT = 60;

// Page size definitions (width × height in pixels at 96 DPI)
const PAGE_SIZES = {
  a4: {
    name: "A4",
    width: 794, // 210mm
    height: 1123, // 297mm
    description: "210 × 297 mm",
  },
  letter: {
    name: "Letter (US)",
    width: 816, // 8.5 inches
    height: 1056, // 11 inches
    description: "8.5 × 11 in",
  },
  legal: {
    name: "Legal (US)",
    width: 816, // 8.5 inches
    height: 1344, // 14 inches
    description: "8.5 × 14 in",
  },
  a3: {
    name: "A3",
    width: 1123, // 297mm
    height: 1587, // 420mm
    description: "297 × 420 mm",
  },
  a5: {
    name: "A5",
    width: 559, // 148mm
    height: 794, // 210mm
    description: "148 × 210 mm",
  },
} as const;

export default function NewExam() {
  const navigate = useNavigate();
  const [examTitle, setExamTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [barcodeArea, setBarcodeArea] = useState<BarcodeArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const canvasRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pdfIframeRef = useRef<HTMLIFrameElement>(null);
  const [scale, setScale] = useState(1);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);

  const uploadMutation = useUploadExam();

  // Get canvas dimensions - use A4 as default, or PDF dimensions if available
  const canvasWidth = pdfDimensions?.width || PAGE_SIZES.a4.width;
  const canvasHeight = pdfDimensions?.height || PAGE_SIZES.a4.height;

  // Create PDF URL from selected file
  React.useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);
      setPdfUrl(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    } else {
      setPdfUrl(null);
      setPdfDimensions(null);
    }
  }, [selectedFile]);

  // Calculate scale to fit container and get PDF dimensions
  React.useEffect(() => {
    if (containerRef.current && selectedFile && pdfUrl) {
      const updateScale = () => {
        const container = containerRef.current;
        if (!container) return;

        // Use iframe dimensions or fallback to page size
        const iframe = pdfIframeRef.current;
        if (iframe && iframe.contentWindow) {
          try {
            // Try to get PDF dimensions from iframe
            // For now, we'll use the page size dimensions
            const containerRect = container.getBoundingClientRect();
            const availableWidth = containerRect.width - 32; // padding
            const availableHeight = containerRect.height - 32; // padding

            const widthScale = availableWidth / canvasWidth;
            const heightScale = availableHeight / canvasHeight;
            const newScale = Math.min(widthScale, heightScale, 1); // Don't scale up

            setScale(newScale);
          } catch {
            // If we can't access iframe, use container-based scaling
            const containerRect = container.getBoundingClientRect();
            const availableWidth = containerRect.width - 32;
            const availableHeight = containerRect.height - 32;

            const widthScale = availableWidth / canvasWidth;
            const heightScale = availableHeight / canvasHeight;
            const newScale = Math.min(widthScale, heightScale, 1);

            setScale(newScale);
          }
        } else {
          // Fallback scaling
          const containerRect = container.getBoundingClientRect();
          const availableWidth = containerRect.width - 32;
          const availableHeight = containerRect.height - 32;

          const widthScale = availableWidth / canvasWidth;
          const heightScale = availableHeight / canvasHeight;
          const newScale = Math.min(widthScale, heightScale, 1);

          setScale(newScale);
        }
      };

      // Wait for iframe to load
      const iframe = pdfIframeRef.current;
      if (iframe) {
        iframe.onload = () => {
          setTimeout(updateScale, 100);
        };
      }

      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [selectedFile, pdfUrl, canvasWidth, canvasHeight]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    // Calculate coordinates relative to the overlay div
    // The overlay is centered, so we need to account for that
    const relativeX = clientX - rect.left;
    const relativeY = clientY - rect.top;
    // Convert to unscaled coordinates
    const x = relativeX / scale;
    const y = relativeY / scale;
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    // Check if clicking on existing barcode area
    if (barcodeArea) {
      const topY = canvasHeight - barcodeArea.y - BARCODE_HEIGHT;
      const isOnBarcode =
        x >= barcodeArea.x &&
        x <= barcodeArea.x + BARCODE_WIDTH &&
        y >= topY &&
        y <= topY + BARCODE_HEIGHT;

      if (isOnBarcode) {
        setIsDragging(true);
        setDragStart({ x: x - barcodeArea.x, y: y - topY });
        return;
      }
    }

    // Create new barcode area (centered on click)
    const newX = Math.max(
      0,
      Math.min(x - BARCODE_WIDTH / 2, canvasWidth - BARCODE_WIDTH)
    );
    const topY = Math.max(
      0,
      Math.min(y - BARCODE_HEIGHT / 2, canvasHeight - BARCODE_HEIGHT)
    );
    const newY = canvasHeight - topY - BARCODE_HEIGHT; // Convert to Y from bottom

    setBarcodeArea({
      x: newX,
      y: newY, // Y from bottom
      canvasHeight,
    });
    setIsDragging(true);
    setDragStart({ x: x - newX, y: y - topY });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!canvasRef.current || !isDragging) return;
    if (!barcodeArea || !dragStart) return;

    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);

    // Move barcode area
    const newX = Math.max(
      0,
      Math.min(x - dragStart.x, canvasWidth - BARCODE_WIDTH)
    );
    const topY = Math.max(
      0,
      Math.min(y - dragStart.y, canvasHeight - BARCODE_HEIGHT)
    );
    const newY = canvasHeight - topY - BARCODE_HEIGHT; // Convert to Y from bottom

    setBarcodeArea({
      x: newX,
      y: newY,
      canvasHeight,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleClearBarcode = () => {
    setBarcodeArea(null);
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setSelectedFile(file);
    } else {
      toast.error("يرجى اختيار ملف PDF فقط");
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !examTitle.trim() || !subject.trim()) {
      toast.error("يرجى ملء جميع الحقول واختيار ملف PDF");
      return;
    }

    if (!barcodeArea) {
      toast.error("يرجى تحديد موقع الباركود على الورقة");
      return;
    }

    // Convert pixel coordinates to PDF points
    // At 96 DPI: 1 pixel = 72/96 = 0.75 PDF points
    // 1 PDF point = 1/72 inch
    const PIXELS_TO_POINTS = 72 / 96; // 0.75
    const xPoints = Math.round(barcodeArea.x * PIXELS_TO_POINTS);
    const yPoints = Math.round(barcodeArea.y * PIXELS_TO_POINTS);

    const request: UploadExamRequest = {
      title: examTitle.trim(),
      subject: subject.trim(),
      file: selectedFile,
      x: xPoints, // X coordinate in PDF points
      y: yPoints, // Y coordinate in PDF points (from bottom)
    };

    uploadMutation.mutate(request, {
      onSuccess: () => {
        // Navigate back to exams page on success
        navigate("/exams");
      },
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 h-full overflow-hidden">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/exams")}
            >
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
            <h1 className="text-3xl font-bold text-foreground">
              رفع امتحان جديد
            </h1>
          </div>
          <p className="text-muted-foreground">
            ارفع ورقة الأسئلة PDF وحدد موقع الباركود
          </p>
        </div>

        {/* Form Inputs Row */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Exam Title */}
          <div>
            <div className="space-y-2">
              <Label htmlFor="examTitle">اسم الامتحان *</Label>
              <Input
                id="examTitle"
                value={examTitle}
                onChange={(e) => setExamTitle(e.target.value)}
                placeholder="مثال: امتحان الفصل الأول"
              />
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">المادة *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="مثال: الرياضيات"
              />
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label>ورقة الأسئلة (PDF) *</Label>
            {!selectedFile ? (
              <div className="flex items-center justify-center w-full">
                <label
                  htmlFor="file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                    <p className="mb-2 text-sm text-muted-foreground">
                      <span className="font-semibold">انقر للرفع</span> أو اسحب
                      الملف هنا
                    </p>
                    <p className="text-xs text-muted-foreground">PDF فقط</p>
                  </div>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileSelect}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm font-medium truncate">
                      {selectedFile.name}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Barcode Selection - Full Width */}
        {selectedFile && (
          <div className="flex flex-col flex-1 min-h-0 w-full space-y-4">
            <div className="flex items-center justify-between flex-shrink-0">
              <Label>حدد موقع الباركود على الورقة *</Label>
              {barcodeArea && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleClearBarcode}
                >
                  مسح
                </Button>
              )}
            </div>
            <div className="flex flex-col flex-1 min-h-0 border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3 flex-shrink-0">
                انقر أو اسحب على الورقة لتحديد موقع الباركود (الحجم:{" "}
                {BARCODE_WIDTH}×{BARCODE_HEIGHT} بكسل)
              </p>
              <div
                ref={containerRef}
                className="flex-1 min-h-0 border rounded bg-muted/20 p-2 flex items-center justify-center relative"
              >
                {/* PDF Display */}
                {pdfUrl && (
                  <iframe
                    ref={pdfIframeRef}
                    src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                    className="border-0"
                    style={{
                      width: `${canvasWidth * scale}px`,
                      height: `${canvasHeight * scale}px`,
                      maxWidth: "100%",
                      maxHeight: "100%",
                    }}
                  />
                )}
                {/* Overlay for barcode selection */}
                <div
                  ref={canvasRef}
                  className="absolute cursor-crosshair select-none"
                  style={{
                    width: `${canvasWidth * scale}px`,
                    height: `${canvasHeight * scale}px`,
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    pointerEvents: "auto",
                  }}
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Barcode Area Overlay */}
                  {barcodeArea && (
                    <div
                      className="absolute border-2 border-primary bg-primary/10 flex items-center justify-center transition-all pointer-events-none"
                      style={{
                        left: `${barcodeArea.x * scale}px`,
                        top: `${
                          (canvasHeight - barcodeArea.y - BARCODE_HEIGHT) *
                          scale
                        }px`,
                        width: `${BARCODE_WIDTH * scale}px`,
                        height: `${BARCODE_HEIGHT * scale}px`,
                      }}
                      title="اسحب لتحريك الباركود"
                    >
                      <Move className="h-6 w-6 text-primary opacity-50" />
                    </div>
                  )}
                </div>
              </div>
              {barcodeArea && (
                <div className="mt-3 text-xs text-muted-foreground text-center flex-shrink-0">
                  <p>
                    الموقع: X = {Math.round(barcodeArea.x * (72 / 96))}pt, Y ={" "}
                    {Math.round(barcodeArea.y * (72 / 96))}pt (من الأسفل)
                  </p>
                  <p className="text-[10px] opacity-75 mt-1">
                    ({Math.round(barcodeArea.x)}px × {Math.round(barcodeArea.y)}
                    px)
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => navigate("/exams")}
            disabled={uploadMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              uploadMutation.isPending ||
              !selectedFile ||
              !examTitle.trim() ||
              !subject.trim() ||
              !barcodeArea
            }
          >
            {uploadMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الرفع...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                رفع الامتحان
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
