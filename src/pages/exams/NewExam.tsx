import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Loader2, Move, ArrowRight, RotateCw, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MainLayout } from "@/components/layout/MainLayout";
import { useUploadExam } from "@/hooks/use-exams";
import type { UploadExamRequest } from "@/types/exams";
import { toast } from "sonner";
import StitchedPdfViewer from "@/components/ui/StitchedPdfViewerProps";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BarcodeArea {
  x: number;
  y: number; // Y from top of the page it's on
  page: number;
  canvasHeight?: number; // Total height of the single page
}

const BARCODE_WIDTH = 200;
const BARCODE_HEIGHT = 60;



interface PdfPageProps {
  pageNumber: number;
  pdfDocument: any;
  scale: number;
  barcodeArea: BarcodeArea | null;
  onBarcodeChange: (area: BarcodeArea | null) => void;
  width: number;
  height: number;
}

export default function NewExam() {
  const navigate = useNavigate();
  const [examTitle, setExamTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // States for document preview
  const [stitchedImageUrl, setStitchedImageUrl] = useState<string | null>(null);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [isPdfConverting, setIsPdfConverting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // State for barcode positions: { pageNumber: BarcodeArea }
  const [barcodePositions, setBarcodePositions] = useState<Record<number, BarcodeArea>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; page: number } | null>(null);

  const uploadMutation = useUploadExam();

  // Handle File Selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      if (stitchedImageUrl) URL.revokeObjectURL(stitchedImageUrl);

      setSelectedFile(file);
      setBarcodePositions({});
      setDimensions(null);
      setNumPages(0);
      setPdfError(null);

      if (file.type.startsWith("image/")) {
        const url = URL.createObjectURL(file);
        setStitchedImageUrl(url);
        const img = new Image();
        img.onload = () => {
          setDimensions({ width: img.width, height: img.height });
          setNumPages(1);
        };
        img.src = url;
      } else {
        setIsPdfConverting(true);
      }
    } else {
      toast.error("يرجى اختيار ملف PDF أو صورة فقط");
    }
  }, [stitchedImageUrl]);

  const handleRemoveFile = () => {
    if (stitchedImageUrl) URL.revokeObjectURL(stitchedImageUrl);
    setSelectedFile(null);
    setStitchedImageUrl(null);
    setDimensions(null);
    setNumPages(0);
    setBarcodePositions({});
  };

  // PDF Conversion Callbacks
  const handlePdfLoaded = (data: { width: number; height: number; pageCount: number; imageUrl: string }) => {
    setIsPdfConverting(false);
    setDimensions({ width: data.width, height: data.height });
    setNumPages(data.pageCount);
    setStitchedImageUrl(data.imageUrl);
  };

  const handlePdfError = (error: string) => {
    setIsPdfConverting(false);
    setPdfError(error);
    toast.error(`خطأ في تحويل PDF: ${error}`);
  };

  // Calculate Scale
  useEffect(() => {
    if (!containerRef.current || !dimensions) return;
    const updateScale = () => {
      if (!containerRef.current || !dimensions) return;
      const containerWidth = containerRef.current.clientWidth - 48;
      const widthScale = containerWidth / dimensions.width;
      setScale(Math.min(widthScale, 1));
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [dimensions]);

  // Coordinate Conversion
  const getCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current || !dimensions || !numPages)
      return { x: 0, y: 0, page: 1 };

    const rect = canvasRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const docY = scrollTop + (clientY - rect.top);

    const canvasHeight = dimensions.height / numPages;
    const page = Math.min(numPages, Math.max(1, Math.ceil(docY / (canvasHeight * scale))));

    // Y inside the page (from top)
    const y = (docY - (page - 1) * canvasHeight * scale) / scale;
    const x = (clientX - rect.left) / scale;

    return { x: Math.max(0, x), y: Math.max(0, y), page, canvasHeight };
  };

  // Barcode Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stitchedImageUrl || !dimensions) return;
    e.preventDefault();
    const { x, y, page, canvasHeight } = getCoordinates(e.clientX, e.clientY);

    // Check interaction with existing barcode on this page
    const existing = barcodePositions[page];
    if (existing) {
      if (x >= existing.x && x <= existing.x + BARCODE_WIDTH &&
        y >= existing.y && y <= existing.y + BARCODE_HEIGHT) {
        setIsDragging(true);
        setDragStart({ x: x - existing.x, y: y - existing.y, page });
        return;
      }
    }

    // Create or move barcode
    const newX = Math.max(0, Math.min(x - BARCODE_WIDTH / 2, dimensions.width - BARCODE_WIDTH));
    const newY = Math.max(0, Math.min(y - BARCODE_HEIGHT / 2, canvasHeight - BARCODE_HEIGHT));

    setBarcodePositions(prev => ({
      ...prev,
      [page]: { x: newX, y: newY, page, canvasHeight }
    }));
    setIsDragging(true);
    setDragStart({ x: x - newX, y: y - newY, page });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !dimensions) return;
    const { x, y, page, canvasHeight } = getCoordinates(e.clientX, e.clientY);

    // Only allow dragging on the same page for now to keep it simple
    // If you want cross-page dragging, you'd need to track which page the barcode "belongs" to
    const targetPage = dragStart.page;
    const newX = Math.max(0, Math.min(x - dragStart.x, dimensions.width - BARCODE_WIDTH));
    const newY = Math.max(0, Math.min(y - dragStart.y, canvasHeight - BARCODE_HEIGHT));

    setBarcodePositions(prev => ({
      ...prev,
      [targetPage]: { ...prev[targetPage], x: newX, y: newY }
    }));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const handleSubmit = async () => {
    if (!selectedFile || !examTitle.trim() || !subject.trim()) {
      toast.error("يرجى ملء جميع الحقول واختيار ملف");
      return;
    }

    const pages = Object.keys(barcodePositions).map(Number);
    if (pages.length === 0) {
      toast.error("يرجى تحديد موقع الباركود على صفحة واحدة على الأقل");
      return;
    }

    const isPdf = selectedFile.type === "application/pdf";

    const barcodeDataList = Object.entries(barcodePositions).map(([pageStr, area]) => {
      const page = parseInt(pageStr);

      let xPoints, yPoints;

      if (isPdf) {
        // PDF points: Stitched rendered at 2.0 scale, so divide pixels by 2
        xPoints = Math.round(area.x / 2);
        // Backend iText Y is from bottom. 
        // area.canvasHeight (rendered pixels) / 2 = PDF Height in points
        const pdfPageHeight = (area.canvasHeight || 0) / 2;
        yPoints = Math.round(pdfPageHeight - (area.y / 2) - (BARCODE_HEIGHT / 2));
      } else {
        // Image: 1:1 points to pixels in our new backend logic
        xPoints = Math.round(area.x);
        // iText Y is from bottom. 
        const imageHeight = area.canvasHeight || 0;
        yPoints = Math.round(imageHeight - area.y - BARCODE_HEIGHT);
      }

      return { page, x: xPoints, y: yPoints };
    });

    const request: UploadExamRequest = {
      title: examTitle.trim(),
      subject: subject.trim(),
      file: selectedFile,
      barcodeData: JSON.stringify(barcodeDataList),
    };

    uploadMutation.mutate(request, {
      onSuccess: () => navigate("/exams"),
      onError: (error) => {
        console.error("Upload error:", error);
        toast.error("فشل رفع الملف. تأكد من أن الخادم يعمل، ثم حاول مرة أخرى.");
      },
    });
  };

  const activeBarcodeInfo = useMemo(() => {
    const pages = Object.keys(barcodePositions).map(Number);
    if (pages.length === 0) return null;
    const lastPage = pages[pages.length - 1];
    return barcodePositions[lastPage];
  }, [barcodePositions]);

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 h-full overflow-hidden">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate("/exams")}>
              <ArrowRight className="h-4 w-4 ml-2" />
              العودة
            </Button>
            <h1 className="text-3xl font-bold text-foreground">رفع اختبار جديد</h1>
          </div>
          <p className="text-muted-foreground">ارفع ورقة الأسئلة (PDF أو صورة) وحدد موقع الباركود</p>
        </div>

        {/* Inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label htmlFor="examTitle">اسم الاختبار *</Label>
              <Input id="examTitle" value={examTitle} onChange={(e) => setExamTitle(e.target.value)} placeholder="مثال: اختبار الفصل الأول" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">المادة *</Label>
              <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="مثال: الرياضيات" />
            </div>
          </div>

          <div className="space-y-2">
            <Label>ورقة الأسئلة *</Label>
            {!selectedFile ? (
              <label htmlFor="file-upload" className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground"><span className="font-semibold">انقر للرفع</span> أو اسحب الملف</p>
                  <p className="text-xs text-muted-foreground">PDF أو صور</p>
                </div>
                <input id="file-upload" type="file" className="hidden" accept="application/pdf,image/*" onChange={handleFileSelect} />
              </label>
            ) : (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px]">{selectedFile.name}</span>
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveFile}><X className="w-4 h-4" /></Button>
              </div>
            )}
          </div>
        </div>

        {/* PDF Converter (Hidden) */}
        {selectedFile?.type === "application/pdf" && (
          <StitchedPdfViewer file={selectedFile} onLoaded={handlePdfLoaded} onError={handlePdfError} hidden />
        )}

        {/* Preview Area */}
        {selectedFile && (
          <div className="flex flex-col flex-1 min-h-0 w-full space-y-4">
            <div className="flex items-center justify-between">
              <Label>حدد موقع الباركود على الورقة *</Label>
              {Object.keys(barcodePositions).length > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setBarcodePositions({})}>مسح الكل</Button>
              )}
            </div>

            <div className="flex flex-col flex-1 min-h-0 border rounded-lg p-4 bg-muted/30 relative">
              {isPdfConverting && (
                <div className="absolute inset-0 z-50 bg-background/50 flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium">جاري معالجة الملف...</p>
                </div>
              )}

              {pdfError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{pdfError}</AlertDescription>
                  <Button variant="outline" size="sm" className="mt-2" onClick={() => handleFileSelect({ target: { files: [selectedFile] } } as any)}>إعادة المحاولة</Button>
                </Alert>
              )}

              <div ref={containerRef} className="flex-1 overflow-y-auto min-h-0 border rounded bg-white relative">
                {stitchedImageUrl && dimensions && (
                  <div
                    ref={canvasRef}
                    className="relative cursor-crosshair mx-auto shadow-sm"
                    style={{ width: dimensions.width * scale, height: dimensions.height * scale }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    <img
                      src={stitchedImageUrl}
                      alt="Preview"
                      className="w-full h-full pointer-events-none select-none"
                      draggable={false}
                    />

                    {/* Render Barcodes */}
                    {Object.values(barcodePositions).map(area => (
                      <div
                        key={area.page}
                        className="absolute border-2 border-primary bg-primary/10 flex items-center justify-center transition-opacity"
                        style={{
                          left: area.x * scale,
                          top: ((area.page - 1) * (dimensions.height / numPages) + area.y) * scale,
                          width: BARCODE_WIDTH * scale,
                          height: BARCODE_HEIGHT * scale,
                        }}
                      >
                        <Move className="h-4 w-4 text-primary opacity-50" />
                        <div className="absolute -top-6 bg-primary text-white text-[10px] px-1 rounded">صفحة {area.page}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {activeBarcodeInfo && (
                <div className="mt-3 text-[10px] text-muted-foreground text-center">
                  موقع الباركود (صفحة {activeBarcodeInfo.page}): X={Math.round(activeBarcodeInfo.x)}px, Y={Math.round(activeBarcodeInfo.y)}px
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer actions */}
        <div className="flex justify-end gap-4 pt-4 border-t">
          <Button variant="outline" onClick={() => navigate("/exams")} disabled={uploadMutation.isPending}>إلغاء</Button>
          <Button onClick={handleSubmit} disabled={uploadMutation.isPending || !selectedFile || Object.keys(barcodePositions).length === 0}>
            {uploadMutation.isPending ? <><Loader2 className="w-4 h-4 ml-2 animate-spin" /> جاري الرفع...</> : <><Upload className="w-4 h-4 ml-2" /> رفع الاختبار</>}
          </Button>
        </div>
      </div>
    </MainLayout>
  );
}
