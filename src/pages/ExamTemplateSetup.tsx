// components/ExamTemplateSetup.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, X, Trash2, Check, XCircle, AlertCircle, RotateCw, Settings, PlusCircle, Info, PlusCircle as PlusCircleIcon, BarChart3 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { HelpFab } from "@/components/ui/help-fab";
import { Label } from "@/components/ui/label";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import StitchedPdfViewer from '@/components/ui/StitchedPdfViewerProps';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useUploadTeacherExam } from "@/hooks/use-exam-template";
import type { Question, OptionBox, QuestionType, AnswerDirection, Language } from "@/types/exam-template";

const PAGE_SIZES = { a4: { width: 794, height: 1123 } } as const;



const DEFAULT_SETTINGS = {
  mcq: {
    optionCount: 4,
    direction: "horizontal" as AnswerDirection
  },
  true_false: {
    optionCount: 1,
    direction: "horizontal" as AnswerDirection
  },
  essay: {
    optionCount: 1,
    direction: "horizontal" as AnswerDirection
  }
};

// دالة لتوليد التسميات حسب اللغة
const getLabels = (language: Language, count: number): string[] => {
  const arabicLabels = ['أ', 'ب', 'ج', 'د', 'ه', 'و', 'ز', 'ح', 'ط', 'ي'];
  const englishLabels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];
  const source = language === 'ar' ? arabicLabels : englishLabels;
  return source.slice(0, count);
};

export default function ExamTemplateSetup() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [stitchedImageUrl, setStitchedImageUrl] = useState<string | null>(null);
  const [, setUpdateKey] = useState(Date.now().toString());
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const uploadTeacherExamMutation = useUploadTeacherExam();

  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number; page: number } | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [previewOption, setPreviewOption] = useState<OptionBox | null>(null);
  const [currentOptionLabel, setCurrentOptionLabel] = useState<string>("A");

  // إعدادات الأسئلة المحفوظة
  const [questionSettings, setQuestionSettings] = useState<Record<QuestionType, {
    optionCount: number;
    direction: AnswerDirection;
  }>>(DEFAULT_SETTINGS);

  // نوع السؤال المختار – يبقى محفوظاً
  const [selectedQuestionType, setSelectedQuestionType] = useState<QuestionType | null>(null);
  const [isCreatingQuestion, setIsCreatingQuestion] = useState(false);

  const [answerDialogOpen, setAnswerDialogOpen] = useState(false);
  const [examId, setExamId] = useState<string>("");
  const isLoading = uploadTeacherExamMutation.isPending;
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfKey, setPdfKey] = useState(0);

  // حالة اللغة المختارة (عربي / إنجليزي)
  const [examLanguage, setExamLanguage] = useState<Language>("en");

  // دليل المستخدم


  const canvasWidth = pdfDimensions?.width || PAGE_SIZES.a4.width;
  const canvasHeight = pdfDimensions?.height || PAGE_SIZES.a4.height;
  const totalPdfHeight = numPages * canvasHeight * scale + (numPages - 1) * 16;

  // ========== إدارة الملفات ==========
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));

    if (!allowedExtensions.includes(ext)) {
      toast.error("الملف يجب أن يكون PDF أو صورة (JPG, JPEG, PNG)");
      return;
    }

    if (stitchedImageUrl) {
      URL.revokeObjectURL(stitchedImageUrl);
      setStitchedImageUrl(null);
    }

    setSelectedFile(file);
    setUpdateKey(Date.now().toString());
    setPdfKey(prev => prev + 1);
    setQuestions([]);
    setCurrentQuestion(null);
    setSelectedQuestionType(null);
    setIsCreatingQuestion(false);
    setScale(1);
    setPdfDimensions(null);
    setPdfConverting(false);
    setPdfError(null);

    if (['.jpg', '.jpeg', '.png'].includes(ext)) {
      const url = URL.createObjectURL(file);
      setStitchedImageUrl(url);
      const img = new Image();
      img.onload = () => {
        setPdfDimensions({ width: img.width, height: img.height });
        setNumPages(1);
      };
      img.src = url;
    } else {
      setPdfConverting(true);
    }
  }, [stitchedImageUrl]);

  const handleRemoveFile = useCallback(() => {
    if (stitchedImageUrl) {
      URL.revokeObjectURL(stitchedImageUrl);
      setStitchedImageUrl(null);
    }
    setSelectedFile(null);
    setPdfDimensions(null);
    setNumPages(1);
    setQuestions([]);
    setCurrentQuestion(null);
    setSelectedQuestionType(null);
    setIsCreatingQuestion(false);
    setScale(1);
    setUpdateKey(Date.now().toString());
    setPdfConverting(false);
    setPdfError(null);
  }, [stitchedImageUrl]);

  // ========== تحجيم الـ Canvas ==========
  useEffect(() => {
    if (!containerRef.current || !pdfDimensions) return;
    const updateScale = () => {
      if (!containerRef.current || !pdfDimensions) return;
      const containerWidth = containerRef.current.clientWidth - 40;
      const widthScale = containerWidth / canvasWidth;
      const newScale = Math.min(Math.max(widthScale, 0.6), 1.5);
      setScale(newScale);
    };
    updateScale();
    const handleResize = () => requestAnimationFrame(updateScale);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [pdfDimensions, canvasWidth]);

  // ========== تحويل الإحداثيات ==========
  const getCanvasCoordinates = (clientX: number, clientY: number) => {
    if (!canvasRef.current || !containerRef.current || !pdfDimensions || !numPages)
      return { x: 0, y: 0, page: 1 };

    const rect = canvasRef.current.getBoundingClientRect();
    const scrollTop = containerRef.current.scrollTop;
    const docY = scrollTop + (clientY - rect.top);

    let accumulatedHeight = 0;
    let page = 1;
    for (let i = 1; i <= numPages; i++) {
      const pageHeight = canvasHeight * scale;
      const pageSpacing = i > 1 ? 16 : 0;
      if (docY < accumulatedHeight + pageHeight) {
        page = i;
        break;
      }
      accumulatedHeight += pageHeight + pageSpacing;
    }
    const y = (docY - accumulatedHeight) / scale;
    const x = (clientX - rect.left) / scale;
    return { x: Math.max(0, x), y: Math.max(0, y), page };
  };

  // ========== ترتيب الخيارات حسب الاتجاه ==========
  const sortOptionsByDirection = useCallback(
    (options: OptionBox[], direction: AnswerDirection = "horizontal"): OptionBox[] => {
      const optionsCopy = [...options];
      if (direction === "horizontal") {
        return optionsCopy.sort((a, b) => {
          if (Math.abs(a.y - b.y) < 20) return b.x - a.x;
          return a.y - b.y;
        });
      } else {
        return optionsCopy.sort((a, b) => {
          if (Math.abs(a.x - b.x) < 20) return a.y - b.y;
          return a.x - b.x;
        });
      }
    },
    []
  );

  // ========== بدء سؤال جديد (يُستخدم عند الضغط على أزرار الأنواع) ==========
  const startNewQuestion = (type: QuestionType) => {
    // إذا كان هناك سؤال قيد الرسم، يتم إلغاؤه تلقائياً
    if (currentQuestion) {
      toast.warning("تم إلغاء السؤال الحالي والبدء بسؤال جديد");
      setCurrentQuestion(null);
    }

    const settings = questionSettings[type];
    setSelectedQuestionType(type);
    setIsCreatingQuestion(true);

    // تعيين التسمية الأولى حسب اللغة
    const firstLabel = examLanguage === 'ar' ? 'أ' : 'A';
    setCurrentOptionLabel(firstLabel);

    const messages = {
      mcq: `ارسم ${settings.optionCount} مربعات للاختيارات (${settings.direction === "horizontal" ? "أفقي" : "رأسي"})`,
      true_false: "ارسم مربعاً واحداً لمنطقة الإجابة صح/خطأ",
      essay: "ارسم مربعاً واحداً لمنطقة الإجابة المقالية"
    };
    toast.info(messages[type]);
  };

  // ========== إنهاء السؤال الحالي وإضافته للقائمة ==========
  const finishCurrentQuestion = (questionToFinish?: Question) => {
    const question = questionToFinish || currentQuestion;
    if (!question || question.options.length === 0) return;

    if (question.type === "mcq") {
      const requiredCount = question.mcqOptionCount || 4;
      if (question.options.length !== requiredCount) {
        toast.error(`يجب رسم ${requiredCount} مربعات لسؤال MCQ`);
        return;
      }
      // ترتيب الخيارات وتسميتها حسب اللغة المختارة
      if (question.answerDirection) {
        const sortedOptions = sortOptionsByDirection(question.options, question.answerDirection);
        const labels = getLabels(examLanguage, requiredCount);
        sortedOptions.forEach((opt, idx) => {
          if (idx < requiredCount) opt.label = labels[idx];
        });
        question.options = sortedOptions;
      }
    }

    // إضافة السؤال للقائمة
    setQuestions(prev => {
      const exists = prev.some(q => q.id === question.id);
      if (exists) return prev.map(q => q.id === question.id ? question : q);
      else return [...prev, question];
    });

    // إعادة تعيين حالة السؤال الحالي ولكن **نبقى في وضع الرسم** لنفس النوع
    setCurrentQuestion(null);
    // تعيين التسمية التالية حسب اللغة
    const nextLabel = examLanguage === 'ar' ? 'أ' : 'A';
    setCurrentOptionLabel(nextLabel);
    setIsCreatingQuestion(true);   // نبقى في وضع الرسم
    // لا نغير selectedQuestionType

    toast.success(`تم إضافة السؤال. ارسم السؤال التالي`);
  };

  // ========== أحداث الفأرة على الـ Canvas ==========
  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!selectedFile || !selectedQuestionType || !isCreatingQuestion) return;
    const { x, y, page } = getCanvasCoordinates(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart({ x, y, page });

    const optionId = `opt-${Date.now()}`;
    let label = currentOptionLabel;
    if (selectedQuestionType === "true_false") label = "TF";

    setPreviewOption({
      id: optionId,
      label,
      x, y,
      width: 0,
      height: 0,
      page,
      originalIndex: currentQuestion ? currentQuestion.options.length : 0
    });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !previewOption) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const newX = Math.min(drawStart.x, x);
    const newY = Math.min(drawStart.y, y);
    const newWidth = Math.abs(x - drawStart.x);
    const newHeight = Math.abs(y - drawStart.y);
    setPreviewOption({ ...previewOption, x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleCanvasMouseUp = () => {
    if (!isDrawing || !drawStart || !previewOption || !selectedQuestionType) return;

    if (previewOption.width > 10 && previewOption.height > 10) {
      if (currentQuestion) {
        // تحديث السؤال الحالي
        let updatedQuestion = {
          ...currentQuestion,
          options: [...currentQuestion.options, previewOption]
        };

        if (selectedQuestionType === "mcq") {
          const sortedOptions = sortOptionsByDirection(updatedQuestion.options, questionSettings.mcq.direction);
          const requiredCount = updatedQuestion.mcqOptionCount || questionSettings.mcq.optionCount;
          const labels = getLabels(examLanguage, requiredCount);
          const maxLabels = Math.min(sortedOptions.length, requiredCount);
          for (let i = 0; i < maxLabels; i++) {
            sortedOptions[i].label = labels[i];
            sortedOptions[i].originalIndex = i;
          }
          updatedQuestion.options = sortedOptions;
          const nextLabelIndex = updatedQuestion.options.length;
          if (nextLabelIndex < requiredCount) {
            setCurrentOptionLabel(labels[nextLabelIndex]);
          }
        }

        setCurrentQuestion(updatedQuestion);

        const requiredCount = updatedQuestion.type === "mcq"
          ? (updatedQuestion.mcqOptionCount || questionSettings.mcq.optionCount)
          : questionSettings[updatedQuestion.type].optionCount;

        if (updatedQuestion.options.length >= requiredCount) {
          finishCurrentQuestion(updatedQuestion);
        }
      } else {
        // إنشاء سؤال جديد
        const questionId = `q-${Date.now()}`;
        const settings = questionSettings[selectedQuestionType];
        const newQuestion: Question = {
          id: questionId,
          index: questions.length + 1,
          type: selectedQuestionType,
          answer: "",
          options: [previewOption],
          page: previewOption.page,
          answerDirection: settings.direction,
          mcqOptionCount: selectedQuestionType === "mcq" ? settings.optionCount : undefined
        };
        setCurrentQuestion(newQuestion);

        if (selectedQuestionType === "mcq") {
          const labels = getLabels(examLanguage, settings.optionCount);
          setCurrentOptionLabel(labels[1] || (examLanguage === 'ar' ? 'ب' : 'B'));
        }

        const requiredCount = selectedQuestionType === "mcq"
          ? (newQuestion.mcqOptionCount || settings.optionCount)
          : settings.optionCount;

        if (requiredCount === 1) {
          setTimeout(() => finishCurrentQuestion(newQuestion), 100);
        }
      }
    }

    setIsDrawing(false);
    setDrawStart(null);
    setPreviewOption(null);
  };

  // ========== تحديث إعدادات نوع السؤال ==========
  const updateQuestionSettings = (type: QuestionType, setting: "optionCount" | "direction", value: any) => {
    setQuestionSettings(prev => ({
      ...prev,
      [type]: { ...prev[type], [setting]: value }
    }));
    toast.success(`تم حفظ الإعدادات لسؤال ${type === 'mcq' ? 'MCQ' : type === 'true_false' ? 'صح/خطأ' : 'مقالي'}`);
  };

  // ========== حذف الأسئلة ==========
  const handleClearQuestions = () => {
    setQuestions([]);
    setCurrentQuestion(null);
    setIsCreatingQuestion(false);
    setSelectedQuestionType(null);
    toast.success("تم مسح جميع الأسئلة");
  };

  const handleDeleteQuestion = (id: string) => {
    setQuestions(prev => {
      const filtered = prev.filter(q => q.id !== id);
      return filtered.map((q, idx) => ({ ...q, index: idx + 1 }));
    });
    toast.success("تم حذف السؤال");
  };

  // ========== تغيير نوع السؤال من داخل نافذة الإجابات ==========
  const updateQuestionType = (id: string, newType: QuestionType) => {
    const questionToUpdate = questions.find(q => q.id === id);
    if (!questionToUpdate) return;

    const settings = questionSettings[newType];
    let newOptions = [...questionToUpdate.options];

    if (newType !== "mcq" && newOptions.length > 1) {
      newOptions = [newOptions[0]];
    }

    const updatedQuestion: Question = {
      ...questionToUpdate,
      type: newType,
      options: newOptions,
      answer: "",
      answerDirection: settings.direction,
      mcqOptionCount: newType === "mcq" ? settings.optionCount : undefined
    };

    if (newType === "mcq") {
      const sortedOptions = sortOptionsByDirection(updatedQuestion.options, settings.direction);
      const labels = getLabels(examLanguage, settings.optionCount);
      sortedOptions.forEach((opt, idx) => {
        if (idx < settings.optionCount) opt.label = labels[idx];
      });
      updatedQuestion.options = sortedOptions;
    }

    setQuestions(prev => prev.map(q => q.id === id ? updatedQuestion : q));

    // إغلاق النافذة وتفعيل الرسم
    setAnswerDialogOpen(false);
    setCurrentQuestion(updatedQuestion);
    setSelectedQuestionType(newType);
    setIsCreatingQuestion(true);

    if (newType === "mcq") {
      const nextIndex = updatedQuestion.options.length;
      if (nextIndex < settings.optionCount) {
        const labels = getLabels(examLanguage, settings.optionCount);
        setCurrentOptionLabel(labels[nextIndex]);
      }
    }

    toast.info(`تم تغيير نوع السؤال إلى ${newType === 'mcq' ? 'MCQ' : newType === 'true_false' ? 'صح/خطأ' : 'مقالي'}. ارسم المربعات المطلوبة.`);
  };

  // ========== تحديث الإجابة الصحيحة ==========
  const updateQuestionAnswer = (id: string, answer: string) => {
    let englishAnswer = answer;
    if (answer === "صح") englishAnswer = "TRUE";
    if (answer === "خطأ") englishAnswer = "FALSE";
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, answer: englishAnswer } : q));
  };

  // ========== حساب الـ ROI الكلي للسؤال ==========
  const calculateOverallROI = (question: Question): [number, number, number, number] => {
    if (question.options.length === 0) return [0, 0, 0, 0];
    let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
    question.options.forEach(option => {
      minX = Math.min(minX, option.x);
      minY = Math.min(minY, option.y);
      maxX = Math.max(maxX, option.x + option.width);
      maxY = Math.max(maxY, option.y + option.height);
    });
    return [Math.round(minX), Math.round(minY), Math.round(maxX - minX), Math.round(maxY - minY)];
  };

  // ========== تحضير JSON للأسئلة ==========
  const prepareQuestionsJson = () => {
    if (!pdfDimensions) return "";
    const canvasWidth = Math.round(pdfDimensions.width);
    const canvasHeight = Math.round(pdfDimensions.height);

    const questionsData = questions.map(question => {
      const rois: Record<string, [number, number, number, number]> = {};

      if (question.type === "mcq") {
        question.options.forEach(option => {
          rois[option.label] = [
            Math.round(option.x),
            Math.round(option.y),
            Math.round(option.width),
            Math.round(option.height)
          ];
        });
      } else if (question.type === "true_false" && question.options.length >= 1) {
        rois["TF"] = [
          Math.round(question.options[0].x),
          Math.round(question.options[0].y),
          Math.round(question.options[0].width),
          Math.round(question.options[0].height)
        ];
      }

      const roi = calculateOverallROI(question);
      const questionObj: any = {
        id: question.index.toString(),
        type: question.type,
        answer: question.answer,
        roi: roi
      };
      if (question.type !== "essay") {
        questionObj.rois = rois;
      }
      return questionObj;
    });

    return JSON.stringify({
      canvas: { width: canvasWidth, height: canvasHeight },
      questions: questionsData
    });
  };

  // ========== حفظ نموذج المعلم ==========
  const handleSaveTemplate = async () => {
    if (!examId.trim()) {
      toast.error("الرجاء إدخال رقم الامتحان");
      return;
    }
    const examIdNum = parseInt(examId);
    if (isNaN(examIdNum)) {
      toast.error("رقم الامتحان يجب أن يتكون من أرقام فقط");
      return;
    }
    if (!selectedFile) {
      toast.error("الرجاء رفع ملف الامتحان أولاً");
      return;
    }
    if (!questions.length) {
      toast.error("الرجاء رسم الأسئلة على النموذج أولاً");
      return;
    }

    const questionsWithoutAnswers = questions.filter(q => !q.answer && q.type !== "essay");
    if (questionsWithoutAnswers.length > 0) {
      toast.error(`يوجد ${questionsWithoutAnswers.length} أسئلة بدون إجابة صحيحة، يرجى تحديد الإجابات`);
      setAnswerDialogOpen(true);
      return;
    }

    // setIsLoading(true); // We can use mutation.isPending if we want to bind it to UI
    try {
      const questionsJson = prepareQuestionsJson();

      await uploadTeacherExamMutation.mutateAsync({
        ExamId: examIdNum,
        File: selectedFile,
        QuestionsJson: questionsJson
      });

      // On success (mutationAsync will throw on error)
      handleRemoveFile();
      setExamId("");
      setAnswerDialogOpen(false);

    } catch (error) {
      console.error("خطأ في عملية الرفع:", error);
      // Error handled in hook onError with toast
    }
  };

  // ========== إعادة تحويل PDF ==========
  const handleReRender = () => {
    if (!selectedFile || !selectedFile.name.toLowerCase().endsWith('.pdf')) return;
    if (stitchedImageUrl) {
      URL.revokeObjectURL(stitchedImageUrl);
      setStitchedImageUrl(null);
    }
    setPdfKey(prev => prev + 1);
    setPdfConverting(true);
    setPdfError(null);
    toast.info("جاري إعادة تحويل PDF...");
  };

  // ========== حساب إزاحة الصفحة ==========
  const getPageOffset = (pageNum: number) => {
    if (pageNum <= 1) return 0;
    return (pageNum - 1) * (canvasHeight * scale + 16);
  };

  // ========== أحداث StitchedPdfViewer ==========
  const handleStitchedPdfLoaded = (data: { width: number; height: number; pageCount: number; imageUrl: string }) => {
    setPdfConverting(false);
    setPdfError(null);
    setPdfDimensions({ width: data.width, height: data.height });
    setNumPages(data.pageCount);
    setStitchedImageUrl(data.imageUrl);
  };

  const handleStitchedPdfError = (error: string) => {
    setPdfConverting(false);
    setPdfError(error);
    toast.error(`خطأ في تحويل PDF: ${error}`);
  };

  // ========== JSX مع تحسينات التصميم ==========
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6 h-full overflow-hidden">
        {/* العنوان (بدون أيقونة المساعدة هنا) */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            إعداد نموذج اختبار المعلم
          </h1>
          <p className="text-muted-foreground mt-2">
            ارفع ورقة الاختبار وحدد مناطق الأسئلة على النموذج، ثم قم بتحديد الإجابات الصحيحة لكل سؤال.
          </p>
        </div>

        {/* بطاقة معلومات الامتحان */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="examId">رقم الاختبار *</Label>
                <Input
                  id="examId"
                  value={examId}
                  onChange={(e) => setExamId(e.target.value)}
                  placeholder="أدخل رقم الاختبار"
                  type="number"
                />
              </div>
              <div className="space-y-2">
                <Label>لغة الاختبار</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={examLanguage === 'ar' ? 'default' : 'outline'}
                    onClick={() => setExamLanguage('ar')}
                    className="flex-1"
                  >
                    عربي
                  </Button>
                  <Button
                    type="button"
                    variant={examLanguage === 'en' ? 'default' : 'outline'}
                    onClick={() => setExamLanguage('en')}
                    className="flex-1"
                  >
                    English
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* رفع الملف */}
        <div className="space-y-2">
          <Label>ملف نموذج الإجابة *</Label>
          {!selectedFile ? (
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="template-file-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground/25 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">انقر للرفع</span> أو اسحب الملف هنا
                  </p>
                  <p className="text-xs text-muted-foreground">PDF, JPG, JPEG, PNG</p>
                </div>
                <input
                  id="template-file-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileSelect}
                />
              </label>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-card">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm font-medium truncate max-w-[200px] md:max-w-xs">
                    {selectedFile.name}
                  </span>
                  {selectedFile.name.toLowerCase().endsWith('.pdf') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleReRender}
                      disabled={pdfConverting}
                    >
                      <RotateCw className="w-4 h-4 mr-1" />
                      {pdfConverting ? "جاري التحويل..." : "إعادة تحويل PDF"}
                    </Button>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={handleRemoveFile}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* محول PDF المخفي */}
        {selectedFile && selectedFile.name.toLowerCase().endsWith('.pdf') && (
          <StitchedPdfViewer
            key={`pdf-converter-${pdfKey}`}
            file={selectedFile}
            onLoaded={handleStitchedPdfLoaded}
            onError={handleStitchedPdfError}
            hidden
          />
        )}

        {/* حالة تحويل PDF */}
        {pdfConverting && (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-foreground font-medium">جاري تحويل PDF إلى صورة طويلة...</p>
          </div>
        )}
        {pdfError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{pdfError}</AlertDescription>
          </Alert>
        )}

        {/* واجهة الرسم - تظهر فقط بعد تحميل الملف */}
        {selectedFile && !pdfConverting && !pdfError && (
          <div className="flex flex-col flex-1 min-h-0 w-full space-y-4">
            {/* شريط الأدوات العلوي */}
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between bg-card p-4 rounded-lg border">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">
                  نوع السؤال:
                </span>
                <div className="flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedQuestionType === "mcq" ? "default" : "outline"}
                    onClick={() => startNewQuestion("mcq")}
                  >
                    سؤال متعدد الاختيارات
                    <Badge variant="secondary" className="mr-1 text-xs">
                      {questionSettings.mcq.optionCount}
                    </Badge>
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedQuestionType === "true_false" ? "default" : "outline"}
                    onClick={() => startNewQuestion("true_false")}
                  >
                    صح / خطأ
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedQuestionType === "essay" ? "default" : "outline"}
                    onClick={() => startNewQuestion("essay")}
                  >
                    مقالي
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => toast.info("الإعدادات محفوظة لكل نوع سؤال تلقائياً")}
                  >
                    <Settings className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* إعدادات MCQ السريعة */}
              {selectedQuestionType === "mcq" && (
                <div className="flex items-center gap-4 bg-muted/50 p-2 rounded-lg">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">عدد الخيارات:</span>
                    <Select
                      value={questionSettings.mcq.optionCount.toString()}
                      onValueChange={(value) => {
                        updateQuestionSettings("mcq", "optionCount", parseInt(value));
                        if (currentQuestion) {
                          setCurrentQuestion({
                            ...currentQuestion,
                            mcqOptionCount: parseInt(value)
                          });
                        }
                      }}
                    >
                      <SelectTrigger className="w-20 h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                        <SelectItem value="6">6</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">الاتجاه:</span>
                    <div className="flex gap-1">
                      <Button
                        type="button"
                        size="sm"
                        variant={questionSettings.mcq.direction === "horizontal" ? "default" : "outline"}
                        onClick={() => updateQuestionSettings("mcq", "direction", "horizontal")}
                        className="h-8 px-2"
                      >
                        أفقي
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant={questionSettings.mcq.direction === "vertical" ? "default" : "outline"}
                        onClick={() => updateQuestionSettings("mcq", "direction", "vertical")}
                        className="h-8 px-2"
                      >
                        رأسي
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* إحصائيات سريعة */}
              <div className="flex items-center gap-3 text-sm">
                <div className="flex items-center gap-1">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{numPages}</span>
                  <span className="text-muted-foreground">صفحة</span>
                </div>
                <Separator orientation="vertical" className="h-4" />
                <div className="flex items-center gap-1">
                  <Badge variant="outline">{questions.length}</Badge>
                  <span className="text-muted-foreground">سؤال</span>
                </div>
              </div>
            </div>

            {/* لوحة التحكم بالرسم والإجراءات */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={handleClearQuestions}
                  disabled={questions.length === 0 && !currentQuestion}
                >
                  <Trash2 className="w-4 h-4 ml-1" />
                  مسح الكل
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (questions.length > 0) {
                      setQuestions(prev => prev.slice(0, -1));
                      toast.success("تم حذف آخر سؤال");
                    }
                  }}
                  disabled={questions.length === 0}
                >
                  حذف آخر سؤال
                </Button>
                <Button
                  type="button"
                  variant="default"
                  size="sm"
                  onClick={() => setAnswerDialogOpen(true)}
                  disabled={questions.length === 0}
                >
                  <Check className="w-4 h-4 ml-1" />
                  الإجابات ({questions.length})
                </Button>
              </div>

              {/* حالة السؤال الحالي */}
              {currentQuestion && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg">
                  <span className="text-xs font-medium text-amber-800">
                    رسم السؤال {currentQuestion.index}:
                  </span>
                  <Badge variant="outline" className="bg-amber-100">
                    {currentQuestion.options.length} / {
                      currentQuestion.type === "mcq"
                        ? (currentQuestion.mcqOptionCount || questionSettings.mcq.optionCount)
                        : "1"
                    }
                  </Badge>
                  {currentQuestion.options.length >= (currentQuestion.type === "mcq"
                    ? (currentQuestion.mcqOptionCount || questionSettings.mcq.optionCount)
                    : 1) && (
                      <span className="text-xs text-green-600 font-semibold">✓ جاهز للإضافة</span>
                    )}
                </div>
              )}
            </div>

            {/* رسالة إرشادية حسب نوع السؤال المختار */}
            {isCreatingQuestion && selectedQuestionType && (
              <div className={`rounded-lg p-3 flex items-center gap-2 ${selectedQuestionType === "mcq" ? "bg-blue-50 border border-blue-200 text-blue-800" :
                selectedQuestionType === "true_false" ? "bg-green-50 border border-green-200 text-green-800" :
                  "bg-purple-50 border border-purple-200 text-purple-800"
                }`}>
                <PlusCircle className="w-5 h-5 shrink-0" />
                <p className="text-sm font-medium">
                  {selectedQuestionType === "mcq" ? (
                    <>
                      ارسم <strong>{currentQuestion?.mcqOptionCount || questionSettings.mcq.optionCount}</strong> مربعاً للاختيارات
                      ({questionSettings.mcq.direction === "horizontal" ? "أفقي" : "رأسي"})
                      {currentQuestion && currentQuestion.options.length > 0 && (
                        <span className="mr-2">- التالي: {currentOptionLabel}</span>
                      )}
                    </>
                  ) : selectedQuestionType === "true_false" ? (
                    "ارسم مربعاً واحداً لمنطقة الإجابة صح/خطأ"
                  ) : (
                    "ارسم مربعاً واحداً لمنطقة الإجابة المقالية"
                  )}
                </p>
              </div>
            )}

            {/* منطقة الرسم */}
            <div className="flex flex-col flex-1 min-h-0 border rounded-lg bg-muted/10 p-3">
              <p className="text-xs text-muted-foreground mb-2 shrink-0">
                {isCreatingQuestion ? (
                  <>
                    <span className="font-medium">وضع الرسم نشط:</span> اسحب على الصورة لرسم المربعات.
                    {selectedQuestionType === "mcq" && ` سيتم إنهاء السؤال تلقائياً عند اكتمال العدد.`}
                    {(selectedQuestionType === "true_false" || selectedQuestionType === "essay") && " سيتم إنهاء السؤال تلقائياً بعد رسم المربع."}
                  </>
                ) : (
                  "اختر نوع السؤال من الأعلى لبدء الرسم"
                )}
                {selectedQuestionType && !isCreatingQuestion && (
                  <Badge variant="secondary" className="mr-2">
                    ✓ نوع السؤال الحالي: {
                      selectedQuestionType === 'mcq' ? 'سؤال متعدد الاختيارات' :
                        selectedQuestionType === 'true_false' ? 'صح/خطأ' :
                          'مقالي'
                    }
                  </Badge>
                )}
              </p>
              <div
                ref={containerRef}
                className="flex-1 min-h-0 border rounded bg-white overflow-auto shadow-sm"
              >
                <div
                  ref={wrapperRef}
                  className="relative bg-white"
                  style={{
                    width: pdfDimensions ? `${canvasWidth * scale}px` : 'auto',
                    minHeight: pdfDimensions ? `${totalPdfHeight}px` : 'auto',
                  }}
                >
                  {/* الصورة المدمجة */}
                  {stitchedImageUrl && pdfDimensions && (
                    <div
                      className="relative bg-white shadow"
                      style={{
                        width: `${canvasWidth * scale}px`,
                        height: `${canvasHeight * scale}px`,
                      }}
                    >
                      <img
                        src={stitchedImageUrl}
                        alt="PDF كصورة طويلة"
                        className="block w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {/* طبقة الرسم */}
                  {pdfDimensions && (
                    <div
                      ref={canvasRef}
                      className={`absolute top-0 left-0 select-none ${isCreatingQuestion ? "cursor-crosshair" : "cursor-default"
                        }`}
                      style={{
                        pointerEvents: isCreatingQuestion ? "auto" : "none",
                        width: `${canvasWidth * scale}px`,
                        height: `${totalPdfHeight}px`,
                      }}
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                    >
                      {/* الأسئلة المكتملة - بألوان أفتح */}
                      {questions.map((question) => (
                        <div key={question.id}>
                          {question.options.map((option) => {
                            const pageOffset = getPageOffset(option.page);
                            return (
                              <div
                                key={option.id}
                                className={`absolute border-2 ${question.type === "mcq" ? "border-blue-300 bg-blue-50/30" :
                                  question.type === "true_false" ? "border-green-300 bg-green-50/30" :
                                    "border-purple-300 bg-purple-50/30"
                                  }`}
                                style={{
                                  left: `${option.x * scale}px`,
                                  top: `${pageOffset + option.y * scale}px`,
                                  width: `${option.width * scale}px`,
                                  height: `${option.height * scale}px`,
                                }}
                              >
                                <div className={`absolute -top-6 right-0 text-xs px-2 py-1 rounded ${question.type === "mcq" ? "bg-blue-500 text-white" :
                                  question.type === "true_false" ? "bg-green-500 text-white" :
                                    "bg-purple-500 text-white"
                                  }`}>
                                  س{question.index} - {question.type === "true_false" ? "صح/خطأ" : option.label} - ص{option.page}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* السؤال الحالي - بلون برتقالي فاتح */}
                      {currentQuestion && currentQuestion.options.map((option) => {
                        const pageOffset = getPageOffset(option.page);
                        return (
                          <div
                            key={option.id}
                            className="absolute border-2 border-orange-300 bg-orange-50/30"
                            style={{
                              left: `${option.x * scale}px`,
                              top: `${pageOffset + option.y * scale}px`,
                              width: `${option.width * scale}px`,
                              height: `${option.height * scale}px`,
                            }}
                          >
                            <div className="absolute -top-6 right-0 text-xs bg-orange-500 text-white px-2 py-1 rounded">
                              {currentQuestion.type === "true_false" ? "صح/خطأ" : option.label} - ص{option.page}
                            </div>
                          </div>
                        );
                      })}

                      {/* معاينة المربع الذي يتم رسمه - بلون أحمر فاتح */}
                      {previewOption && (
                        <div
                          className="absolute border-2 border-dashed border-red-300 bg-red-50/30"
                          style={{
                            left: `${previewOption.x * scale}px`,
                            top: `${getPageOffset(previewOption.page) + previewOption.y * scale}px`,
                            width: `${previewOption.width * scale}px`,
                            height: `${previewOption.height * scale}px`,
                          }}
                        >
                          <div className="absolute -top-6 right-0 text-xs bg-red-500 text-white px-2 py-1 rounded">
                            {selectedQuestionType === "true_false" ? "صح/خطأ" : previewOption.label} - ص{previewOption.page}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* نافذة إدخال الإجابات */}
        <Dialog open={answerDialogOpen} onOpenChange={setAnswerDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>إدخال/تعديل الإجابات</DialogTitle>
              <DialogDescription>
                حدد الإجابة الصحيحة لكل سؤال. يمكنك أيضاً تغيير نوع السؤال – سيتم إغلاق النافذة تلقائياً لبدء الرسم.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              {questions.map((question) => (
                <Card key={question.id}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <Badge>سؤال {question.index}</Badge>
                        <Badge variant="outline">صفحة {question.page}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={question.type}
                          onValueChange={(value: QuestionType) => updateQuestionType(question.id, value)}
                        >
                          <SelectTrigger className="w-32">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="mcq">سؤال متعدد الاختيارات</SelectItem>
                            <SelectItem value="true_false">صح/خطأ</SelectItem>
                            <SelectItem value="essay">مقالي</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteQuestion(question.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </div>

                    {/* محتوى السؤال حسب النوع */}
                    {question.type === "mcq" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Label>الإجابة الصحيحة:</Label>
                          {question.answer && (
                            <Badge variant="success" className="text-green-700 bg-green-100">
                              {question.answer}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {getLabels(examLanguage, question.mcqOptionCount || 4).map((label) => (
                            <Button
                              key={label}
                              type="button"
                              size="sm"
                              variant={question.answer === label ? "default" : "outline"}
                              onClick={() => updateQuestionAnswer(question.id, label)}
                              className="min-w-[40px]"
                            >
                              {label}
                            </Button>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === "true_false" && (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <Label>الإجابة الصحيحة:</Label>
                          {question.answer && (
                            <Badge variant="success" className="text-green-700 bg-green-100">
                              {question.answer === "TRUE" ? "صح" : "خطأ"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            variant={question.answer === "FALSE" ? "default" : "outline"}
                            onClick={() => updateQuestionAnswer(question.id, "FALSE")}
                            className="flex items-center gap-1"
                          >
                            <XCircle className="w-4 h-4" />
                            خطأ
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant={question.answer === "TRUE" ? "default" : "outline"}
                            onClick={() => updateQuestionAnswer(question.id, "TRUE")}
                            className="flex items-center gap-1"
                          >
                            <Check className="w-4 h-4" />
                            صح
                          </Button>
                        </div>
                      </div>
                    )}

                    {question.type === "essay" && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-500" />
                          هذا السؤال سيتم تصحيحه يدوياً (إجابة مقالية).
                        </div>
                      </div>
                    )}

                    <div className="text-xs text-muted-foreground mt-3 flex flex-wrap gap-2">
                      <Badge variant="outline">المربعات: {question.options.length}</Badge>
                      <Badge variant="outline">
                        الاتجاه: {question.answerDirection === "horizontal" ? "أفقي" : "رأسي"}
                      </Badge>
                      {question.type === "mcq" && (
                        <Badge variant="outline">الخيارات: {question.mcqOptionCount || 4}</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}

              {questions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  لم يتم رسم أي أسئلة بعد. أغلق هذه النافذة وارسم مربعات على النموذج أولاً.
                </p>
              )}
            </div>

            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setAnswerDialogOpen(false)}>
                إغلاق
              </Button>
              <Button
                type="button"
                onClick={handleSaveTemplate}
                disabled={!examId || !selectedFile || questions.length === 0 || isLoading}
              >
                {isLoading ? "جاري الحفظ..." : "حفظ نموذج المعلم"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* ---------- زر المساعدة الثابت باستخدام المكون الموحد ---------- */}
        <HelpFab
          title="كيفية استخدام صفحة إعداد نموذج المعلم"
          description="دليل سريع لاستخدام صفحة إعداد نموذج اختبار المعلم"
          tooltip="دليل استخدام صفحة إعداد النموذج"
        >
          <div className="space-y-6">
            <p className="text-muted-foreground leading-relaxed">
              <strong>نموذج المعلم</strong> هو ملف الامتحان الذي سيتم تصحيحه آلياً. من خلال هذه الصفحة يمكنك تحديد مناطق الإجابة لكل سؤال وتحديد الإجابات الصحيحة.
            </p>

            <div className="space-y-4">
              {/* بطاقة: إدخال رقم الامتحان واللغة */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">1. إدخال رقم الامتحان واللغة</h4>
                  <p className="text-sm text-muted-foreground">
                    أدخل رقم الامتحان (رقم صحيح) واختر لغة الامتحان (عربي أو إنجليزي). ستؤثر اللغة على تسميات الخيارات (أ، ب، ج ... أو A, B, C ...).
                  </p>
                </div>
              </div>

              {/* بطاقة: رفع الملف */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">2. رفع ملف الامتحان</h4>
                  <p className="text-sm text-muted-foreground">
                    ارفع ملف PDF أو صورة. إذا كان PDF سيتم تحويله إلى صورة طويلة (قد يستغرق بضع ثوانٍ).
                  </p>
                </div>
              </div>

              {/* بطاقة: اختيار نوع السؤال */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <Settings className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">3. اختيار نوع السؤال</h4>
                  <p className="text-sm text-muted-foreground">
                    من شريط الأدوات العلوي، اختر نوع السؤال: <strong>متعدد الاختيارات</strong>، <strong>صح/خطأ</strong>، أو <strong>مقالي</strong>. يمكنك تعديل عدد الخيارات واتجاهها لأسئلة MCQ.
                  </p>
                </div>
              </div>

              {/* بطاقة: رسم المربعات */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <PlusCircleIcon className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">4. رسم مربعات الإجابة</h4>
                  <p className="text-sm text-muted-foreground">
                    اسحب على الصورة لرسم مربع حول منطقة الإجابة. لأسئلة MCQ، ارسم العدد المطلوب من المربعات (سيتم إنهاء السؤال تلقائياً عند الاكتمال). لصح/خطأ والمقالي، ارسم مربعاً واحداً فقط.
                  </p>
                </div>
              </div>

              {/* بطاقة: تحديد الإجابات */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <Check className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">5. تحديد الإجابات الصحيحة</h4>
                  <p className="text-sm text-muted-foreground">
                    بعد رسم جميع الأسئلة، اضغط على زر <strong>الإجابات</strong> لفتح نافذة تحديد الإجابات الصحيحة. يمكنك أيضاً تغيير نوع السؤال من هناك (سيتم إغلاق النافذة لبدء الرمجدداً).
                  </p>
                </div>
              </div>

              {/* بطاقة: الحفظ */}
              <div className="flex items-start gap-4">
                <div className="rounded-lg border bg-card p-3 transition-all hover:shadow-md">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold">6. حفظ نموذج المعلم</h4>
                  <p className="text-sm text-muted-foreground">
                    بعد التأكد من جميع الإجابات، اضغط <strong>حفظ نموذج المعلم</strong>. سيتم رفع الملف مع بيانات الأسئلة إلى الخادم.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground border-t pt-4 mt-2">
              💡 يمكنك في أي وقت تعديل الأسئلة أو حذفها باستخدام الأزرار الموجودة. إذا قمت بتغيير نوع سؤال موجود، سيتم نقلك لوضع الرسم لإكمال المتطلبات.
            </p>
          </div>
        </HelpFab>
        {/* ---------------------------------------------------------------------- */}
      </div>
    </MainLayout>
  );
}