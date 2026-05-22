import type { Stats, ExamPaper } from "./types";

export const getHijriYearOnly = (dateStr?: string) => {
    if (!dateStr) return "1445 هـ";
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ar-SA', {
            calendar: 'islamic-umalqura',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return "1445 هـ";
    }
};

export const formatToHijri = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        return new Intl.DateTimeFormat('ar-SA', {
            calendar: 'islamic-umalqura',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        }).format(date);
    } catch (e) {
        return "";
    }
};

export const formatToGregorian = (dateStr?: string) => {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        return date.toLocaleDateString('ar-EG', {
            day: 'numeric',
            month: 'numeric',
            year: 'numeric'
        });
    } catch (e) {
        return "";
    }
};

export const getSemesterName = (dateStr?: string) => {
    if (!dateStr) return "الفصل الأول";
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    if (month >= 9 && month <= 11) return "الفصل الأول";
    if (month === 12 || month <= 2) return "الفصل الثاني";
    if (month >= 3 && month <= 6) return "الفصل الثالث";
    return "الفصل الأول";
};

export const calculateStats = (examPapers: ExamPaper[] | undefined, selectedClassId: string | undefined): Stats => {
    const filtered = examPapers?.filter((p) => {
        const matchesClass = !selectedClassId || selectedClassId === "all" || p.className === selectedClassId;
        const hasScore = p.finalScore !== undefined && p.finalScore !== null;
        return matchesClass && hasScore;
    }) || [];
    
    if (filtered.length === 0) {
        return {
            count: 0,
            max: 0,
            min: 0,
            avg: 0,
            pct: 0,
            sum: 0,
            maxScore: 0,
            levels: {
                excellent: { count: 0, percentage: 0 },
                veryGood: { count: 0, percentage: 0 },
                good: { count: 0, percentage: 0 },
                acceptable: { count: 0, percentage: 0 },
                weak: { count: 0, percentage: 0 }
            },
            criticalCount: 0
        };
    }

    const maxScore = filtered[0]?.totalQuestions || 0;
    const scores = filtered.map((p) => p.finalScore ?? 0);
    const sum = scores.reduce((a, b) => a + b, 0);
    const avg = sum / filtered.length;
    const max = Math.max(...scores);
    const min = Math.min(...scores);
    const pct = maxScore > 0 ? (avg / maxScore) * 100 : 0;

    let excellent = 0;
    let veryGood = 0;
    let good = 0;
    let acceptable = 0;
    let weak = 0;
    let critical = 0;

    filtered.forEach((p) => {
        const score = p.finalScore ?? 0;
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0;
        if (percentage >= 90) excellent++;
        else if (percentage >= 80) veryGood++;
        else if (percentage >= 70) good++;
        else if (percentage >= 50) acceptable++;
        else weak++;
        
        if (percentage < 50) critical++;
    });

    const total = filtered.length;
    return {
        count: total,
        max,
        min,
        avg,
        pct,
        sum,
        maxScore,
        levels: {
            excellent: { count: excellent, percentage: total > 0 ? (excellent / total) * 100 : 0 },
            veryGood: { count: veryGood, percentage: total > 0 ? (veryGood / total) * 100 : 0 },
            good: { count: good, percentage: total > 0 ? (good / total) * 100 : 0 },
            acceptable: { count: acceptable, percentage: total > 0 ? (acceptable / total) * 100 : 0 },
            weak: { count: weak, percentage: total > 0 ? (weak / total) * 100 : 0 }
        },
        criticalCount: critical
    };
};
