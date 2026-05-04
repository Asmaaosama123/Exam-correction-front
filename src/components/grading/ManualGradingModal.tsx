import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  AlertCircle,
  Save,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Image as ImageIcon,
  FileText
} from "lucide-react";
import { toast } from "sonner";
import { useUpdateManualGrading } from "@/hooks/use-grading";
import type { GradingDetail } from "@/types/grading";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ManualGradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  paperId: number | string;
  studentName: string;
  details: GradingDetail[];
  annotatedImageUrl?: string;
  onSuccess?: () => void;
}

interface CorrectionState {
  isCorrect: boolean;
  selectedAnswer?: string;
}

export function ManualGradingModal({
  isOpen,
  onClose,
  paperId,
  studentName,
  details,
  annotatedImageUrl,
  onSuccess,
}: ManualGradingModalProps) {
  // Show all questions as requested by the user
  const allQuestions = details;
  const [corrections, setCorrections] = useState<Record<string, CorrectionState>>({});
  const [zoom, setZoom] = useState(1);
  const [activeTab, setActiveTab] = useState<"image" | "questions">("questions");
  const updateMutation = useUpdateManualGrading();

  const handleStatusToggle = (questionId: string, isCorrect: boolean) => {
    setCorrections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isCorrect,
      },
    }));
  };

  const handleOptionSelect = (questionId: string, answer: string, isCorrect: boolean) => {
    setCorrections((prev) => ({
      ...prev,
      [questionId]: {
        isCorrect,
        selectedAnswer: answer,
      },
    }));
  };

  const handleTextChange = (questionId: string, text: string, currentOk: boolean) => {
    setCorrections((prev) => ({
      ...prev,
      [questionId]: {
        ...prev[questionId],
        isCorrect: prev[questionId]?.isCorrect ?? currentOk,
        selectedAnswer: text,
      },
    }));
  };

  const handleSave = async () => {
    const correctionList = Object.entries(corrections).map(([questionId, state]) => ({
      questionId,
      isCorrect: state.isCorrect,
      selectedAnswer: state.selectedAnswer,
    }));

    if (correctionList.length === 0) {
      toast.error("يرجى مراجعة وتعديل سؤال واحد على الأقل");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: Number(paperId),
        corrections: correctionList,
      });
      toast.success("تم تحديث الدرجات بنجاح");
      if (onSuccess) onSuccess();
      onClose();
    } catch (error) {
      toast.error("فشل تحديث البيانات");
    }
  };

  // Helper function to get clean image URL
  const getFullImageUrl = (path: string) => {
    if (!path) return "";
    let cleanPath = path.trim();
    const baseUrl = "https://examcorrection.wsyelhi.com";

    // 🔍 Case 1: IP cleanup
    if (cleanPath.includes('76.13.51.15:8000')) {
      const parts = cleanPath.split(':8000/');
      cleanPath = parts.length > 1 ? parts[1] : cleanPath;
    } 
    // 🔍 Case 2: localhost cleanup
    else if (cleanPath.includes('localhost') || cleanPath.includes('127.0.0.1') || cleanPath.includes('0.0.0.0')) {
      cleanPath = cleanPath.replace(/^https?:\/\/[^/]+\//, '');
    }

    // 🔍 Case 3: repeated ai-results cleanup
    cleanPath = cleanPath.replace(/^ai-results\//, '');

    if (!cleanPath.startsWith('http')) {
      return `${baseUrl}/ai-results/${cleanPath.replace(/^\/+/, '')}`;
    }
    return cleanPath;
  };


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[calc(100%-0.6rem)] sm:w-full md:max-w-7xl h-[95vh] sm:h-[92vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="p-3 sm:p-5 bg-white border-b shrink-0 flex flex-row items-center justify-between gap-1 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-4 overflow-hidden">
            <div className="p-1.5 sm:p-2.5 bg-amber-50 rounded-lg sm:rounded-xl border border-amber-100 shrink-0">
              <AlertCircle className="w-5 h-5 sm:w-6 h-6 text-amber-500" />
            </div>
            <div className="overflow-hidden">
              <DialogTitle className="text-xs sm:text-xl font-bold text-slate-800 truncate">
                مراجعة إجابات الطالب
              </DialogTitle>
              <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-0.5 text-slate-500">
                <span className="text-[9px] sm:text-sm">الطالب:</span>
                <span className="font-bold text-slate-700 bg-slate-100 px-1 py-0.5 rounded text-[9px] sm:text-sm truncate max-w-[100px] sm:max-w-none">{studentName}</span>
                <Separator orientation="vertical" className="h-4 mx-1 hidden sm:block" />
                <Badge variant="outline" className="text-primary bg-blue-50 border-blue-200 text-[8px] sm:text-[10px] md:text-xs px-1 sm:px-2">
                  {allQuestions.length} سؤال
                </Badge>
              </div>
            </div>
          </div>

          <div className="hidden sm:flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.max(0.5, prev - 0.25))} className="h-8 w-8 hover:bg-white rounded-lg">
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-xs font-bold w-12 text-center text-slate-600">{Math.round(zoom * 100)}%</span>
            <Button variant="ghost" size="icon" onClick={() => setZoom(prev => Math.min(3, prev + 0.25))} className="h-8 w-8 hover:bg-white rounded-lg">
              <ZoomIn className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setZoom(1)} className="h-8 w-8 hover:bg-white rounded-lg">
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        {/* Mobile View Toggle */}
        <div className="flex md:hidden bg-white border-b p-2 sticky top-0 z-20">
          <div className="grid grid-cols-2 w-full gap-2 p-1 bg-slate-100 rounded-xl">
            <Button
              size="sm"
              variant={activeTab === "questions" ? "default" : "ghost"}
              className={`rounded-lg font-bold gap-2 ${activeTab === "questions" ? "shadow-md" : ""}`}
              onClick={() => setActiveTab("questions")}
            >
              <FileText className="w-4 h-4" />
              الأسئلة
            </Button>
            <Button
              size="sm"
              variant={activeTab === "image" ? "default" : "ghost"}
              className={`rounded-lg font-bold gap-2 ${activeTab === "image" ? "shadow-md" : ""}`}
              onClick={() => setActiveTab("image")}
            >
              <ImageIcon className="w-4 h-4" />
              الورقة
            </Button>
          </div>
        </div>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-200/30 min-h-0">
          {/* Right Section: Image Viewer */}
          <div className={`order-1 md:order-2 flex-1 md:basis-1/2 flex flex-col overflow-hidden border-b md:border-b-0 md:border-r bg-slate-900/5 relative group min-h-0 ${activeTab === "image" ? "flex" : "hidden md:flex"}`}>
            <div className="absolute top-4 left-4 z-10 hidden group-hover:flex items-center gap-2">
              <Badge className="bg-black/60 backdrop-blur-md text-white border-white/20 px-3 py-1.5 font-medium flex items-center gap-2">
                <ImageIcon className="w-3.5 h-3.5" />
                ورقة الإجابة المصححة
              </Badge>
            </div>

            <ScrollArea className="h-full w-full bg-slate-900/5 shadow-inner">
              <div className="flex flex-col items-center gap-8 p-6 min-h-full overflow-y-auto">
                {annotatedImageUrl ? (
                  annotatedImageUrl.split('|').map((url, idx) => {
                    const fullUrl = getFullImageUrl(url);

                    return (
                      <div key={idx} className="relative group shadow-2xl rounded-sm border border-slate-200 bg-white" style={{ width: `${100 * zoom}%`, transition: 'width 0.2s ease-out' }}>
                        <div className="absolute top-4 right-4 z-10 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-[10px] font-bold border border-white/20">
                          صفحة {idx + 1}
                        </div>
                        <img
                          src={fullUrl}
                          alt={`ورقة الطالب - صفحة ${idx + 1}`}
                          className="w-full h-auto object-top"
                          loading="lazy"
                          onError={(e) => {
                            const img = e.currentTarget;
                            img.src = 'https://placehold.co/600x800?text=Error+Loading+Page+' + (idx + 1);
                          }}
                        />
                      </div>
                    );
                  })
                ) : (
                  <div className="h-[600px] w-full flex flex-col items-center justify-center text-slate-400 bg-white rounded-xl border-2 border-dashed border-slate-200">
                    <ImageIcon className="w-16 h-16 mb-4 opacity-20" />
                    <p>عذراً، لم يتم العثور على صورة الورقة</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          {/* Left Section: Questions List */}
          <div className={`order-2 md:order-1 flex-1 md:basis-1/2 flex flex-col min-h-0 bg-white overflow-hidden shadow-inner ${activeTab === "questions" ? "flex" : "hidden md:flex"}`}>
            <div className="p-4 bg-slate-50 border-b flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <h3 className="font-bold text-slate-700">قائمة الأسئلة</h3>
              </div>
              <span className="text-xs text-slate-500">حدد الإجابة الصحيحة من الورقة</span>
            </div>

            <div className="flex-1 overflow-y-auto overscroll-contain p-2 sm:p-5" style={{ WebkitOverflowScrolling: 'touch' }}>
              <div className="space-y-3 sm:space-y-6 pb-20 px-1">
                {allQuestions.map((q) => {
                  const state = corrections[q.id];
                  const displayIsCorrect = state?.isCorrect ?? q.ok;
                  const displaySelected = state?.selectedAnswer !== undefined ? state.selectedAnswer : q.pred;

                  // Fixed isMcq calculation:
                  const isMcq = (q.type?.toLowerCase() === "mcq" || q.question_type?.toLowerCase() === "mcq") ||
                    (q.type?.toLowerCase() !== "true_false" && q.question_type?.toLowerCase() !== "true_false" && q.options && q.options.length > 0 && !q.options.includes("main"));

                  const isTrueFalse = q.type?.toLowerCase() === "true_false" || q.question_type?.toLowerCase() === "true_false" || q.type === "صح/خطأ";
                  const isSubjective = !isMcq && !isTrueFalse;

                  return (
                    <div
                      key={q.id}
                      className={`p-3 sm:p-5 rounded-xl sm:rounded-2xl border-2 transition-all duration-300 ${displayIsCorrect === true ? 'border-emerald-500/30 bg-emerald-50/20 shadow-sm shadow-emerald-100' :
                        displayIsCorrect === false ? 'border-rose-500/30 bg-rose-50/20 shadow-sm shadow-rose-100' :
                          'border-slate-100 bg-slate-50/30 hover:border-slate-200 shadow-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-2 sm:mb-4">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-5 h-5 sm:w-8 sm:h-8 text-[10px] sm:text-base rounded sm:rounded-lg bg-white border border-slate-200 flex items-center justify-center font-bold text-slate-700">
                            {q.id}
                          </div>
                          <span className="font-bold text-xs sm:text-base text-slate-800">سؤال {q.id}</span>
                        </div>
                        <Badge variant="secondary" className="bg-white text-slate-500 font-medium text-[8px] sm:text-xs px-1 sm:px-2.5 leading-none h-5 sm:h-auto">
                          {q.points} درجة
                        </Badge>
                      </div>

                      <div className="space-y-4">
                        {/* Comparison Bar */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 bg-white/60 p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-slate-100">
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mb-0.5 sm:mb-1">الاجابة النموذجية</span>
                            <span className="w-full text-center text-xs sm:text-base font-extrabold text-blue-600 bg-blue-50 py-1 sm:py-1.5 rounded-md sm:rounded-lg border border-blue-100">
                              {q.gt}
                            </span>
                          </div>
                          <Separator orientation="vertical" className="hidden sm:block h-10" />
                          <Separator orientation="horizontal" className="sm:hidden w-full" />
                          <div className="flex-1 flex flex-col items-center">
                            <span className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase mb-0.5 sm:mb-1">إجابة الطالب</span>
                            {isSubjective ? (
                              <Input
                                value={displaySelected === "None" ? "" : displaySelected}
                                onChange={(e) => handleTextChange(q.id, e.target.value, q.ok)}
                                className="h-8 sm:h-10 text-center font-bold text-xs sm:text-base bg-white border-2 border-primary/20 focus:border-primary shadow-sm"
                                placeholder="اكتب الإجابة..."
                              />
                            ) : (
                              <span className={`w-full text-center text-xs sm:text-base font-extrabold py-1 sm:py-1.5 rounded-md sm:rounded-lg border ${displaySelected && displaySelected !== "None"
                                ? 'text-slate-800 bg-slate-100 border-slate-200'
                                : 'text-slate-300 bg-slate-50 border-slate-100 border-dashed italic'
                                }`}>
                                {displaySelected && displaySelected !== "None"
                                  ? (displaySelected === "Multiple" || displaySelected === "None" ? "أكثر من إجابة" : displaySelected)
                                  : "متروك"}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Interaction Area */}
                        {isMcq ? (
                          <div className="space-y-4">
                            <div className="space-y-2 sm:space-y-3">
                              <span className="text-[10px] sm:text-xs font-bold text-slate-500 block">إجابة الطالب:</span>
                              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                                {q.options?.map((opt) => (
                                  <Button
                                    key={opt}
                                    variant="outline"
                                    size="sm"
                                    className={`min-w-[36px] sm:min-w-[48px] h-8 sm:h-10 rounded-lg sm:rounded-xl font-bold text-sm sm:text-lg transition-all px-2 sm:px-4 ${displaySelected === opt
                                      ? 'bg-primary text-white border-primary shadow-md scale-105'
                                      : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                                      }`}
                                    onClick={() => handleOptionSelect(q.id, opt, opt === q.gt)}
                                  >
                                    {opt}
                                  </Button>
                                ))}

                                <Button
                                  variant="outline"
                                  size="sm"
                                  className={`px-2 sm:px-4 h-8 sm:h-10 text-[10px] sm:text-sm rounded-lg sm:rounded-xl font-bold transition-all ${displaySelected === "Multiple"
                                    ? 'bg-rose-600 text-white border-rose-700 shadow-md scale-105'
                                    : 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-sm'
                                    }`}
                                  onClick={() => handleOptionSelect(q.id, "Multiple", false)}
                                >
                                  <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                                  أكثر من إجابة
                                </Button>
                              </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2 sm:gap-3">
                              <Button
                                variant="outline"
                                className={`h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold gap-1 sm:gap-2 transition-all ${displayIsCorrect === true
                                  ? 'bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-200 scale-[1.02]'
                                  : 'border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50'
                                  }`}
                                onClick={() => handleStatusToggle(q.id, true)}
                              >
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                                صحيحة
                              </Button>
                              <Button
                                variant="outline"
                                className={`h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold gap-1 sm:gap-2 transition-all ${displayIsCorrect === false
                                  ? 'bg-rose-600 text-white border-transparent shadow-lg shadow-rose-200 scale-[1.02]'
                                  : 'border-rose-200 text-rose-700 bg-white hover:bg-rose-50'
                                  }`}
                                onClick={() => handleStatusToggle(q.id, false)}
                              >
                                <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                                خاطئة
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2 sm:gap-3">
                            {isSubjective && (
                              <div className="col-span-2 space-y-2 mb-2">
                                <span className="text-[10px] sm:text-xs font-bold text-slate-500 block">إجابة الطالب (تعديل):</span>
                                <Input
                                  value={displaySelected === "None" ? "" : displaySelected}
                                  onChange={(e) => handleTextChange(q.id, e.target.value, q.ok)}
                                  className="h-10 text-right font-bold text-base bg-white border-2 border-primary/20 focus:border-primary shadow-sm"
                                  placeholder="اكتب الإجابة المعدلة هنا..."
                                />
                              </div>
                            )}
                            <Button
                              variant="outline"
                              className={`h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold gap-1 sm:gap-2 transition-all ${displayIsCorrect === true
                                ? 'bg-emerald-600 text-white border-transparent shadow-lg shadow-emerald-200 scale-[1.02]'
                                : 'border-emerald-200 text-emerald-700 bg-white hover:bg-emerald-50'
                                }`}
                              onClick={() => handleStatusToggle(q.id, true)}
                            >
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5" />
                              صحيحة
                            </Button>
                            <Button
                              variant="outline"
                              className={`h-9 sm:h-11 rounded-lg sm:rounded-xl text-[10px] sm:text-sm font-bold gap-1 sm:gap-2 transition-all ${displayIsCorrect === false
                                ? 'bg-rose-600 text-white border-transparent shadow-lg shadow-rose-200 scale-[1.02]'
                                : 'border-rose-200 text-rose-700 bg-white hover:bg-rose-50'
                                }`}
                              onClick={() => handleStatusToggle(q.id, false)}
                            >
                              <XCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                              خاطئة
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="p-4 sm:p-5 bg-white border-t shrink-0 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            className="px-6 font-semibold rounded-xl text-slate-500 hover:bg-slate-100 h-10 sm:h-12 order-2 sm:order-1"
          >
            إلغاء
          </Button>
          <Button
            onClick={handleSave}
            disabled={Object.keys(corrections).length === 0 || updateMutation.isPending}
            className="px-10 h-12 rounded-xl font-bold text-base bg-gradient-to-r from-primary to-primary/80 shadow-lg shadow-primary/20 hover:scale-[1.02] transition-transform order-1 sm:order-2"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 ml-2 animate-spin" />
            ) : (
              <Save className="w-5 h-5 ml-2" />
            )}
            حفظ واعتماد التصحيح
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
