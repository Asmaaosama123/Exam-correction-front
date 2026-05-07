// components/ExamTemplateSetup.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Upload, FileText, X, Trash2, Check, XCircle, AlertCircle, RotateCw, Settings, PlusCircle, PlusCircle as PlusCircleIcon, BarChart3, Camera, Image as ImageIcon, Save, Loader2, ChevronDown, ChevronUp, Sparkles, Wand2, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { HelpFab } from "@/components/ui/help-fab";
import { Label } from "@/components/ui/label";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StitchedPdfViewer from '@/components/ui/StitchedPdfViewerProps';
import { useNavigate } from "react-router-dom";
import { useUploadTeacherExam, useAnalyzeTemplate } from "@/hooks/use-exam-template";
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
  },
  complete: {
    optionCount: 1,
    direction: "horizontal" as AnswerDirection
  },
  matching: {
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
  const navigate = useNavigate();
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [savedExamId, setSavedExamId] = useState<number | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDimensions, setPdfDimensions] = useState<{ width: number; height: number } | null>(null);
  const [numPages, setNumPages] = useState(1);
  const [scale, setScale] = useState(1);
  const [stitchedImageUrl, setStitchedImageUrl] = useState<string | null>(null);
  const [, setUpdateKey] = useState(Date.now().toString());
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const uploadTeacherExamMutation = useUploadTeacherExam();
  const analyzeMutation = useAnalyzeTemplate();

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
  const [activeTab, setActiveTab] = useState<'paper' | 'answers' | 'ai'>('answers');
  const [examId, setExamId] = useState<string>("");
  // خريطة نصية مؤقتة لإدخال الدرجات (تدعم الكسور أثناء الكتابة)
  const [pointsInputMap, setPointsInputMap] = useState<Record<string, string>>({});
  const [isUploading, setIsUploading] = useState(false);
  const isLoading = uploadTeacherExamMutation.isPending || isUploading;
  const [pdfConverting, setPdfConverting] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [pdfKey, setPdfKey] = useState(0);
  const [isDrawingEnabled, setIsDrawingEnabled] = useState(true);

  // حالة اللغة المختارة (عربي / إنجليزي)
  const [examLanguage, setExamLanguage] = useState<Language>("en");
  const [examIdError, setExamIdError] = useState<string | null>(null);

  const [isBarcodeMode, setIsBarcodeMode] = useState(true);
  const [examTitle, setExamTitle] = useState("");
  const [examSubject, setExamSubject] = useState("");

  // حالة طي/توسيع الأسئلة في نافذة الإجابات
  const [expandedQuestions, setExpandedQuestions] = useState<Record<string, boolean>>({});

  // AI Analysis states
  const [aiQuestions, setAiQuestions] = useState<any[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isAiEnabled, setIsAiEnabled] = useState(false);

  const handleAiAnalysis = async () => {
    if (!selectedFile) {
      toast.error("يرجى رفع ملف أولاً");
      return;
    }

    // Set AI enabled and start loading
    setIsAiEnabled(true);
    setIsAnalyzing(true);
    setAnswerDialogOpen(true);
    setActiveTab('ai');

    try {
      const data = await analyzeMutation.mutateAsync(selectedFile);

      if (!data || !data.questions) {
        throw new Error("تنسيق غير صحيح من الذكاء الاصطناعي");
      }

      const formatted = data.questions.map((q: any, idx: number) => ({
        id: `ai-${Date.now()}-${idx}`,
        index: q.question_number || (idx + 1).toString(),
        text: q.question_text,
        type: q.type || "essay",
        points: q.points || 1,
        geminiAnswer: q.model_answer,
        teacherAnswer: "" // Will be used if teacher wants to override
      }));

      setAiQuestions(formatted);
      toast.success("تم تحليل الأسئلة بنجاح باستخدام Gemini");
    } catch (error) {
      console.error("AI Analysis error:", error);
      toast.error("حدث خطأ أثناء تحليل الأسئلة بالتطبيق");
      setIsAiEnabled(false);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const updateAiQuestion = (id: string, field: string, value: any) => {
    setAiQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
  };

  const toggleQuestionExpansion = (id: string) => {
    setExpandedQuestions(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  // دليل المستخدم


  const canvasWidth = pdfDimensions?.width || PAGE_SIZES.a4.width;
  const canvasHeight = pdfDimensions?.height || PAGE_SIZES.a4.height;
  const totalPdfHeight = numPages * canvasHeight * scale;

  // ========== إدارة الملفات ==========
  const stitchImages = async (files: File[]): Promise<{ url: string, width: number, height: number, file: File }> => {
    return new Promise((resolve, reject) => {
      const images: HTMLImageElement[] = [];
      let loadedCount = 0;

      files.forEach((file, index) => {
        const img = new Image();
        img.onload = () => {
          images[index] = img;
          loadedCount++;
          if (loadedCount === files.length) {
            // Calculate dimensions
            const maxWidth = Math.max(...images.map(i => i.width));
            const totalHeight = images.reduce((sum, i) => sum + i.height, 0);

            const canvas = document.createElement('canvas');
            canvas.width = maxWidth;
            canvas.height = totalHeight;
            const ctx = canvas.getContext('2d');

            if (!ctx) {
              reject(new Error("Failed to get canvas context"));
              return;
            }

            let currentY = 0;
            images.forEach(img => {
              ctx.drawImage(img, 0, currentY);
              currentY += img.height;
            });

            canvas.toBlob((blob) => {
              if (blob) {
                const url = URL.createObjectURL(blob);
                const stitchedFile = new File([blob], "stitched_images.png", { type: "image/png" });
                resolve({ url, width: maxWidth, height: totalHeight, file: stitchedFile });
              } else {
                reject(new Error("Failed to create blob"));
              }
            }, "image/png");
          }
        };
        img.onerror = () => reject(new Error(`Failed to load image ${file.name}`));
        img.src = URL.createObjectURL(file);
      });
    });
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement> | File | File[]) => {
    let files: File[] = [];

    if (Array.isArray(e)) {
      files = e;
    } else if (e instanceof File) {
      files = [e];
    } else {
      files = Array.from(e.target.files || []);
    }

    if (files.length === 0) return;

    // Check if we have multiple images vs one PDF
    const hasPdf = files.some(f => f.name.toLowerCase().endsWith('.pdf'));
    if (hasPdf && files.length > 1) {
      toast.error("لا يمكن رفع أكثر من ملف PDF واحد");
      return;
    }

    const allowedExtensions = [".pdf", ".jpg", ".jpeg", ".png"];
    const invalidFiles = files.filter(f => !allowedExtensions.includes(f.name.toLowerCase().substring(f.name.lastIndexOf('.'))));

    if (invalidFiles.length > 0) {
      toast.error("بعض الملفات غير مدعومة. يرجى اختيار PDF أو صور فقط.");
      return;
    }

    if (stitchedImageUrl) {
      URL.revokeObjectURL(stitchedImageUrl);
      setStitchedImageUrl(null);
    }

    if (files.length === 1 && files[0].name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(files[0]);
      setPdfConverting(true);
    } else {
      // Handle images (one or many)
      try {
        const { url, width, height, file } = await stitchImages(files);
        setSelectedFile(file);
        setStitchedImageUrl(url);
        setPdfDimensions({ width, height });
        setNumPages(1);
      } catch (err) {
        toast.error("حدث خطأ أثناء معالجة الصور");
        console.error(err);
      }
    }

    setUpdateKey(Date.now().toString());
    setPdfKey(prev => prev + 1);
    setQuestions([]);
    setCurrentQuestion(null);
    setSelectedQuestionType(null);
    setIsCreatingQuestion(false);
    setScale(1);
    setPdfError(null);
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
    const docY = clientY - rect.top; // No scrollTop here, rect.top already accounts for viewport position

    let accumulatedHeight = 0;
    let page = 1;
    for (let i = 1; i <= numPages; i++) {
      const pageHeight = canvasHeight * scale;
      if (docY < accumulatedHeight + pageHeight) {
        page = i;
        break;
      }
      accumulatedHeight += pageHeight;
    }
    const y = (docY - accumulatedHeight) / scale;
    const x = (clientX - rect.left) / scale;
    return { x: Math.max(0, x), y: Math.max(0, y), page };
  };

  // ========== ترتيب الخيارات حسب الاتجاه ==========
  const sortOptionsByDirection = useCallback(
    (options: OptionBox[], direction: AnswerDirection = "horizontal", language: Language = "ar"): OptionBox[] => {
      const optionsCopy = [...options];
      if (direction === "horizontal") {
        return optionsCopy.sort((a, b) => {
          if (Math.abs(a.y - b.y) < 20) {
            // IF English -> Left to Right (Ascending X)
            // IF Arabic -> Right to Left (Descending X)
            return language === "en" ? a.x - b.x : b.x - a.x;
          }
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
      essay: "ارسم مربعاً واحداً لمنطقة الإجابة المقالية",
      complete: "ارسم مربعاً واحداً لمنطقة الإجابة (أكمل)",
      matching: "ارسم مربعاً واحداً لمنطقة الإجابة (توصيل)"
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
        const sortedOptions = sortOptionsByDirection(question.options, question.answerDirection, examLanguage);
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

  // ========== أحداث الإشارة (Pointer Events) للعمل على الفأرة واللمس ==========
  const handleCanvasPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!selectedFile || !selectedQuestionType || !isCreatingQuestion) return;

    // Capture pointer to track movement even outside the element
    e.currentTarget.setPointerCapture(e.pointerId);

    const { x, y, page } = getCanvasCoordinates(e.clientX, e.clientY);
    setIsDrawing(true);
    setDrawStart({ x, y, page });

    const optionId = `opt-${Date.now()}`;
    let label = currentOptionLabel;
    if (selectedQuestionType === "true_false") label = "صح/خطأ";
    if (selectedQuestionType === "complete") label = "أكمل";
    if (selectedQuestionType === "matching") label = "توصيل";

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

  const handleCanvasPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !previewOption) return;
    const { x, y } = getCanvasCoordinates(e.clientX, e.clientY);
    const newX = Math.min(drawStart.x, x);
    const newY = Math.min(drawStart.y, y);
    const newWidth = Math.abs(x - drawStart.x);
    const newHeight = Math.abs(y - drawStart.y);
    setPreviewOption({ ...previewOption, x: newX, y: newY, width: newWidth, height: newHeight });
  };

  const handleCanvasPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDrawing || !drawStart || !previewOption || !selectedQuestionType) return;

    e.currentTarget.releasePointerCapture(e.pointerId);

    if (previewOption.width > 10 && previewOption.height > 10) {
      if (currentQuestion) {
        // تحديث السؤال الحالي
        let updatedQuestion = {
          ...currentQuestion,
          options: [...currentQuestion.options, previewOption]
        };

        if (selectedQuestionType === "mcq") {
          const sortedOptions = sortOptionsByDirection(updatedQuestion.options, questionSettings.mcq.direction, examLanguage);
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
          mcqOptionCount: selectedQuestionType === "mcq" ? settings.optionCount : undefined,
          points: 1 // ✅ القيمة الافتراضية
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
      const sortedOptions = sortOptionsByDirection(updatedQuestion.options, settings.direction, examLanguage);
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

  // ✅ تحديث عدد الأسئلة المقالية داخل البوكس الواحد
  const updateEssaySubQuestionsCount = (questionId: string, count: number) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;

      const currentSubQuestions = q.essaySubQuestions || [];
      const newSubQuestions = [...currentSubQuestions];

      if (count > currentSubQuestions.length) {
        // إضافة أسئلة جديدة
        for (let i = currentSubQuestions.length; i < count; i++) {
          newSubQuestions.push({
            id: i + 1,
            answer: null,
            points: 1
          });
        }
      } else {
        // حذف أسئلة زائدة
        newSubQuestions.splice(count);
      }

      return { ...q, essaySubQuestions: newSubQuestions };
    }));
  };

  // ✅ تحديث بيانات سؤال مقالي فرعي (الإجابة أو الدرجة)
  const updateEssaySubQuestionData = (questionId: string, subId: number, field: 'answer' | 'points', value: any) => {
    setQuestions(prev => prev.map(q => {
      if (q.id !== questionId) return q;

      const newSubQuestions = (q.essaySubQuestions || []).map(sub => {
        if (sub.id !== subId) return sub;
        return { ...sub, [field]: value };
      });

      return { ...q, essaySubQuestions: newSubQuestions };
    }));
  };


  // ========== حساب الـ ROI الكلي للسؤال ==========
  const calculateOverallROI = (question: Question): [number, number, number, number] => {
    if (!question.options || question.options.length === 0) return [0, 0, 0, 0];
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
    const totalHeight = Math.round(canvasHeight * numPages);

    const questionsData: any[] = [];
    let currentIdCounter = 1;

    // Use AI questions if AI mode is active, otherwise use manual ones
    const activeQuestions = activeTab === 'ai' ? aiQuestions : questions;

    activeQuestions.forEach(question => {
      // Logic for questions from AI
      if (activeTab === 'ai') {
        questionsData.push({
          id: question.index || currentIdCounter++,
          type: question.type,
          answer: question.teacherAnswer || question.geminiAnswer,
          points: question.points || 1,
          rois: {}
        });
        return;
      }

      // Existing logic for manual questions
      // Calculate cumulative offset for the question's page
      const pageYOffset = (question.page - 1) * canvasHeight;

      const getAbsoluteROI = (opt: OptionBox): [number, number, number, number] => [
        Math.round(opt.x),
        Math.round(pageYOffset + opt.y),
        Math.round(opt.width),
        Math.round(opt.height)
      ];

      if (question.type === "essay" || question.type === "complete" || question.type === "matching") {
        const subQuestions = question.essaySubQuestions || [];
        // Calculate overall ROI using absolute coordinates
        let minX = Infinity, minY = Infinity, maxX = 0, maxY = 0;
        question.options.forEach(option => {
          const absY = pageYOffset + option.y;
          minX = Math.min(minX, option.x);
          minY = Math.min(minY, absY);
          maxX = Math.max(maxX, option.x + option.width);
          maxY = Math.max(maxY, absY + option.height);
        });
        const overallRoiAbs: [number, number, number, number] = [
          Math.round(minX),
          Math.round(minY),
          Math.round(maxX - minX),
          Math.round(maxY - minY)
        ];

        const commonRois = { "main": overallRoiAbs };

        if (subQuestions.length > 0) {
          subQuestions.forEach(sub => {
            questionsData.push({
              id: currentIdCounter++,
              type: question.type,
              answer: sub.answer,
              points: sub.points || 1,
              rois: commonRois
            });
          });
        } else {
          questionsData.push({
            id: currentIdCounter++,
            type: question.type,
            answer: question.answer || null,
            points: question.points || 1,
            rois: commonRois
          });
        }
      } else {
        const rois: Record<string, [number, number, number, number]> = {};

        if (question.type === "mcq") {
          question.options.forEach(option => {
            rois[option.label] = getAbsoluteROI(option);
          });
        } else if (question.type === "true_false" && question.options.length >= 1) {
          rois["TF"] = getAbsoluteROI(question.options[0]);
        }

        questionsData.push({
          id: currentIdCounter++,
          type: question.type,
          answer: question.answer,
          points: question.points || 1,
          rois: rois
        });
      }
    });

    return JSON.stringify({
      canvas: { width: canvasWidth, height: totalHeight },
      questions: questionsData
    });
  };


  // ========== حفظ نموذج المعلم ==========
  const handleSaveTemplate = async () => {
    let examIdNum: number | undefined = undefined;

    if (isBarcodeMode) {
      if (!examId.trim()) {
        setExamIdError("الرجاء إدخال رقم الامتحان");
        toast.error("الرجاء إدخال رقم الامتحان");
        return;
      }
      examIdNum = parseInt(examId);
      if (isNaN(examIdNum)) {
        setExamIdError("رقم الامتحان يجب أن يتكون من أرقام فقط");
        toast.error("رقم الامتحان يجب أن يتكون من أرقام فقط");
        return;
      }
      setExamIdError(null);
    } else {
      if (!examTitle.trim()) {
        toast.error("الرجاء إدخال اسم الامتحان");
        return;
      }
      if (!examSubject.trim()) {
        toast.error("الرجاء إدخال المادة الدراسية");
        return;
      }
    }

    if (!selectedFile) {
      toast.error("الرجاء رفع ملف الامتحان أولاً");
      return;
    }

    setIsUploading(true);
    try {
      const questionsJson = prepareQuestionsJson();

      const response = await uploadTeacherExamMutation.mutateAsync({
        ExamId: examIdNum,
        Title: !isBarcodeMode ? examTitle : undefined,
        Subject: !isBarcodeMode ? examSubject : undefined,
        IsBarcode: isBarcodeMode,
        File: selectedFile,
        QuestionsJson: questionsJson,
        PageCount: numPages
      });

      // On success (mutationAsync will throw on error)
      if (isBarcodeMode) {
        handleRemoveFile();
        setExamId("");
        setAnswerDialogOpen(false);
      } else {
        const newExamId = response.examId || (response as any).ExamId;
        setSavedExamId(newExamId);
        setAnswerDialogOpen(false);
        setSuccessDialogOpen(true);
      }

    } catch (error) {
      console.error("خطأ في عملية الرفع:", error);
    } finally {
      setIsUploading(false);
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
    return (pageNum - 1) * (canvasHeight * scale);
  };

  // ========== أحداث StitchedPdfViewer ==========
  const handleStitchedPdfLoaded = (data: { width: number; height: number; pageCount: number; imageUrl: string }) => {
    setPdfConverting(false);
    setPdfError(null);
    // نأخذ عرض الصفحة الواحدة (الارتفاع الكلي مقسوماً على عدد الصفحات)
    setPdfDimensions({ width: data.width, height: data.height / data.pageCount });
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              إعداد نموذج اختبار المعلم
            </h1>
            <p className="text-muted-foreground mt-2">
              ارفع ورقة الاختبار وحدد مناطق الأسئلة على النموذج، ثم قم بتحديد الإجابات الصحيحة لكل سؤال.
            </p>
          </div>
          {/* <Button
               onClick={() => setShowCamera(true)}
               className="bg-primary text-white shadow-md"
             >
               <Camera className="ml-2 h-4 w-4" />
               فتح الكاميرا
             </Button> */}
        </div>

        {/* بطاقة معلومات الامتحان */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label>نوع الاختبار</Label>
                <Select
                  value={isBarcodeMode ? "barcode" : "no-barcode"}
                  onValueChange={(val) => {
                    setIsBarcodeMode(val === "barcode");
                    if (val === "barcode") {
                      setExamTitle("");
                      setExamSubject("");
                    } else {
                      setExamId("");
                      setExamIdError(null);
                    }
                  }}
                >
                  <SelectTrigger className="w-full bg-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="barcode">نظام الباركود</SelectItem>
                    <SelectItem value="no-barcode">بدون باركود</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {isBarcodeMode ? (
                <div className="space-y-2">
                  <Label htmlFor="examId">رقم الاختبار *</Label>
                  <Input
                    id="examId"
                    value={examId}
                    onChange={(e) => {
                      setExamId(e.target.value);
                      if (e.target.value.trim()) setExamIdError(null);
                    }}
                    placeholder="أدخل رقم الاختبار"
                    type="number"
                    className={examIdError ? "border-destructive focus-visible:ring-destructive" : ""}
                  />
                  {examIdError && (
                    <p className="text-xs font-medium text-destructive mt-1">
                      {examIdError}
                    </p>
                  )}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="examTitle">اسم الاختبار *</Label>
                    <Input
                      id="examTitle"
                      value={examTitle}
                      onChange={(e) => setExamTitle(e.target.value)}
                      placeholder="مثال: اختبار الشهر الأول"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="examSubject">المادة الدراسية *</Label>
                    <Input
                      id="examSubject"
                      value={examSubject}
                      onChange={(e) => setExamSubject(e.target.value)}
                      placeholder="مثال: الرياضيات"
                    />
                  </div>
                </>
              )}
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
          <div className="flex items-center justify-between">
            <Label>ملف نموذج الإجابة *</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => cameraInputRef.current?.click()}
              className="text-primary hover:text-primary/80"
            >
              <Camera className="w-4 h-4 ml-2" />
              استخدم الكاميرا
            </Button>
            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>
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
                  multiple
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
                    variant={selectedQuestionType === "complete" ? "default" : "outline"}
                    onClick={() => startNewQuestion("complete")}
                  >
                    أكمل
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={selectedQuestionType === "matching" ? "default" : "outline"}
                    onClick={() => startNewQuestion("matching")}
                  >
                    توصيل
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 text-purple-700 hover:from-purple-100 hover:to-indigo-100 shadow-sm"
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                  >
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 ml-2" />
                    )}
                    استخراج الأسئلة بالذكاء الاصطناعي
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

              {/* زر تبديل وضع الرسم للموبايل */}
              <div className="flex md:hidden items-center gap-2 bg-muted p-1 rounded-lg">
                <Button
                  type="button"
                  size="sm"
                  variant={!isDrawingEnabled ? "default" : "ghost"}
                  onClick={() => setIsDrawingEnabled(false)}
                  className="h-8 text-xs px-3"
                >
                  تحريك (Scroll)
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant={isDrawingEnabled ? "default" : "ghost"}
                  onClick={() => setIsDrawingEnabled(true)}
                  className="h-8 text-xs px-3"
                >
                  رسم (Draw)
                </Button>
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
                  disabled={!selectedFile}
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
                  ) : selectedQuestionType === "complete" ? (
                    "ارسم مربعاً واحداً لمنطقة الإجابة (أكمل)"
                  ) : selectedQuestionType === "matching" ? (
                    "ارسم مربعاً واحداً لمنطقة الإجابة (توصيل)"
                  ) : (
                    "ارسم مربعاً واحداً لمنطقة الإجابة المقالية"
                  )}
                </p>
              </div>
            )}

            {/* منطقة الرسم */}
            <div className="flex flex-col flex-1 min-h-0 border rounded-lg bg-muted/10 p-3">
              <div className="text-xs text-muted-foreground mb-2 shrink-0 flex flex-wrap items-center gap-y-1">
                {isCreatingQuestion ? (
                  <>
                    <span className="font-medium">وضع الرسم نشط:</span> اسحب على الصورة لرسم المربعات.
                    {selectedQuestionType === "mcq" && ` سيتم إنهاء السؤال تلقائياً عند اكتمال العدد.`}
                    {(selectedQuestionType === "true_false" || selectedQuestionType === "essay" || selectedQuestionType === "complete") && " سيتم إنهاء السؤال تلقائياً بعد رسم المربع."}
                  </>
                ) : (
                  "اختر نوع السؤال من الأعلى لبدء الرسم"
                )}
                {selectedQuestionType && !isCreatingQuestion && (
                  <Badge variant="secondary" className="mr-2">
                    ✓ نوع السؤال الحالي: {
                      selectedQuestionType === 'mcq' ? 'سؤال متعدد الاختيارات' :
                        selectedQuestionType === 'true_false' ? 'صح/خطأ' :
                          selectedQuestionType === 'essay' ? 'مقالي' :
                            selectedQuestionType === 'complete' ? 'أكمل' : 'توصيل'
                    }
                  </Badge>
                )}
                <Badge variant="outline" className={`${isDrawingEnabled ? "bg-green-50 text-green-700 border-green-200" : "bg-slate-50 text-slate-700"} mr-2`}>
                  وضع: {isDrawingEnabled ? "الرسم نشط" : "التحريك (Scroll) نشط"}
                </Badge>
              </div>

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
                        height: `${totalPdfHeight}px`,
                      }}
                    >
                      <img
                        src={stitchedImageUrl}
                        alt="PDF كصورة طويلة"
                        className="block w-full h-full object-contain"
                      />
                    </div>
                  )}

                  {pdfDimensions && (
                    <div
                      ref={canvasRef}
                      className={`absolute top-0 left-0 select-none ${isCreatingQuestion ? "cursor-crosshair" : "cursor-default"
                        }`}
                      style={{
                        pointerEvents: (isCreatingQuestion && isDrawingEnabled) ? "auto" : "none",
                        width: `${canvasWidth * scale}px`,
                        height: `${totalPdfHeight}px`,
                        touchAction: (isCreatingQuestion && isDrawingEnabled) ? "none" : "auto"
                      }}
                      onPointerDown={handleCanvasPointerDown}
                      onPointerMove={handleCanvasPointerMove}
                      onPointerUp={handleCanvasPointerUp}
                      onPointerLeave={handleCanvasPointerUp}
                    >
                      {/* الأسئلة المكتملة */}
                      {questions.map((question) => (
                        <div key={question.id}>
                          {question.options.map((option) => {
                            const pageOffset = getPageOffset(option.page);
                            return (
                              <div
                                key={option.id}
                                className={`absolute border-2 ${question.type === "mcq" ? "border-blue-300 bg-blue-50/30" :
                                  question.type === "true_false" ? "border-green-300 bg-green-50/30" :
                                    question.type === "essay" ? "border-purple-300 bg-purple-50/30" :
                                      "border-indigo-300 bg-indigo-50/30"
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
                                    question.type === "essay" ? "bg-purple-500 text-white" :
                                      "bg-indigo-500 text-white"
                                  }`}>
                                  س{question.index} - {question.type === "true_false" ? "صح/خطأ" : option.label}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}

                      {/* السؤال الحالي */}
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
                              {currentQuestion.type === "true_false" ? "صح/خطأ" : option.label}
                            </div>
                          </div>
                        );
                      })}

                      {/* معاينة المربع الذي يتم رسمه */}
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
                            {selectedQuestionType === "true_false" ? "صح/خطأ" : previewOption.label}
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
          <DialogContent className="max-w-[95vw] sm:max-w-[95vw] md:max-w-[95vw] lg:max-w-[1400px] w-full h-[95vh] sm:h-[90vh] flex flex-col p-0 overflow-hidden bg-slate-50 border-0 shadow-2xl">

            <DialogHeader className="p-2 sm:p-4 bg-white border-b shrink-0 flex flex-row items-center justify-between gap-2">
              <div className="flex flex-col gap-0.5 overflow-hidden">
                <DialogTitle className="text-xs sm:text-xl font-bold truncate">إدخال/تعديل الإجابات والدرجات</DialogTitle>
                <DialogDescription className="text-[9px] sm:text-xs">
                  مجموع الدرجات: <span className="font-bold text-primary">{questions.reduce((sum, q) => sum + (q.points || 0), 0)}</span>
                </DialogDescription>
              </div>
              <DialogClose className="rounded-full h-7 w-7 sm:h-8 sm:w-8 flex items-center justify-center bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors shrink-0">
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </DialogClose>
            </DialogHeader>

            <div className="flex-1 flex flex-col overflow-hidden bg-white">
              {/* تبديل للموبايل فقط */}
              <div className="md:hidden border-b bg-white px-4 py-2 shrink-0">
                <div className="grid w-full grid-cols-3 p-1 bg-slate-100 rounded-lg">
                  <button
                    onClick={() => setActiveTab('paper')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'paper' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    ورقة الأسئلة
                  </button>
                  <button
                    onClick={() => setActiveTab('answers')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'answers' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    الإجابات
                  </button>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className={`py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'ai' ? 'bg-white shadow-sm text-primary' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    الذكاء الاصطناعي
                  </button>
                </div>
              </div>

              <div className="flex-1 flex flex-col md:flex-row overflow-hidden min-h-0 bg-slate-100/50">
                {/* القسم الأيمن: فورم الإجابات - يدوي أو AI */}
                <div className={`m-0 flex-1 md:basis-1/2 bg-white overflow-y-auto p-2 sm:p-6 custom-scrollbar font-sans rtl ${activeTab !== 'paper' ? 'flex flex-col' : 'hidden'} md:flex md:flex-col`}>

                  {/* أزرار التبديل لسطح المكتب */}
                  <div className="hidden md:flex items-center gap-2 mb-6 bg-slate-50 p-1 rounded-xl border w-fit">
                    <Button
                      variant={activeTab === 'answers' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('answers')}
                      className="rounded-lg h-9 px-4 font-bold"
                    >
                      <PlusCircle className="w-4 h-4 ml-2" />
                      إدخال يدوي (بالمربعات)
                    </Button>
                    <Button
                      variant={activeTab === 'ai' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setActiveTab('ai')}
                      className="rounded-lg h-9 px-4 font-bold"
                    >
                      <Sparkles className={`w-4 h-4 ml-2 ${activeTab === 'ai' ? 'animate-pulse' : ''}`} />
                      نتائج الذكاء الاصطناعي (بدون مربعات)
                    </Button>
                  </div>

                  <div className={`space-y-3 sm:space-y-6 pb-10 ${activeTab === 'answers' ? 'block' : 'hidden'} md:${activeTab === 'answers' ? 'block' : 'hidden'}`}>
                    {questions.map((question) => (
                      <Card key={question.id} className="overflow-hidden border-2 hover:border-primary/20 transition-colors shadow-sm rounded-lg sm:rounded-xl">
                        <div className="bg-slate-50 border-b p-2 sm:p-3 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className="bg-primary h-6 w-6 sm:h-7 sm:w-7 flex items-center justify-center rounded-md sm:rounded-lg p-0 text-[10px] sm:text-xs font-bold ring-2 ring-primary/20">{question.index}</Badge>
                            <span className="font-bold text-xs sm:text-sm text-slate-700">سؤال {question.index}</span>
                          </div>

                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-primary hover:bg-primary/5 transition-transform duration-200"
                              onClick={() => toggleQuestionExpansion(question.id)}
                            >
                              {expandedQuestions[question.id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </Button>
                            <Separator orientation="vertical" className="h-3 mx-1" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-slate-400 hover:text-primary hover:bg-primary/5"
                              onClick={() => {
                                toast.info(`السؤال ${question.index} محدد في المعاينة`);
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </Button>
                            <Separator orientation="vertical" className="h-3 mx-1" />
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteQuestion(question.id)}
                              className="h-7 w-7 p-0 text-slate-300 hover:text-destructive hover:bg-destructive/5"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {expandedQuestions[question.id] !== false && (
                          <CardContent className="p-3 sm:p-5 space-y-4 animate-in fade-in slide-in-from-top-1 duration-200">

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                              {/* اختيار نوع السؤال */}
                              <div className="space-y-1.5">
                                <Label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">نوع السؤال</Label>
                                <Select
                                  value={question.type}
                                  onValueChange={(value: QuestionType) => updateQuestionType(question.id, value)}
                                >
                                  <SelectTrigger className="h-8 sm:h-10 bg-slate-50 border-slate-200 font-semibold text-xs sm:text-sm">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="mcq">متعدد الاختيارات</SelectItem>
                                    <SelectItem value="true_false">صح/خطأ</SelectItem>
                                    <SelectItem value="essay">مقالي</SelectItem>
                                    <SelectItem value="complete">أكمل</SelectItem>
                                    <SelectItem value="matching">توصيل</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>

                              {/* الدرجات - تظهر فقط لغير المقالي */}
                              {question.type !== "essay" && (
                                <div className="space-y-1.5">
                                  <Label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">الدرجة</Label>
                                  <div className="flex items-center gap-2">
                                    <div className="relative flex-1">
                                      <Input
                                        type="text"
                                        inputMode="decimal"
                                        className="h-8 sm:h-10 text-center font-bold bg-slate-50 border-slate-200 focus:border-primary pr-7 text-xs sm:text-sm"
                                        value={pointsInputMap[question.id] ?? String(question.points ?? 1)}
                                        onChange={(e) => {
                                          const raw = e.target.value.replace(/[^0-9.]/g, '');
                                          const parts = raw.split('.');
                                          const sanitized = parts.length > 2 ? parts[0] + '.' + parts.slice(1).join('') : raw;
                                          setPointsInputMap(prev => ({ ...prev, [question.id]: sanitized }));
                                          const val = parseFloat(sanitized);
                                          if (!isNaN(val)) {
                                            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, points: val } : q));
                                          }
                                        }}
                                        onBlur={(e) => {
                                          const val = parseFloat(e.target.value);
                                          const finalVal = isNaN(val) || val <= 0 ? 1 : val;
                                          setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, points: finalVal } : q));
                                          setPointsInputMap(prev => ({ ...prev, [question.id]: String(finalVal) }));
                                        }}
                                      />
                                      <BarChart3 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      {[0.5, 1, 2].map(pts => (
                                        <Button
                                          key={pts}
                                          type="button"
                                          variant={question.points === pts ? "default" : "secondary"}
                                          size="sm"
                                          className={`h-8 w-7 sm:w-8 p-0 text-[10px] font-bold ${question.points === pts ? "" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                                          onClick={() => {
                                            setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, points: pts } : q));
                                            setPointsInputMap(prev => ({ ...prev, [question.id]: String(pts) }));
                                          }}
                                        >
                                          {pts}
                                        </Button>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}

                            </div>

                            {/* إدخال الإجابة الصحيحة */}
                            <div className="pt-1">
                              <Label className="text-[10px] sm:text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">الإجابة الصحيحة</Label>

                              {question.type === "mcq" && (
                                <div className="flex flex-wrap gap-1.5 sm:gap-2 justify-center sm:justify-start">
                                  {getLabels(examLanguage, question.mcqOptionCount || 4).map((label) => (
                                    <Button
                                      key={label}
                                      type="button"
                                      variant={question.answer === label ? "default" : "outline"}
                                      className={`h-9 min-w-[38px] sm:h-11 sm:min-w-[50px] flex-1 sm:flex-none font-bold text-sm sm:text-lg rounded-lg sm:rounded-xl shadow-sm transition-all ${question.answer === label
                                        ? 'bg-primary ring-2 sm:ring-4 ring-primary/10'
                                        : 'hover:bg-slate-50 hover:border-primary/30'
                                        }`}
                                      onClick={() => updateQuestionAnswer(question.id, label)}
                                    >
                                      {label}
                                    </Button>
                                  ))}
                                </div>
                              )}

                              {question.type === "true_false" && (
                                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                                  <Button
                                    type="button"
                                    variant={question.answer === "FALSE" ? "default" : "outline"}
                                    className={`h-9 sm:h-11 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl gap-1.5 ${question.answer === "FALSE" ? 'bg-rose-600 ring-2 sm:ring-4 ring-rose-100 border-rose-600' : 'text-rose-600 border-rose-200 hover:bg-rose-50'
                                      }`}
                                    onClick={() => updateQuestionAnswer(question.id, "FALSE")}
                                  >
                                    <XCircle className="w-4 h-4 sm:w-5 sm:h-5" /> خطأ
                                  </Button>
                                  <Button
                                    type="button"
                                    variant={question.answer === "TRUE" ? "default" : "outline"}
                                    className={`h-9 sm:h-11 text-xs sm:text-sm font-bold rounded-lg sm:rounded-xl gap-1.5 ${question.answer === "TRUE" ? 'bg-emerald-600 ring-2 sm:ring-4 ring-emerald-100 border-emerald-600' : 'text-emerald-600 border-emerald-200 hover:bg-emerald-50'
                                      }`}
                                    onClick={() => updateQuestionAnswer(question.id, "TRUE")}
                                  >
                                    <Check className="w-4 h-4 sm:w-5 sm:h-5" /> صح
                                  </Button>
                                </div>
                              )}

                              {(question.type === "essay" || question.type === "complete" || question.type === "matching") && (
                                <div className="space-y-4">
                                  <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200">
                                    <Label className="text-xs font-bold text-slate-700 whitespace-nowrap">
                                      كم إجابة في هذا المربع؟
                                    </Label>
                                    <Input
                                      type="number"
                                      min="1"
                                      max="20"
                                      className="h-9 w-24 text-center font-bold"
                                      value={(question.essaySubQuestions || []).length || ""}
                                      onChange={(e) => {
                                        const count = parseInt(e.target.value);
                                        if (!isNaN(count) && count >= 0) {
                                          updateEssaySubQuestionsCount(question.id, count);
                                        }
                                      }}
                                      placeholder="مثلاً 1"
                                    />
                                  </div>

                                  {(question.essaySubQuestions || []).length > 0 ? (
                                    <div className="space-y-4 pt-2">
                                      {(question.essaySubQuestions || []).map((sub, idx) => (
                                        <div key={sub.id} className="grid grid-cols-12 gap-3 items-start border-b border-slate-100 pb-4 last:border-0">
                                          <div className="col-span-1 pt-2">
                                            <Badge variant="outline" className="h-6 w-6 p-0 flex items-center justify-center rounded-full text-[10px] font-bold bg-slate-50">{idx + 1}</Badge>
                                          </div>
                                          <div className="col-span-8">
                                            <Label className="text-[10px] text-slate-400 mb-1 block">إجابة السؤال النموذجية</Label>
                                            <Textarea
                                              placeholder="اكتب الإجابة هنا ليتم مقارنتها آلياً..."
                                              value={sub.answer || ""}
                                              onChange={(e) => updateEssaySubQuestionData(question.id, sub.id, 'answer', e.target.value || null)}
                                              className="min-h-[80px] text-xs resize-none bg-slate-50/50 focus:bg-white transition-colors"
                                            />
                                          </div>
                                          <div className="col-span-3">
                                            <Label className="text-[10px] text-slate-400 mb-1 block">الدرجة</Label>
                                            <div className="relative">
                                              <Input
                                                type="number"
                                                placeholder="الدرجة"
                                                value={sub.points}
                                                onChange={(e) => updateEssaySubQuestionData(question.id, sub.id, 'points', parseFloat(e.target.value) || 0)}
                                                className="h-10 text-center font-bold text-xs pr-6 bg-slate-50/50"
                                              />
                                              <BarChart3 className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-400" />
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      <Label className="text-[10px] text-slate-400 mb-1 block">إجابة السؤال النموذجية (للمقارنة الآلية)</Label>
                                      <Textarea
                                        placeholder="اكتب الإجابة هنا..."
                                        value={question.answer || ""}
                                        onChange={(e) => setQuestions(prev => prev.map(q => q.id === question.id ? { ...q, answer: e.target.value } : q))}
                                        className="min-h-[80px] text-xs resize-none bg-slate-50/50 focus:bg-white transition-colors"
                                      />
                                      <div className="bg-blue-50 border border-blue-100 p-2 rounded-md flex items-start gap-2">
                                        <AlertCircle className="w-3.5 h-3.5 text-blue-500 mt-0.5" />
                                        <p className="text-[10px] text-blue-700">
                                          سيتم استخدام موديل TrOCR للتعرف على خط يد الطالب ومقارينته بهذه الإجابة آلياً.
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              )}

                            </div>
                          </CardContent>
                        )}
                      </Card>
                    ))}

                    {questions.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-20 text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed mx-2 sm:mx-0">
                        <PlusCircleIcon className="w-12 h-12 sm:w-16 sm:h-16 mb-4 opacity-20" />
                        <p className="font-bold text-sm sm:text-base">لا يوجد أسئلة مضافة</p>
                      </div>
                    )}
                  </div>

                  {/* AI Tab Content */}
                  <div className={`space-y-4 pb-10 ${activeTab === 'ai' ? 'block' : 'hidden'} md:${activeTab === 'ai' ? 'block' : 'hidden'}`}>
                    <div className="bg-purple-50/50 p-4 rounded-xl border border-purple-100 mb-2">
                      <div className="flex items-center gap-2 text-purple-700 font-bold mb-1">
                        <Sparkles className="w-5 h-5 font-bold" />
                        <span>تحليل الأمتحان باستخدام الذكاء الاصطناعي</span>
                      </div>
                      <p className="text-xs text-slate-600">
                        بناءً على صورتك المرفوعة، قمنا باستخراج الأسئلة والإجابات النموذجية تلقائياً لتسهيل العملية عليك.
                      </p>
                    </div>

                    {isAnalyzing ? (
                      <div className="flex flex-col items-center justify-center py-24 gap-4 bg-white rounded-2xl border-2 border-dashed border-slate-200 shadow-inner">
                        <div className="relative">
                          <div className="absolute inset-0 animate-ping rounded-full bg-primary/20 scale-150"></div>
                          <Loader2 className="w-12 h-12 text-primary animate-spin relative" />
                        </div>
                        <div className="text-center">
                          <p className="text-slate-800 font-bold text-lg">جاري فحص ورقة الامتحان...</p>
                          <p className="text-slate-400 text-sm mt-1">يستخدم الذكاء الاصطناعي لاستخراج الأسئلة وتحديد الأنواع</p>
                        </div>
                      </div>
                    ) : aiQuestions.length === 0 ? (
                      <div className="text-center py-24 bg-white rounded-2xl border-2 border-dashed border-slate-200">
                        <Wand2 className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium">لم يتم إجراء تحليل تلقائي بعد.</p>
                        <Button
                          variant="outline"
                          className="mt-4 border-primary text-primary hover:bg-primary/5"
                          onClick={handleAiAnalysis}
                        >
                          ابدأ التحليل الآن
                        </Button>
                      </div>
                    ) : (
                      aiQuestions.map((q) => (
                        <Card key={q.id} className="overflow-hidden border-0 shadow-lg rounded-2xl bg-white ring-1 ring-slate-100">
                          <div className="bg-slate-50/80 border-b p-4 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <Badge className="bg-slate-800 h-8 w-8 flex items-center justify-center rounded-lg text-sm font-bold shadow-sm">
                                {q.index}
                              </Badge>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-800 text-sm sm:text-base">سؤال {q.index}</span>
                                <div className="flex gap-1.5 mt-0.5">
                                  <Badge variant="secondary" className="text-[10px] sm:text-xs font-medium px-2 py-0 bg-white border shadow-sm">
                                    {q.type === 'mcq' ? 'اختياري (MCQ)' :
                                      q.type === 'true_false' ? 'صح أو خطأ' :
                                        q.type === 'essay' ? 'سؤال مقالي' :
                                          q.type === 'complete' ? 'أكمل الفراغ' : 'سؤال توصيل'}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3 bg-white p-1.5 px-3 rounded-xl border shadow-sm">
                              <Label className="text-xs font-bold text-slate-500">الدرجة:</Label>
                              <Input
                                type="number"
                                value={q.points}
                                onChange={(e) => updateAiQuestion(q.id, 'points', parseFloat(e.target.value))}
                                className="w-12 h-7 sm:w-16 sm:h-8 text-center font-bold border-0 focus-visible:ring-0 bg-slate-50 rounded"
                              />
                            </div>
                          </div>

                          <div className="p-4 sm:p-5 space-y-5">
                            <div className="space-y-2">
                              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                                <FileText className="w-3.5 h-3.5" />
                                نص السؤال المكتشف
                              </Label>
                              <Textarea
                                value={q.text}
                                onChange={(e) => updateAiQuestion(q.id, 'text', e.target.value)}
                                className="text-sm sm:text-base font-semibold text-slate-700 bg-slate-50/50 p-4 rounded-xl border border-slate-100 leading-relaxed min-h-[80px] focus:bg-white transition-all resize-none shadow-inner"
                              />
                            </div>

                            <div className="grid grid-cols-1 gap-5">
                              <div className="space-y-2 group">
                                <Label className="text-[10px] font-bold text-purple-600 flex items-center gap-1.5 uppercase tracking-widest">
                                  <Sparkles className="w-3.5 h-3.5" />
                                  إجابة الذكاء الاصطناعي النموذجية
                                </Label>
                                <div className="text-xs sm:text-sm text-slate-600 bg-gradient-to-br from-purple-50/30 to-white p-4 rounded-xl border border-purple-100 italic shadow-sm group-hover:shadow-md transition-shadow duration-300">
                                  {q.geminiAnswer}
                                </div>
                              </div>

                              <div className="space-y-2">
                                <Label className="text-[10px] font-bold text-slate-600 flex items-center gap-1.5 uppercase tracking-widest">
                                  <Settings className="w-3.5 h-3.5" />
                                  الإجابة النموذجية الخاصة بك
                                </Label>
                                <Textarea
                                  placeholder="أضف إجابتك الخاصة هنا إذا أردت استبدال إجابة الذكاء الاصطناعي..."
                                  value={q.teacherAnswer}
                                  onChange={(e) => updateAiQuestion(q.id, 'teacherAnswer', e.target.value)}
                                  className="text-xs sm:text-sm min-h-[80px] sm:min-h-[100px] rounded-xl bg-slate-50 border-slate-100 focus:bg-white focus:ring-2 focus:ring-purple-400/20 focus:border-purple-300 transition-all resize-none shadow-inner"
                                />
                                <p className="text-[10px] text-slate-400 italic font-medium pr-1">
                                  * سيتم استخدام إجابة الذكاء الاصطناعي تلقائياً إذا تركت هذا الحقل فارغاً.
                                </p>
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))
                    )}
                  </div>
                </div>

                {/* القسم الأيسر: صورة الامتحان للمعاينة */}
                <div className={`m-0 flex-1 md:basis-1/2 bg-slate-900/5 border-l border-slate-200 overflow-hidden flex-col ${activeTab === 'paper' ? 'flex' : 'hidden'} md:flex`}>
                  <div className="p-2 sm:p-3 bg-white/80 border-b flex items-center justify-between shrink-0">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-3.5 h-3.5 text-primary" />
                      <span className="text-xs sm:text-sm font-bold">معاينة الورقة</span>
                    </div>
                    <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary px-1.5 h-5">س{(activeTab === 'ai' ? aiQuestions : questions).length}</Badge>
                  </div>

                  <div className="flex-1 overflow-auto bg-slate-200/20 p-2 sm:p-4">
                    <div className="relative mx-auto bg-white mb-20 shadow-xl"
                      style={{
                        width: pdfDimensions ? `min(100%, ${canvasWidth * 0.55}px)` : '100%',
                        minHeight: `100px`
                      }}>
                      {stitchedImageUrl && (
                        <img
                          src={stitchedImageUrl}
                          alt="Exam Preview"
                          className="w-full h-auto block"
                        />
                      )}

                      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                        {questions.map((question) => {
                          const currentContainerWidth = pdfDimensions ? Math.min(window.innerWidth * 0.85, canvasWidth * 0.55) : canvasWidth;
                          const previewScale = pdfDimensions ? currentContainerWidth / canvasWidth : 0.55;

                          return (
                            <div key={`preview-${question.id}`}>
                              {question.options.map((option) => {
                                const topPos = ((option.page - 1) * (canvasHeight * previewScale + 0)) + (option.y * previewScale);
                                return (
                                  <div
                                    key={`preview-opt-${option.id}`}
                                    className={`absolute border-2 ${question.type === "mcq" ? "border-blue-500 bg-blue-500/10" :
                                      question.type === "true_false" ? "border-green-500 bg-green-500/10" :
                                        "border-purple-500 bg-purple-500/10"
                                      }`}
                                    style={{
                                      left: `${option.x * previewScale}px`,
                                      top: `${topPos}px`,
                                      width: `${option.width * previewScale}px`,
                                      height: `${option.height * previewScale}px`,
                                    }}
                                  >
                                    <div className="absolute -top-3 right-0 bg-black/70 text-white text-[7px] px-0.5 rounded leading-none">
                                      س{question.index}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>


            <DialogFooter className="p-2 sm:p-4 bg-white border-t shrink-0 flex flex-row items-center justify-between gap-2 sm:gap-4">
              <div className="hidden sm:block text-sm text-slate-500">
                إجمالي الأسئلة: <span className="font-bold text-slate-800">{(activeTab === 'ai' ? aiQuestions : questions).length}</span>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                <Button type="button" variant="outline" onClick={() => setAnswerDialogOpen(false)} className="flex-1 sm:flex-none h-9 sm:h-11 px-2 sm:px-8 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-sm">
                  إغلاق
                </Button>
                <Button
                  type="button"
                  onClick={handleSaveTemplate}
                  disabled={!selectedFile || (activeTab === 'ai' ? aiQuestions.length === 0 : questions.length === 0) || isLoading}
                  className="flex-1 sm:flex-none h-9 sm:h-11 px-2 sm:px-10 rounded-lg sm:rounded-xl font-bold text-[10px] sm:text-sm bg-primary shadow-lg shadow-primary/20"
                >
                  {isLoading ? <Loader2 className="w-3.5 h-3.5 sm:w-5 sm:h-5 animate-spin" /> : <Save className="w-3.5 h-3.5 sm:w-5 sm:h-5 ml-1 sm:ml-2" />}
                  {isLoading ? "جاري الحفظ..." : "حفظ النموذج"}
                </Button>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* نافذة النجاح لاختبار بدون باركود */}
        <Dialog open={successDialogOpen} onOpenChange={setSuccessDialogOpen}>
          <DialogContent className="sm:max-w-md text-center border-0 shadow-2xl p-0 rounded-[2.5rem] bg-white overflow-hidden transition-all">
            <div className="bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-10 text-white relative">
              <div className="absolute top-4 right-4">
                <DialogClose className="rounded-full p-2 hover:bg-white/10 transition-colors">
                  <X className="h-5 w-5 text-white/70" />
                </DialogClose>
              </div>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-white/20 mb-6 backdrop-blur-md rotate-12 transition-transform hover:rotate-0">
                <Check className="h-10 w-10 text-white" />
              </div>
              <h3 className="text-3xl font-black mb-2 tracking-tight">تم الحفظ بنجاح!</h3>
            </div>

            <div className="p-10 space-y-8">
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-slate-400 font-bold text-xs uppercase tracking-[0.2em]">
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                  رقم الاختبار الخاص بك
                  <Sparkles className="h-3 w-3 text-emerald-500" />
                </div>

                <div className="bg-slate-50 border-2 border-slate-100 rounded-[2rem] p-8 relative group transition-all hover:border-emerald-200 hover:bg-emerald-50/30">
                  <span className="text-6xl font-black text-emerald-600 tracking-tighter tabular-nums drop-shadow-sm">
                    {savedExamId}
                  </span>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(savedExamId?.toString() || "");
                      toast.success("تم نسخ الرقم بنجاح ✅");
                    }}
                    className="absolute -top-3 -right-3 p-3 rounded-2xl bg-white shadow-xl border border-slate-100 text-emerald-500 hover:bg-emerald-500 hover:text-white transition-all active:scale-90 shadow-emerald-500/10"
                    title="نسخ الرقم"
                  >
                    <Save className="h-5 w-5" />
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  onClick={() => {
                    setSuccessDialogOpen(false);
                    navigate(`/grading?examId=${savedExamId}`);
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black h-16 text-xl rounded-2xl shadow-2xl shadow-emerald-600/20 transition-all active:scale-[0.98] flex items-center justify-center gap-3 group"
                >
                  بدء التصحيح الآن
                  <ArrowRight className="h-6 w-6 transition-transform group-hover:translate-x-[-5px]" />
                </Button>
              </div>
            </div>
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
    </MainLayout >
  );
}
