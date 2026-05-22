import React from 'react';

export const PremiumLevelProgressCard = ({ label, percentage, count, scoreRange, gradientClass, onClick }: any) => {
    // Determine color theme based on label
    const getTheme = (label: string) => {
        if (label.includes("ممتاز")) return { color: "#10b981", bg: "rgba(16, 185, 129, 0.1)" };
        if (label.includes("جيد جداً")) return { color: "#14b8a6", bg: "rgba(20, 184, 166, 0.1)" };
        if (label.includes("جيد")) return { color: "#3b82f6", bg: "rgba(59, 130, 246, 0.1)" };
        if (label.includes("مقبول")) return { color: "#f59e0b", bg: "rgba(245, 158, 11, 0.1)" };
        return { color: "#f43f5e", bg: "rgba(244, 63, 94, 0.1)" };
    };

    const theme = getTheme(label);
    const radius = 36;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percentage / 100) * circumference;

    return (
        <div 
            className="flex flex-col items-center bg-white border border-slate-100 p-6 rounded-[2rem] shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden cursor-pointer relative active:scale-95"
            onClick={onClick}
        >
            <div className="relative mb-4">
                {/* Circular Progress SVG */}
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        className="stroke-slate-100"
                        strokeWidth="8"
                        fill="transparent"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke={theme.color}
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                {/* Percentage Text in Center */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-lg font-black text-slate-800">{percentage.toFixed(0)}%</span>
                </div>
            </div>

            <div className="text-center space-y-1">
                <h5 className="text-sm font-black text-slate-800">{label}</h5>
                <div className="flex items-center justify-center gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400">{count} طلاب</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span className="text-[10px] font-medium text-slate-400" dir="ltr">{scoreRange}</span>
                </div>
            </div>
            
            {/* Subtle Gradient Accent */}
            <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${gradientClass} opacity-20`} />
        </div>
    );
};

export const PremiumMetricCard = ({ title, value, unit, icon, description, onClick }: any) => {
    // Determine color theme based on title
    const getTheme = (title: string) => {
        if (title.includes("أعلى")) return "from-emerald-600/20 to-emerald-500/5 text-emerald-700 border-emerald-200";
        if (title.includes("أقل")) return "from-rose-600/20 to-rose-500/5 text-rose-700 border-rose-200";
        return "from-blue-600/20 to-blue-500/5 text-blue-700 border-blue-200";
    };

    const themeClass = getTheme(title);

    return (
        <div 
            className={`p-5 bg-white border-2 border-slate-50 rounded-3xl shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col gap-4 group relative overflow-hidden active:scale-95 cursor-pointer`}
            onClick={onClick}
        >
            {/* Soft decorative background element */}
            <div className={`absolute -right-6 -top-6 w-20 h-20 bg-gradient-to-br ${themeClass.split(' ').slice(0, 2).join(' ')} rounded-full blur-2xl opacity-60`} />
            
            <div className="flex justify-between items-start relative z-10">
                <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-slate-100 ${themeClass.split(' ')[2]}`}>
                    {icon}
                </div>
                <span className="text-xs font-black text-slate-900 tracking-tight text-left">
                    {title}
                </span>
            </div>
            
            <div className="relative z-10 space-y-1">
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-xs font-black text-slate-500">
                            {unit}
                        </span>
                    )}
                </div>
                {description && (
                    <div className="mt-3 flex items-center gap-2 pt-3 border-t border-slate-50">
                         <div className={`w-1.5 h-1.5 rounded-full ${themeClass.split(' ')[2].replace('text', 'bg')} opacity-50`} />
                         <p className="text-[10px] text-slate-600 font-bold leading-relaxed">
                            {description}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export const GradeRangeHeatStrip = ({ data }: any) => {
    const total = data.reduce((acc: number, item: any) => acc + item.count, 0) || 1;
    
    return (
        <div className="w-full space-y-4">
            <div className="text-right">
                <h4 className="text-xs font-black text-slate-500 flex items-center gap-2">
                    توزيع الأداء العام للفصل
                </h4>
            </div>
            
            <div className="w-full h-3 rounded-full flex overflow-hidden bg-slate-100" dir="rtl">
                {data.map((item: any, i: number) => {
                    const percentage = (item.count / total) * 100;
                    if (percentage === 0) return null;
                    return (
                        <div 
                            key={i}
                            className={`h-full bg-gradient-to-r ${item.gradient} transition-all duration-500 relative group`}
                            style={{ width: `${percentage}%` }}
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-white/20 transition-opacity flex items-center justify-center">
                                <span className="text-[8px] font-bold text-white">{item.label}</span>
                            </div>
                        </div>
                    );
                })}
            </div>
            
            <div className="flex justify-center gap-4 flex-wrap">
                {data.map((item: any, i: number) => (
                    <div key={i} className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${item.gradient}`} />
                        <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap">{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
