import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileText, X, Loader2, Move, ArrowRight, AlertCircle } from "lucide-react";
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

const BARCODE_WIDTH = 180;
const BARCODE_HEIGHT = 50;

const NAME_MARK_WIDTH = 70;
const NAME_MARK_HEIGHT = 20;
const FIDUCIAL_SIZE = 20;



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

  // State for positions: { pageNumber: BarcodeArea }
  const [barcodePositions, setBarcodePositions] = useState<Record<number, BarcodeArea>>({});
  const [nameMarkPositions, setNameMarkPositions] = useState<Record<number, BarcodeArea>>({});

  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragType, setDragType] = useState<"barcode" | "nameMark" | null>(null);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; page: number } | null>(null);
  const [activeTool, setActiveTool] = useState<"barcode" | "nameMark">("barcode");

  const uploadMutation = useUploadExam();

  // Handle File Selection
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf" || file.type.startsWith("image/")) {
      if (stitchedImageUrl) URL.revokeObjectURL(stitchedImageUrl);

      setSelectedFile(file);
      setBarcodePositions({});
      setNameMarkPositions({});
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
          setDefaultPositions(img.width, img.height, 1);
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
    setNameMarkPositions({});
  };
  const setDefaultPositions = (width: number, height: number, pageCount: number) => {
    const pageHeight = height / pageCount;
    const margin = 20;
    // Position the Name Mark (Black rectangle) at top right
    const initialX = Math.max(0, width - NAME_MARK_WIDTH - margin);
    const initialY = margin;
    setNameMarkPositions({ 1: { x: initialX, y: initialY, page: 1, canvasHeight: pageHeight } });
    // Barcode is left empty for user to place
    setBarcodePositions({});
  };

  // PDF Conversion Callbacks
  const handlePdfLoaded = (data: { width: number; height: number; pageCount: number; imageUrl: string }) => {
    setIsPdfConverting(false);
    setDimensions({ width: data.width, height: data.height });
    setNumPages(data.pageCount);
    setStitchedImageUrl(data.imageUrl);
    setDefaultPositions(data.width, data.height, data.pageCount);
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

  // Interaction Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!stitchedImageUrl || !dimensions) return;
    e.preventDefault();
    const { x, y, page, canvasHeight } = getCoordinates(e.clientX, e.clientY);

    // Check interaction with existing barcode
    const existBarcode = barcodePositions[page];
    if (existBarcode) {
      if (x >= existBarcode.x && x <= existBarcode.x + BARCODE_WIDTH &&
        y >= existBarcode.y && y <= existBarcode.y + BARCODE_HEIGHT) {
        setIsDragging(true);
        setDragType("barcode");
        setDragStart({ x: x - existBarcode.x, y: y - existBarcode.y, page });
        return;
      }
    }

    // Check interaction with existing name mark
    const existNameMark = nameMarkPositions[page];
    if (existNameMark) {
      if (x >= existNameMark.x && x <= existNameMark.x + NAME_MARK_WIDTH &&
        y >= existNameMark.y && y <= existNameMark.y + NAME_MARK_HEIGHT) {
        setIsDragging(true);
        setDragType("nameMark");
        setDragStart({ x: x - existNameMark.x, y: y - existNameMark.y, page });
        return;
      }
    }

    // Create active tool element
    if (activeTool === "barcode") {
      const newX = Math.max(0, Math.min(x - BARCODE_WIDTH / 2, dimensions.width - BARCODE_WIDTH));
      const newY = Math.max(0, Math.min(y - BARCODE_HEIGHT / 2, (canvasHeight || 0) - BARCODE_HEIGHT));
      setBarcodePositions(prev => ({ ...prev, [page]: { x: newX, y: newY, page, canvasHeight } }));
      setIsDragging(true);
      setDragType("barcode");
      setDragStart({ x: x - newX, y: y - newY, page });
    } else {
      const newX = Math.max(0, Math.min(x - NAME_MARK_WIDTH / 2, dimensions.width - NAME_MARK_WIDTH));
      const newY = Math.max(0, Math.min(y - NAME_MARK_HEIGHT / 2, (canvasHeight || 0) - NAME_MARK_HEIGHT));
      setNameMarkPositions(prev => ({ ...prev, [page]: { x: newX, y: newY, page, canvasHeight } }));
      setIsDragging(true);
      setDragType("nameMark");
      setDragStart({ x: x - newX, y: y - newY, page });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !dragType || !dimensions) return;
    const { x, y, canvasHeight } = getCoordinates(e.clientX, e.clientY);
    const targetPage = dragStart.page;

    if (dragType === "barcode") {
      const newX = Math.max(0, Math.min(x - dragStart.x, dimensions.width - BARCODE_WIDTH));
      const newY = Math.max(0, Math.min(y - dragStart.y, (canvasHeight || 0) - BARCODE_HEIGHT));
      setBarcodePositions(prev => ({ ...prev, [targetPage]: { ...prev[targetPage], x: newX, y: newY } }));
    } else if (dragType === "nameMark") {
      const newX = Math.max(0, Math.min(x - dragStart.x, dimensions.width - NAME_MARK_WIDTH));
      const newY = Math.max(0, Math.min(y - dragStart.y, (canvasHeight || 0) - NAME_MARK_HEIGHT));
      setNameMarkPositions(prev => ({ ...prev, [targetPage]: { ...prev[targetPage], x: newX, y: newY } }));
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
    setDragType(null);
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

    const formatPoints = (positions: Record<number, BarcodeArea>, elHeight: number, elWidth: number) => {
      return Object.entries(positions).map(([pageStr, area]) => {
        const page = parseInt(pageStr);
        // Send normalized coordinates (0 to 1)
        const xPercent = area.x / dimensions!.width;
        const pageHeight = (area.canvasHeight || (dimensions!.height / numPages));
        const yPercent = area.y / pageHeight;

        return { page, x: xPercent, y: yPercent };
      });
    };

    const barcodeDataList = formatPoints(barcodePositions, BARCODE_HEIGHT, BARCODE_WIDTH);
    const nameMarkDataList = formatPoints(nameMarkPositions, NAME_MARK_HEIGHT, NAME_MARK_WIDTH);

    // Generate Fiducials Data (Corners)
    const fiducialsDataList: { page: number; x: number; y: number }[] = [];
    if (dimensions && numPages) {
      const pageHeight = dimensions.height / numPages;
      const margin = 2; // Very small margin from edges

      for (let page = 1; page <= numPages; page++) {
        const pts = [
          { x: margin, y: margin },
          { x: dimensions.width - margin - FIDUCIAL_SIZE, y: margin },
          { x: margin, y: pageHeight - margin - FIDUCIAL_SIZE },
          { x: dimensions.width - margin - FIDUCIAL_SIZE, y: pageHeight - margin - FIDUCIAL_SIZE },
        ];
        pts.forEach(pt => {
          fiducialsDataList.push({
            page,
            x: pt.x / dimensions.width,
            y: pt.y / pageHeight
          });
        });
      }
    }

    const request: UploadExamRequest = {
      title: examTitle.trim(),
      subject: subject.trim(),
      file: selectedFile,
      barcodeData: JSON.stringify(barcodeDataList),
      nameMarkData: JSON.stringify(nameMarkDataList),
      fiducialsData: JSON.stringify(fiducialsDataList),
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
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant={activeTool === "barcode" ? "default" : "outline"}
                  onClick={() => setActiveTool("barcode")}
                  className="w-36"
                >
                  <Move className="w-4 h-4 mr-2" /> أداة الباركود
                </Button>
                <Button
                  variant={activeTool === "nameMark" ? "default" : "outline"}
                  onClick={() => setActiveTool("nameMark")}
                  className="w-48 bg-black hover:bg-neutral-800 text-white border-black"
                >
                  <Move className="w-4 h-4 mr-2" /> أداة المستطيل
                </Button>
              </div>

              {(Object.keys(barcodePositions).length > 0 || Object.keys(nameMarkPositions).length > 0) && (
                <Button variant="ghost" size="sm" onClick={() => {
                  setBarcodePositions({});
                  setNameMarkPositions({});
                }}>مسح الكل</Button>
              )}
            </div>

            <Alert className="bg-primary/5 border-primary/20">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertDescription className="text-sm font-medium text-primary">
                ضع<strong>"أداة المستطيل"</strong> (الأسود)  أعلى يمين الصفحة. ضع <strong>"أداة الباركود"</strong> في أي مساحة بيضاء فى الصفحة.
              </AlertDescription>
            </Alert>

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
                        key={`barcode-${area.page}`}
                        className="absolute border-2 border-primary bg-primary/10 flex items-center justify-center transition-opacity"
                        style={{
                          left: area.x * scale,
                          top: ((area.page - 1) * (dimensions.height / numPages) + area.y) * scale,
                          width: BARCODE_WIDTH * scale,
                          height: BARCODE_HEIGHT * scale,
                          cursor: dragType === "barcode" ? "grabbing" : "grab"
                        }}
                      >
                        <Move className="h-4 w-4 text-primary opacity-50" />
                        <div className="absolute -top-6 bg-primary text-white text-[10px] px-1 rounded whitespace-nowrap">صفحة {area.page}</div>
                      </div>
                    ))}

                    {/* Render Name Marks */}
                    {Object.values(nameMarkPositions).map(area => (
                      <div
                        key={`namemark-${area.page}`}
                        className="absolute bg-black flex items-center justify-center transition-opacity shadow-lg"
                        style={{
                          left: area.x * scale,
                          top: ((area.page - 1) * (dimensions.height / numPages) + area.y) * scale,
                          width: NAME_MARK_WIDTH * scale,
                          height: NAME_MARK_HEIGHT * scale,
                          cursor: dragType === "nameMark" ? "grabbing" : "grab"
                        }}
                      >
                        <Move className="h-4 w-4 text-white opacity-50" />
                        <div className="absolute -top-6 bg-black text-white text-[10px] px-1 rounded whitespace-nowrap">مستطيل الاسم ({area.page})</div>
                      </div>
                    ))}

                    {/* Render Fiducials (Visual Only) */}
                    {Array.from({ length: numPages }).map((_, i) => {
                      const page = i + 1;
                      const margin = 2;
                      const pageHeight = dimensions.height / numPages;

                      const pts = [
                        { x: margin, y: margin },
                        { x: dimensions.width - margin - FIDUCIAL_SIZE, y: margin },
                        { x: margin, y: pageHeight - margin - FIDUCIAL_SIZE },
                        { x: dimensions.width - margin - FIDUCIAL_SIZE, y: pageHeight - margin - FIDUCIAL_SIZE },
                      ];

                      return pts.map((pt, idx) => (
                        <div
                          key={`fiducial-${page}-${idx}`}
                          className="absolute bg-black pointer-events-none"
                          style={{
                            left: pt.x * scale,
                            top: ((page - 1) * pageHeight + pt.y) * scale,
                            width: FIDUCIAL_SIZE * scale,
                            height: FIDUCIAL_SIZE * scale,
                          }}
                        />
                      ));
                    })}
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