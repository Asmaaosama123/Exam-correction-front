import { useState, useRef, useEffect } from "react";
import { Upload, FileText, X } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

// Type declaration for global PDF.js library (same as NewExam)
interface PdfJsLib {
  version: string;
  GlobalWorkerOptions: {
    workerSrc: string;
  };
  getDocument(src: { data: ArrayBuffer }): {
    promise: Promise<{
      getPage(pageNumber: number): Promise<{
        getViewport(params: { scale: number }): {
          width: number;
          height: number;
        };
      }>;
    }>;
  };
}

declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
    pdfjs?: PdfJsLib;
  }
}

// Use PDF.js from global scope (loaded in index.html)
const getPdfJs = (): PdfJsLib => {
  const pdfjsLib = window.pdfjsLib || window.pdfjs;
  if (!pdfjsLib) {
    throw new Error("مكتبة PDF.js غير متوفرة. يرجى التأكد من تحميلها في HTML.");
  }
  // Configure worker if not already configured
  if (!pdfjsLib.GlobalWorkerOptions.workerSrc) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${
      pdfjsLib.version || "3.11.174"
    }/pdf.worker.min.js`;
  }
  return pdfjsLib;
};

// Page size definitions (width × height in pixels at 96 DPI) - reused from NewExam
const PAGE_SIZES = {
  a4: {
    name: "A4",
    width: 794,
    height: 1123,
  },
} as const;

type QuestionType = "mcq" | "tf" | "essay";

interface QuestionBox {
  id: string;
  index: number;
  page: number; // 1-based page number for multi-page PDF
  x: number;
  y: number;
  width: number;
  height: number;
}

interface QuestionConfig {
  id: string;
  type: QuestionType;
  mcqAnswer?: "أ" | "ب" | "ج" | "د";
  tfAnswer?: "صح" | "خطأ";
}

export default function ExamTemplateSetup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const pdfUrlRef = useRef<string | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1);
  const pdfDocRef = useRef<unknown>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const pageCanvasRefs = useRef<(HTMLCanvasElement | null)[]>([]);

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{
    x: number;
    y: number;
    page: number;
  } | null>(null);
  const [previewBox, setPreviewBox] = useState<QuestionBox | null>(null);
  const [boxes, setBoxes] = useState<QuestionBox[]>([]);

  const [currentQuestionType, setCurrentQuestionType] =
    useState<QuestionType | null>(null);
  const [isDrawingMode, setIsDrawingMode] = useState(false);

  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [questionConfigs, setQuestionConfigs] = useState<
    Record<string, QuestionConfig>
  >({});

  const canvasWidth = pdfDimensions?.width || PAGE_SIZES.a4.width;
  const canvasHeight = pdfDimensions?.height || PAGE_SIZES.a4.height;
  const totalPdfHeight = numPages * canvasHeight * scale;

  // Load PDF URL and (optionally) extract first-page dimensions for overlay scaling
  useEffect(() => {
    if (selectedFile) {
      const url = URL.createObjectURL(selectedFile);

      pdfUrlRef.current = url;

      const prepare = async () => {
        try {
          const pdfjs = getPdfJs();
          const arrayBuffer = await selectedFile.arrayBuffer();
          const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
          const anyPdf = pdf as unknown as { numPages: number };
          pdfDocRef.current = pdf;
          setNumPages(anyPdf.numPages || 1);

          const page = await pdf.getPage(1);
          const viewport = page.getViewport({ scale: 1.0 });
          const width = viewport.width;
          const height = viewport.height;

          setPdfDimensions({ width, height });
          setBoxes([]);
          setPreviewBox(null);
        } catch (error) {
          console.error("Error extracting PDF dimensions:", error);
          toast.error(
            "فشل قراءة أبعاد الملف. سيتم استخدام الأبعاد الافتراضية."
          );
          setPdfDimensions({
            width: PAGE_SIZES.a4.width,
            height: PAGE_SIZES.a4.height,
          });
          setBoxes([]);
          setPreviewBox(null);
        }
      };

      // Run async preparation to avoid synchronous cascading updates
      prepare();

      return () => {
        if (pdfUrlRef.current) {
          URL.revokeObjectURL(pdfUrlRef.current);
          pdfUrlRef.current = null;
        }
      };
    } else {
      pdfDocRef.current = null;
      if (pdfUrlRef.current) {
        URL.revokeObjectURL(pdfUrlRef.current);
        pdfUrlRef.current = null;
      }
      setTimeout(() => {
        setPdfDimensions(null);
        setNumPages(1);
        setBoxes([]);
        setPreviewBox(null);
      }, 0);
    }
  }, [selectedFile]);

  // Calculate scale to fit container horizontally (vertical scroll allowed)
  useEffect(() => {
    if (containerRef.current && selectedFile && pdfDimensions) {
      const updateScale = () => {
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const availableWidth = containerRect.width - 32;

        const widthScale = availableWidth / canvasWidth;
        const newScale = Math.min(widthScale, 1); // لا نكبّر فوق الحجم الأصلي

        setScale(newScale);
      };

      updateScale();
      window.addEventListener("resize", updateScale);
      return () => window.removeEventListener("resize", updateScale);
    }
  }, [selectedFile, pdfDimensions, canvasWidth]);

  // Render PDF pages at high resolution so text stays sharp when displayed at scale
  const renderScale =
    (96 / 72) *
    scale *
    Math.max(
      3,
      typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1
    );

  useEffect(() => {
    const pdf = pdfDocRef.current as {
      getPage: (n: number) => Promise<unknown>;
    } | null;
    if (!pdf || !numPages || !pdfDimensions) return;

    const renderPage = async (pageNum: number) => {
      const canvas = pageCanvasRefs.current[pageNum - 1];
      if (!canvas) return;
      try {
        const page = (await pdf.getPage(pageNum)) as {
          getViewport: (o: { scale: number }) => {
            width: number;
            height: number;
          };
          render: (o: unknown) => { promise: Promise<void> };
        };
        const viewport = page.getViewport({ scale: renderScale });
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = "high";
          await page.render({ canvasContext: ctx, viewport }).promise;
        }
      } catch (e) {
        console.error("Error rendering page", pageNum, e);
      }
    };

    const run = async () => {
      for (let i = 1; i <= numPages; i++) await renderPage(i);
    };
    run();
  }, [selectedFile, numPages, pdfDimensions, scale, renderScale]);

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current)
      return { x: 0, y: 0, page: 1 };
    const rect = canvasRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const docY = scrollTop + (clientY - rect.top);
    const pageHeightScaled = canvasHeight * scale;
    const page = Math.min(
      numPages,
      Math.max(1, 1 + Math.floor(docY / pageHeightScaled))
    );
    const yOnPage = docY - (page - 1) * pageHeightScaled;
    const x = (clientX - rect.left) / scale;
    const y = yOnPage / scale;
    return { x, y, page };
  };

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFile || !isDrawingMode) return;
    if (!currentQuestionType) {
      toast.error("يرجى اختيار نوع السؤال قبل الرسم");
      return;
    }
    const { x, y, page } = getCanvasCoordinates(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart({ x, y, page });
    const id = `${Date.now()}-${boxes.length + 1}`;
    setPreviewBox({
      id,
      index: boxes.length + 1,
      page,
      x,
      y,
      width: 0,
      height: 0,
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !previewBox) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const left = Math.min(drawStart.x, x);
    const top = Math.min(drawStart.y, y);
    const width = Math.abs(x - drawStart.x);
    const height = Math.abs(y - drawStart.y);
    setPreviewBox((prev) =>
      prev
        ? {
            ...prev,
            page: drawStart.page,
            x: left,
            y: top,
            width,
            height,
          }
        : prev
    );
  };

  const handleCanvasMouseUp = () => {
    if (isDrawing && previewBox && drawStart) {
      if (previewBox.width > 10 && previewBox.height > 10) {
        setBoxes((prev) => {
          const newBox: QuestionBox = {
            ...previewBox,
            index: prev.length + 1,
            page: drawStart.page,
          };

          // Pre-fill config with currently selected question type
          if (currentQuestionType) {
            setQuestionConfigs((prevConfigs) => ({
              ...prevConfigs,
              [newBox.id]: {
                ...(prevConfigs[newBox.id] || { id: newBox.id }),
                id: newBox.id,
                type: currentQuestionType,
              },
            }));
          }

          return [...prev, newBox];
        });
      }
    }
    setIsDrawing(false);
    setDrawStart(null);
    setPreviewBox(null);
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

  const handleClearBoxes = () => {
    setBoxes([]);
    setPreviewBox(null);
  };

  const handleDeleteLastBox = () => {
    setBoxes((prev) => {
      if (prev.length === 0) return prev;
      const last = prev[prev.length - 1];
      setQuestionConfigs((prevConfigs) => {
        const newConfigs = { ...prevConfigs };
        delete newConfigs[last.id];
        return newConfigs;
      });
      return prev.slice(0, -1);
    });
  };

  const handleOpenAnswersDialog = () => {
    if (boxes.length === 0) {
      toast.error("يرجى رسم الأسئلة على النموذج أولاً");
      return;
    }
    setAnswerDialogOpen(true);
  };

  const updateQuestionConfig = (
    id: string,
    updater: (prev: QuestionConfig) => QuestionConfig
  ) => {
    setQuestionConfigs((prev) => {
      const existing =
        prev[id] ||
        ({
          id,
          type: "mcq",
        } as QuestionConfig);
      return {
        ...prev,
        [id]: updater(existing),
      };
    });
  };

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 h-full overflow-hidden">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            إعداد نموذج اختبار
          </h1>
          <p className="text-muted-foreground mt-2">
            ارفع ورقة الاختبار وحدد مناطق الأسئلة على النموذج، ثم قم بتحديد
            الإجابات الصحيحة لكل سؤال.
          </p>
        </div>

        {/* Upload Section */}
        <div className="space-y-2">
          <Label>ورقة الأسئلة (PDF) *</Label>
          {!selectedFile ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="template-file-upload"
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
                  id="template-file-upload"
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

        {/* Drawing and Controls */}
        {selectedFile && (
          <div className="flex flex-col flex-1 min-h-0 w-full space-y-4">
            {/* Question type and controls row */}
            <div className="flex flex-wrap items-center gap-4 justify-between">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    نوع السؤال الحالي:
                  </span>
                  <div className="inline-flex flex-wrap gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        currentQuestionType === "mcq" ? "default" : "outline"
                      }
                      onClick={() => setCurrentQuestionType("mcq")}
                    >
                      سؤال موضوعي (أ،ب،ج،د)
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        currentQuestionType === "tf" ? "default" : "outline"
                      }
                      onClick={() => setCurrentQuestionType("tf")}
                    >
                      صح / خطأ
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant={
                        currentQuestionType === "essay" ? "default" : "outline"
                      }
                      onClick={() => setCurrentQuestionType("essay")}
                    >
                      إجابة مقالية
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <Button
                    type="button"
                    size="sm"
                    variant={isDrawingMode ? "default" : "outline"}
                    onClick={() => setIsDrawingMode((prev) => !prev)}
                  >
                    {isDrawingMode ? "إيقاف وضع الرسم" : "تشغيل وضع الرسم"}
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={handleClearBoxes}
                    disabled={boxes.length === 0}
                  >
                    مسح الكل
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleDeleteLastBox}
                    disabled={boxes.length === 0}
                  >
                    مسح
                  </Button>
                  <Button
                    type="button"
                    variant="default"
                    size="sm"
                    onClick={handleOpenAnswersDialog}
                    disabled={boxes.length === 0}
                  >
                    إدخال الإجابات
                  </Button>
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                عدد الأسئلة المرسومة:{" "}
                <span className="font-medium text-foreground">
                  {boxes.length}
                </span>
              </div>
            </div>

            {/* PDF + overlay: scroll is on this container so PDF and boxes move together */}
            <div className="flex flex-col flex-1 min-h-0 border rounded-lg p-4 bg-muted/30">
              <p className="text-xs text-muted-foreground mb-3 shrink-0">
                اسحب لرسم مربع حول كل سؤال في النموذج. كل مربع يمثل سؤالاً
                واحداً. يجب اختيار نوع السؤال الحالي قبل الرسم.
              </p>
              <div
                ref={containerRef}
                className="flex-1 min-h-0 border rounded bg-muted/20 p-2 overflow-y-auto overflow-x-hidden"
              >
                <div
                  ref={wrapperRef}
                  className="relative"
                  style={{
                    width: `${canvasWidth * scale}px`,
                    height: `${totalPdfHeight}px`,
                    minHeight: `${totalPdfHeight}px`,
                    margin: "0 auto",
                  }}
                >
                  {Array.from({ length: numPages }, (_, i) => (
                    <canvas
                      key={i}
                      ref={(el) => {
                        pageCanvasRefs.current[i] = el;
                      }}
                      className="block"
                      style={{
                        position: "absolute",
                        left: 0,
                        top: `${i * canvasHeight * scale}px`,
                        width: `${canvasWidth * scale}px`,
                        height: `${canvasHeight * scale}px`,
                      }}
                    />
                  ))}
                  <div
                    ref={canvasRef}
                    className={`absolute select-none top-0 left-0 ${
                      isDrawingMode ? "cursor-crosshair" : "cursor-default"
                    }`}
                    style={{
                      width: `${canvasWidth * scale}px`,
                      height: `${totalPdfHeight}px`,
                      pointerEvents: isDrawingMode ? "auto" : "none",
                    }}
                    onMouseDown={handleCanvasMouseDown}
                    onMouseMove={handleCanvasMouseMove}
                    onMouseUp={handleCanvasMouseUp}
                    onMouseLeave={handleCanvasMouseUp}
                  >
                    {boxes.map((box) => (
                      <div
                        key={box.id}
                        className="absolute border-2 border-primary bg-primary/10"
                        style={{
                          left: `${box.x * scale}px`,
                          top: `${
                            (box.page - 1) * canvasHeight * scale +
                            box.y * scale
                          }px`,
                          width: `${box.width * scale}px`,
                          height: `${box.height * scale}px`,
                        }}
                      >
                        <div className="absolute -top-4 right-0 text-[11px] bg-primary text-primary-foreground px-1 rounded">
                          س {box.index}
                        </div>
                      </div>
                    ))}
                    {previewBox && (
                      <div
                        className="absolute border-2 border-dashed border-primary/70 bg-primary/5"
                        style={{
                          left: `${previewBox.x * scale}px`,
                          top: `${
                            (previewBox.page - 1) * canvasHeight * scale +
                            previewBox.y * scale
                          }px`,
                          width: `${previewBox.width * scale}px`,
                          height: `${previewBox.height * scale}px`,
                        }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Answers Dialog */}
        <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>إدخال الإجابات</DialogTitle>
              <DialogDescription>
                حدد نوع السؤال والإجابة الصحيحة لكل مربع مرسوم على النموذج.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 max-h-[60vh] overflow-y-auto">
              {boxes.map((box) => {
                const config =
                  questionConfigs[box.id] ||
                  ({
                    id: box.id,
                    type: "mcq",
                  } as QuestionConfig);

                return (
                  <div
                    key={box.id}
                    className="border rounded-md p-3 flex flex-col gap-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium">سؤال {box.index}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          العرض: {Math.round(box.width)}px، الارتفاع:{" "}
                          {Math.round(box.height)}px
                        </span>
                      </div>
                    </div>

                    {/* Question type selector */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        size="sm"
                        variant={config.type === "mcq" ? "default" : "outline"}
                        onClick={() =>
                          updateQuestionConfig(box.id, (prev) => ({
                            ...prev,
                            type: "mcq",
                          }))
                        }
                      >
                        سؤال موضوعي (أ،ب،ج،د)
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={config.type === "tf" ? "default" : "outline"}
                        onClick={() =>
                          updateQuestionConfig(box.id, (prev) => ({
                            ...prev,
                            type: "tf",
                          }))
                        }
                      >
                        صح / خطأ
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={
                          config.type === "essay" ? "default" : "outline"
                        }
                        onClick={() =>
                          updateQuestionConfig(box.id, (prev) => ({
                            ...prev,
                            type: "essay",
                          }))
                        }
                      >
                        إجابة مقالية
                      </Button>
                    </div>

                    {/* Answer selector */}
                    {config.type === "mcq" && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(["أ", "ب", "ج", "د"] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={
                              config.mcqAnswer === option
                                ? "default"
                                : "outline"
                            }
                            onClick={() =>
                              updateQuestionConfig(box.id, (prev) => ({
                                ...prev,
                                type: "mcq",
                                mcqAnswer: option,
                              }))
                            }
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {config.type === "tf" && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {(["صح", "خطأ"] as const).map((option) => (
                          <Button
                            key={option}
                            type="button"
                            size="sm"
                            variant={
                              config.tfAnswer === option ? "default" : "outline"
                            }
                            onClick={() =>
                              updateQuestionConfig(box.id, (prev) => ({
                                ...prev,
                                type: "tf",
                                tfAnswer: option,
                              }))
                            }
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    )}

                    {config.type === "essay" && (
                      <p className="text-xs text-muted-foreground mt-1">
                        هذا السؤال سيتم تصحيحه يدوياً (إجابة مقالية).
                      </p>
                    )}
                  </div>
                );
              })}

              {boxes.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لم يتم رسم أي أسئلة بعد. أغلق هذه النافذة وارسم مربعات على
                  النموذج أولاً.
                </p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAnswerDialogOpen(false)}
              >
                إغلاق
              </Button>
              <Button
                type="button"
                onClick={() => {
                  // في المستقبل يمكن إرسال الإعدادات إلى الخادم هنا
                  toast.success("تم حفظ إعدادات الإجابات محلياً");
                  setAnswerDialogOpen(false);
                }}
              >
                حفظ النموذج
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
