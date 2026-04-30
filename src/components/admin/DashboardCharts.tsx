import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
} from 'chart.js';
import { Line, Bar, Doughnut, Pie } from 'react-chartjs-2';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ChartDataPoint } from '@/lib/adminApi';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    Filler
);

interface DashboardChartsProps {
    revenueData: ChartDataPoint[];
    popularPlansData: ChartDataPoint[];
    subscriptionStatusData: ChartDataPoint[];
    examActivityData: ChartDataPoint[];
}

export function DashboardCharts({
    revenueData,
    popularPlansData,
    subscriptionStatusData,
    examActivityData
}: DashboardChartsProps) {
    
    const revenueChartData = {
        labels: revenueData.map(d => d.label),
        datasets: [
            {
                label: 'الأرباح (ج.م)',
                data: revenueData.map(d => d.value),
                borderColor: 'rgb(16, 185, 129)', // Emerald 500
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                fill: true,
                tension: 0.4,
            },
        ],
    };

    const activityChartData = {
        labels: examActivityData.map(d => d.label),
        datasets: [
            {
                label: 'الأوراق المصححة',
                data: examActivityData.map(d => d.value),
                backgroundColor: 'rgb(99, 102, 241)', // Indigo 500
                borderRadius: 4,
            },
        ],
    };

    const popularPlansChartData = {
        labels: popularPlansData.map(d => d.label),
        datasets: [
            {
                data: popularPlansData.map(d => d.value),
                backgroundColor: [
                    'rgb(245, 158, 11)', // Amber 500
                    'rgb(59, 130, 246)', // Blue 500
                    'rgb(236, 72, 153)', // Pink 500
                    'rgb(139, 92, 246)', // Violet 500
                ],
                borderWidth: 0,
                hoverOffset: 4
            },
        ],
    };

    const StatusChartData = {
        labels: subscriptionStatusData.map(d => d.label),
        datasets: [
            {
                data: subscriptionStatusData.map(d => d.value),
                backgroundColor: [
                    'rgb(16, 185, 129)', // Emerald 500
                    'rgb(239, 68, 68)',  // Red 500
                ],
                borderWidth: 0,
            },
        ],
    };

    const commonOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'bottom' as const,
                labels: {
                    font: { family: 'inherit' }
                }
            },
        },
    };

    return (
        <div className="grid gap-4 md:grid-cols-2 mt-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">الأرباح الشهرية</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center pt-2">
                    {revenueData.length > 0 ? (
                        <div className="w-full h-full relative">
                            <Line 
                                data={revenueChartData} 
                                options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: { beginAtZero: true }
                                    }
                                }} 
                            />
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">لا توجد بيانات متاحة</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">نشاط التصحيح (آخر 7 أيام)</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center pt-2">
                     {examActivityData.length > 0 ? (
                        <div className="w-full h-full relative">
                            <Bar 
                                data={activityChartData} 
                                options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    scales: {
                                        y: { beginAtZero: true }
                                    }
                                }} 
                            />
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">لا توجد بيانات متاحة</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">الباقات الأكثر طلباً</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center pb-6">
                    {popularPlansData.length > 0 ? (
                        <div className="w-full h-full relative">
                            <Doughnut 
                                data={popularPlansChartData} 
                                options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false,
                                    cutout: '70%'
                                }} 
                            />
                        </div>
                    ) : (
                         <p className="text-muted-foreground text-sm">لا توجد بيانات متاحة</p>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">حالة المشتركين</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px] flex items-center justify-center pb-6">
                     {subscriptionStatusData.length > 0 ? (
                        <div className="w-full h-full relative">
                            <Pie 
                                data={StatusChartData} 
                                options={{
                                    ...commonOptions,
                                    maintainAspectRatio: false
                                }} 
                            />
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">لا توجد بيانات متاحة</p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
