import * as React from "react";
import { useState, useEffect } from "react";
import { Target, GraduationCap, Loader2, X, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetExams } from "@/hooks/use-exams";
import { useGetExamGoals, useSaveExamGoals, useCreateExamGoal, useDeleteExamGoal } from "@/hooks/use-goals";
import { useGetClassReport } from "@/hooks/use-analysis";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { HelpFab } from "@/components/ui/help-fab";

const scrollStyle = `
  .small-scroll::-webkit-scrollbar { width: 4px; height: 4px; }
  .small-scroll::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
  .small-scroll { scrollbar-width: thin; scrollbar-color: #cbd5e1 transparent; }
`;

export default function Goals() {
    return (
        <>
            <style>{scrollStyle}</style>
            <GoalsContent />
        </>
    );
}

function GoalsContent() {
    const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
    const [questionGoals, setQuestionGoals] = useState<Record<number, { selectedGoals: string[]; type: string }>>({});
    const [predefinedGoals, setPredefinedGoals] = useState<string[]>([]);
    const [goalIds, setGoalIds] = useState<Record<string, number>>({});
    const [newGoalText, setNewGoalText] = useState("");

    const { data: exams, isLoading: examsLoading } = useGetExams();
    const { data: existingGoals, isLoading: goalsLoading } = useGetExamGoals(selectedExamId ? parseInt(selectedExamId) : null);
    const { data: classReport, isLoading: classReportLoading } = useGetClassReport(selectedExamId ? parseInt(selectedExamId) : null);
    const saveGoalsMutation = useSaveExamGoals();
    const createGoalMutation = useCreateExamGoal();
    const deleteGoalMutation = useDeleteExamGoal(selectedExamId ? parseInt(selectedExamId) : null);

    useEffect(() => {
        if (!selectedExamId) {
            setQuestionGoals({});
            setPredefinedGoals([]);
            setGoalIds({});
            return;
        }

        if (existingGoals && classReport?.questionAnalysis) {
            const initialGoals: Record<number, { selectedGoals: string[]; type: string }> = {};
            const goalsList = new Set<string>();
            const idsMap: Record<string, number> = {};

            existingGoals.forEach((g: any) => {
                const trimmedText = (g.goalText || "").trim();
                if (trimmedText) {
                    goalsList.add(trimmedText);
                    if (g.id) idsMap[trimmedText] = g.id;

                    const parts = (g.questionNumbers || "").split(',').filter((n: string) => n);
                    parts.forEach((p: string) => {
                        const [numStr] = p.split(':');
                        const num = parseInt(numStr);
                        if (!isNaN(num)) {
                            if (!initialGoals[num]) initialGoals[num] = { selectedGoals: [], type: 'mcq' };
                            if (!initialGoals[num].selectedGoals.includes(trimmedText)) {
                                initialGoals[num].selectedGoals.push(trimmedText);
                            }
                        }
                    });
                }
            });

            classReport.questionAnalysis.forEach((q: any) => {
                const rawType = (q.questionType || '').toLowerCase();
                const isTF = rawType.includes('true') || rawType.includes('false') || rawType === 'tf' || rawType === 'true_false' || (q.questionDisplay || '').includes('صح');
                const qType = isTF ? 'true_false' : 'mcq';

                if (!initialGoals[q.questionNumber]) {
                    initialGoals[q.questionNumber] = { selectedGoals: [], type: qType };
                } else {
                    initialGoals[q.questionNumber].type = qType;
                }
            });

            setPredefinedGoals(Array.from(goalsList));
            setGoalIds(idsMap);
            setQuestionGoals(initialGoals);
        }
    }, [existingGoals, classReport, selectedExamId]);

    const syncSpecificQuestionToDB = (currentState: Record<number, { selectedGoals: string[]; type: string }>) => {
        if (!selectedExamId) return;
        const goalsMap: Record<string, string[]> = {};
        predefinedGoals.forEach(goal => { goalsMap[goal] = []; });

        Object.entries(currentState).forEach(([num, data]) => {
            data.selectedGoals.forEach(goalText => {
                const trimmed = goalText.trim();
                if (trimmed && goalsMap[trimmed]) {
                    goalsMap[trimmed].push(`${num}:${data.type}`);
                }
            });
        });

        const goalsToSave = Object.entries(goalsMap).map(([text, questions]) => ({
            id: goalIds[text],
            examId: parseInt(selectedExamId),
            goalText: text,
            questionNumbers: questions.join(',')
        }));

        saveGoalsMutation.mutate({
            examId: parseInt(selectedExamId),
            goals: goalsToSave,
            isPartial: true
        });
    };

    const toggleGoalForQuestion = (qNum: number, goalText: string) => {
        setQuestionGoals(prev => {
            const current = prev[qNum]?.selectedGoals || [];
            const isSelected = current.includes(goalText);
            const newList = isSelected 
                ? current.filter(g => g !== goalText)
                : [...current, goalText];
            
            const newState = {
                ...prev,
                [qNum]: { ...prev[qNum], selectedGoals: newList }
            };
            
            // Auto-save the change to database immediately as requested
            setTimeout(() => syncSpecificQuestionToDB(newState), 0);
            
            return newState;
        });
    };

    const addPredefinedGoal = () => {
        const trimmed = newGoalText.trim();
        if (!trimmed || !selectedExamId) return;

        if (predefinedGoals.includes(trimmed)) {
            toast.error("هذا الهدف موجود بالفعل");
            return;
        }

        createGoalMutation.mutate({
            examId: parseInt(selectedExamId),
            goalText: trimmed,
            questionNumbers: ""
        }, {
            onSuccess: () => {
                setNewGoalText("");
            }
        });
    };

    const removePredefinedGoal = (goal: string) => {
        const goalId = goalIds[goal];
        if (!goalId) {
            setPredefinedGoals(prev => prev.filter(g => g !== goal));
            return;
        }

        deleteGoalMutation.mutate(goalId);
    };

    return (
        <MainLayout>
            <div className="flex flex-1 flex-col gap-6 p-6" dir="rtl">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">الأهداف التعليمية</h1>
                        <p className="text-muted-foreground mt-2">
                            حدد الأهداف الأساسية والثانوية لكل سؤال في الاختبار
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="w-64">
                            <Select value={selectedExamId || ""} onValueChange={setSelectedExamId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="اختر الاختبار..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {examsLoading ? (
                                        <div className="p-2 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            جاري التحميل...
                                        </div>
                                    ) : (
                                        exams?.map((exam: any) => (
                                            <SelectItem key={exam.id} value={exam.id.toString()}>
                                                {exam.title} - {exam.subject}
                                            </SelectItem>
                                        ))
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>

                {selectedExamId && (
                    <div className="bg-card p-6 rounded-2xl shadow-sm border space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                        <div className="flex items-center justify-between border-b pb-4 mb-4">
                            <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                                <Target className="h-5 w-5 text-primary" />
                                قائمة الأهداف التعليمية المتوفرة
                            </h2>
                            <div className="flex items-center gap-4">
                                <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                                    {predefinedGoals.length} أهداف
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <Input
                                placeholder="اكتب مهارة أو هدفاً تعليمياً للبدء..."
                                value={newGoalText}
                                onChange={(e) => setNewGoalText(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && addPredefinedGoal()}
                                className="flex-1 bg-muted border focus-visible:ring-primary h-11"
                            />
                            <Button onClick={addPredefinedGoal} className="gap-2 h-11 px-6 shadow-sm hover:shadow-md transition-all">
                                <Plus className="h-4 w-4" />
                                إضافة هدف
                            </Button>
                        </div>

                        {predefinedGoals.length > 0 ? (
                            <div className="flex flex-wrap gap-2 pt-2">
                                {predefinedGoals.map((goal: string, index: number) => (
                                    <div key={index} className="flex items-center gap-2 bg-accent/30 text-accent-foreground border border-accent/20 pl-2 pr-3 py-1.5 rounded-xl text-sm font-medium animate-in zoom-in-95 duration-200">
                                        <span>{goal}</span>
                                        <button
                                            onClick={() => removePredefinedGoal(goal)}
                                            className="hover:bg-primary/10 p-1 rounded-md transition-colors text-primary/60 hover:text-destructive"
                                            title="حذف الهدف"
                                        >
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 bg-muted/30 rounded-xl border border-dashed">
                                <p className="text-sm text-muted-foreground italic">
                                    لا توجد أهداف مضافة بعد. أضف بعض الأهداف أولاً لتتمكن من اختيارها للأسئلة أدناه.
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {selectedExamId && classReport?.questionAnalysis && classReport.questionAnalysis.length > 0 && (
                    <div className="flex items-center justify-between px-2 pt-2">
                        <h2 className="text-lg font-bold flex items-center gap-2 text-foreground">
                            <GraduationCap className="h-5 w-5 text-primary" />
                            تحديد الأهداف للأسئلة
                        </h2>
                    </div>
                )}

                {!selectedExamId ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center border-2 border-dashed rounded-xl bg-muted/30">
                        <Target className="h-12 w-12 text-muted-foreground/30 mb-4" />
                        <h3 className="font-medium text-muted-foreground text-lg">يرجى اختيار اختبار أولاً للبدء في تحديد الأهداف</h3>
                    </div>
                ) : (goalsLoading || classReportLoading) && Object.keys(questionGoals).length === 0 ? (
                    <div className="grid gap-6">
                        {[1, 2, 3, 4].map((i: number) => (
                            <Skeleton key={i} className="h-20 w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <div className="bg-card rounded-2xl shadow-sm border overflow-hidden">
                        <div className="overflow-x-auto small-scroll pb-2">
                            <table className="w-full text-right border-collapse min-w-[600px]">
                                <thead className="bg-muted border-b">
                                    <tr>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground text-center border-l w-24">رقم السؤال</th>
                                        <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-muted-foreground border-l">الأهداف المرتبطة (أساسي وثانوي)</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {classReport?.questionAnalysis?.map((q: any) => {
                                        const selected = questionGoals[q.questionNumber]?.selectedGoals || [];
                                        const available = predefinedGoals.filter((g: string) => !selected.includes(g));

                                        return (
                                            <tr key={q.questionNumber} className="border-b transition-colors hover:bg-accent/50 group">
                                                <td className="px-6 py-4 text-center font-bold text-primary border-l">
                                                    {q.questionDisplay || `س ${q.questionNumber}`}
                                                </td>

                                                <td className="px-6 py-4 border-l">
                                                    <div className="flex flex-wrap gap-2 items-center">
                                                        {selected.map((goal: string, idx: number) => (
                                                            <div key={idx} 
                                                                className={cn(
                                                                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-bold border transition-all shadow-sm",
                                                                    idx === 0 
                                                                        ? "bg-primary/10 border-primary/30 text-primary shadow-primary/10 active:scale-95" 
                                                                        : "bg-muted border-muted-foreground/20 text-muted-foreground active:scale-95"
                                                                )}
                                                            >
                                                                {idx === 0 && <Target className="h-3.5 w-3.5 animate-pulse" />}
                                                                <span>{goal}</span>
                                                                <button 
                                                                    onClick={(e: React.MouseEvent) => { e.stopPropagation(); toggleGoalForQuestion(q.questionNumber, goal); }}
                                                                    className="hover:bg-primary/20 p-0.5 rounded-full transition-colors"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="outline" size="sm" className="h-9 gap-1.5 text-xs border-dashed border-2 hover:border-primary hover:text-primary transition-all rounded-lg">
                                                                    <Plus className="h-3.5 w-3.5" />
                                                                    إضافة هدف
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="start" className="w-64 max-h-[300px] overflow-y-auto">
                                                                {available.length > 0 ? available.map((goal: string, i: number) => (
                                                                    <DropdownMenuItem key={i} onClick={() => toggleGoalForQuestion(q.questionNumber, goal)} className="cursor-pointer">
                                                                        <Plus className="h-3 w-3 ml-2 opacity-50" />
                                                                        {goal}
                                                                    </DropdownMenuItem>
                                                                )) : <div className="p-4 text-xs text-muted-foreground text-center italic">لا توجد أهداف إضافية متوفرة. أضف أهدافاً جديدة في القائمة أعلاه أولاً.</div>}
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                        </div>
                        {(!classReport?.questionAnalysis || classReport.questionAnalysis.length === 0) && !classReportLoading && (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <GraduationCap className="h-12 w-12 text-muted-foreground/30 mb-4" />
                                <h3 className="font-medium text-muted-foreground text-lg">لم يتم العثور على أسئلة لهذا الاختبار</h3>
                                <p className="text-muted-foreground mt-1">تأكد من رفع أوراق الإجابة وتصحيحها أولاً</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <HelpFab
                title="كيفية إدارة الأهداف التعليمية"
                description="تتيح لك هذه الصفحة ربط أسئلة الاختبار بالأهداف التعليمية والمهارات المستهدفة."
                tooltip="دليل استخدام صفحة الأهداف"
            >
                <div className="space-y-4">
                    <p className="text-muted-foreground">خطوات الاستخدام الأساسية:</p>
                    <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mt-2">
                        <li>اختر الاختبار من القائمة المنسدلة في أعلى الصفحة.</li>
                        <li>قم بإضافة الأهداف التعليمية الجديدة في خانة <strong>"إضافة هدف"</strong>، مثل: <em>"فهم الجمل المعقدة"</em>.</li>
                        <li>في الجدول بالأسفل، انقر على زر <strong>"إضافة هدف"</strong> بجانب كل سؤال لربطه بالأهداف التي أضفتها مسبقاً.</li>
                    </ol>
                    <p className="text-sm border-t pt-2 mt-4 text-primary font-bold">
                        الهدف الأول المضاف يعتبر "الهدف الأساسي" للسؤال، وباقي الأهداف تعتبر أهدافاً ثانوية.
                    </p>
                </div>
            </HelpFab>
        </MainLayout>
    );
}
