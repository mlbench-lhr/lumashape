// components/dashboard/SimpleBarChart.tsx
import React, { useState, useEffect } from 'react';

export interface StatCardProps {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    sinceLabel?: string;
    trend: string;
    trendColorVar: string;
    lineColorVar: string;
    points: number[];
    isLoading?: boolean;
}

export interface UserData {
    _id: string;
    name: string;
    email: string;
    avatar?: string;
    createdAt: string;
}

export interface AnnotationData {
    date: string;
    name: string;
    value: number;
}

export interface DashboardStats {
    totalUsers: number;
    totalProjects: number;
    activeProjects: number;
    completedProjects: number;
    verifiedUsers: number;
    projectCompletionRate: number;
    userVerificationRate: number;
}

interface SimpleBarChartProps {
    data: AnnotationData[];
    isLoading: boolean;
    hideZeroBars?: boolean;
    formatYAxisLabel?: (v: number) => string;
}

const SimpleBarChart: React.FC<SimpleBarChartProps> = ({ data, isLoading, hideZeroBars, formatYAxisLabel }) => {
    const [windowWidth, setWindowWidth] = useState<number | null>(null);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        setWindowWidth(window.innerWidth);
        window.addEventListener("resize", handleResize);

        return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Filter logic
    const hasAnyData = data.some(d => d.value > 0);
    const displayData = hideZeroBars && hasAnyData ? data.filter(d => d.value > 0) : data;

    // Dynamic max (nice rounding)
    const rawMax = Math.max(...displayData.map((d) => d.value), 0);
    const niceMax = (val: number) => {
        if (val <= 0) return 10;
        const p = Math.pow(10, Math.floor(Math.log10(val)));
        const f = val / p;
        const nf = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10;
        return nf * p;
    };
    const maxValue = niceMax(rawMax);

    const getBarHeight = (value: number) => {
        if (windowWidth === null) return 0;
        const height = windowWidth < 640 ? 140 : windowWidth < 768 ? 160 : 200;
        if (value === 0) return 4;
        return Math.max(4, (value / maxValue) * height);
    };

    const getLabel = (name: string) => {
        if (windowWidth === null) return "";
        return windowWidth < 640 ? name.split(" ")[1] || name : name;
    };

    // Dynamic Y-axis labels
    const formatLabel = (v: number) => {
        const fmt = formatYAxisLabel || ((n: number) => n >= 1000 ? `${Math.round(n/1000)}k` : `${Math.round(n)}`);
        return fmt(v);
    };
    const yAxisValues = [maxValue, (maxValue * 3) / 4, maxValue / 2, maxValue / 4, 0];
    const yAxisLabels = yAxisValues.map(v => formatLabel(v));

    if (isLoading) {
        return (
            <div className="h-40 sm:h-48 md:h-64 flex items-center justify-center">
                <div className="text-gray-500">Loading chart data...</div>
            </div>
        );
    }

    return (
        <div className="flex">
            {/* Y-axis labels */}
            <div className="flex flex-col justify-between pr-3 text-xs text-gray-500 flex-shrink-0 py-2"
                style={{ height: `${windowWidth === null ? 200 : (windowWidth < 640 ? 140 : windowWidth < 768 ? 160 : 200)}px` }}>
                {yAxisLabels.map((label, index) => (
                    <div key={index} className="flex items-center h-0">
                        <span className="leading-none">{label}</span>
                    </div>
                ))}
            </div>

            {/* Chart area */}
            <div className="flex-1 min-w-0 relative">
                {/* Horizontal grid lines */}
                <div className="absolute inset-0 flex flex-col justify-between pointer-events-none py-2">
                    {yAxisLabels.map((_, index) => (
                        <div key={index} className="w-full border-t border-dashed border-gray-300/60"></div>
                    ))}
                </div>

                <div className="flex items-end justify-between px-4 space-x-2 py-2"
                    style={{ height: `${windowWidth === null ? 200 : (windowWidth < 640 ? 140 : windowWidth < 768 ? 160 : 200)}px` }}>
                    {displayData.map((item, index) => (
                        <div key={index} className="flex flex-col items-center h-full justify-end" style={{ width: '40px' }}>
                            <div className="w-6 flex flex-col items-center">
                                <div
                                    className={`w-full rounded-t-md min-h-[4px] ${item.value > 0 ? 'bg-primary' : 'bg-gray-200'
                                        }`}
                                    style={{
                                        height: `${getBarHeight(item.value)}px`,
                                        transition: "height 0.3s ease",
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
                {/* X-axis labels */}
                <div className="flex justify-between px-4 pt-10 space-x-2">
                    {displayData.map((item, index) => (
                        <div key={index} className="text-center" style={{ width: '40px' }}>
                            <span className="text-xs text-gray-500 truncate block">
                                {getLabel(item.name)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SimpleBarChart;
