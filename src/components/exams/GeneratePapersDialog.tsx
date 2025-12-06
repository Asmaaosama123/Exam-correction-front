import { useState, useRef } from "react";
import { Download, Loader2, Move } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useGenerateAndDownloadExamPapers } from "@/hooks/use-exams";
import { useGetClasses } from "@/hooks/use-classes";
import { useGetExams } from "@/hooks/use-exams";
import type { Exam, GenerateStudentPapersRequest } from "@/types/exams";
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

type PageSizeKey = keyof typeof PAGE_SIZES;

interface GeneratePapersDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function GeneratePapersDialog({
  open,
  onOpenChange,
  onSuccess,
}: GeneratePapersDialogProps) {
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [selectedClassId, setSelectedClassId] = useState<string>("");
  const [selectedPageSize, setSelectedPageSize] = useState<PageSizeKey>("a4");
  const [barcodeArea, setBarcodeArea] = useState<BarcodeArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(
    null
  );
  const canvasRef = useRef<HTMLDivElement>(null);

  // Get canvas dimensions based on selected page size
  const currentPageSize = PAGE_SIZES[selectedPageSize];
  const canvasWidth = currentPageSize.width;
  const canvasHeight = currentPageSize.height;

  const generateMutation = useGenerateAndDownloadExamPapers();
  const { data: exams, isLoading: examsLoading } = useGetExams();
  const { data: classes, isLoading: classesLoading } = useGetClasses();

  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
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

  const handleGenerate = () => {
    if (!selectedExam || !selectedClassId) {
      toast.error("يرجى اختيار الامتحان والفصل");
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

    const request: GenerateStudentPapersRequest = {
      examId: String(selectedExam.id),
      classId: selectedClassId,
      x: xPoints, // X coordinate in PDF points
      y: yPoints, // Y coordinate in PDF points (from bottom)
      examName: selectedExam.title,
    };

    generateMutation.mutate(request, {
      onSuccess: () => {
        setSelectedExam(null);
        setSelectedClassId("");
        setBarcodeArea(null);
        onSuccess?.();
        onOpenChange(false);
      },
    });
  };

  const handlePageSizeChange = (newSize: PageSizeKey) => {
    setSelectedPageSize(newSize);
    // Clear barcode area when page size changes
    setBarcodeArea(null);
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      // Reset form when closing
      setSelectedExam(null);
      setSelectedClassId("");
      setSelectedPageSize("a4");
      setBarcodeArea(null);
      setIsDragging(false);
      setDragStart(null);
    }
    onOpenChange(newOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء أوراق الطلاب</DialogTitle>
          <DialogDescription>
            اختر الامتحان والفصل وحدد موقع الباركود على الورقة
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label htmlFor="exam-select">اختر الامتحان *</Label>
            {examsLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedExam?.id.toString()}
                onValueChange={(value) =>
                  setSelectedExam(
                    exams?.find((exam) => exam.id.toString() === value) || null
                  )
                }
              >
                <SelectTrigger id="exam-select">
                  <SelectValue placeholder="اختر الامتحان" />
                </SelectTrigger>
                <SelectContent>
                  {exams && exams.length > 0 ? (
                    exams.map((exam) => (
                      <SelectItem key={exam.id} value={String(exam.id)}>
                        {exam.title} - {exam.subject}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-exams" disabled>
                      لا توجد امتحانات متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class-select">اختر الفصل *</Label>
            {classesLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
              >
                <SelectTrigger id="class-select">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {classes && classes.length > 0 ? (
                    classes.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.numberOfStudents} طالب)
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-classes" disabled>
                      لا توجد فصول متاحة
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Page Size Selection */}
          {selectedExam && selectedClassId && (
            <div className="space-y-2">
              <Label htmlFor="page-size-select">حجم الورقة</Label>
              <Select
                value={selectedPageSize}
                onValueChange={(value) =>
                  handlePageSizeChange(value as PageSizeKey)
                }
              >
                <SelectTrigger id="page-size-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PAGE_SIZES).map(([key, size]) => (
                    <SelectItem key={key} value={key}>
                      {size.name} ({size.description})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Barcode Area Selection */}
          {selectedExam && selectedClassId && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
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
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-xs text-muted-foreground mb-3">
                  انقر أو اسحب على الورقة لتحديد موقع الباركود (الحجم:{" "}
                  {BARCODE_WIDTH}×{BARCODE_HEIGHT} بكسل) -{" "}
                  {currentPageSize.name}
                </p>
                <div className="overflow-auto max-h-[60vh] border rounded bg-muted/20 p-2">
                  <div
                    ref={canvasRef}
                    className="relative bg-white border-2 border-dashed border-muted-foreground/30 mx-auto cursor-crosshair select-none"
                    style={{
                      width: `${canvasWidth}px`,
                      height: `${canvasHeight}px`,
                      minWidth: "400px",
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Barcode Area Overlay */}
                    {barcodeArea && (
                      <div
                        className="absolute border-2 border-primary bg-primary/10 flex items-center justify-center transition-all"
                        style={{
                          left: `${barcodeArea.x}px`,
                          top: `${
                            canvasHeight - barcodeArea.y - BARCODE_HEIGHT
                          }px`,
                          width: `${BARCODE_WIDTH}px`,
                          height: `${BARCODE_HEIGHT}px`,
                          cursor: isDragging ? "grabbing" : "grab",
                        }}
                        title="اسحب لتحريك الباركود"
                      >
                        <Move className="h-6 w-6 text-primary opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
                {barcodeArea && (
                  <div className="mt-3 text-xs text-muted-foreground text-center">
                    <p>
                      الموقع: X = {Math.round(barcodeArea.x * (72 / 96))}pt, Y ={" "}
                      {Math.round(barcodeArea.y * (72 / 96))}pt (من الأسفل)
                    </p>
                    <p className="text-[10px] opacity-75 mt-1">
                      ({Math.round(barcodeArea.x)}px ×{" "}
                      {Math.round(barcodeArea.y)}px)
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {selectedExam && selectedClassId && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                سيتم إنشاء أوراق PDF جاهزة للطباعة لكل طالب في الفصل المحدد
                وتحميلها كملف ZIP.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={generateMutation.isPending}
          >
            إلغاء
          </Button>
          <Button
            onClick={handleGenerate}
            disabled={
              generateMutation.isPending ||
              !selectedExam ||
              !selectedClassId ||
              !barcodeArea ||
              examsLoading ||
              classesLoading
            }
          >
            {generateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري الإنشاء والتحميل...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 ml-2" />
                إنشاء وتحميل أوراق PDF
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
