import React from 'react';
import { Icon } from '@iconify/react';
import ReactECharts from 'echarts-for-react';

interface AnalyticsChartProps {
    title: string;
    data: {
        labels: string[];
        revenue: number[];
        transactions: number[];
    };
}

const AnalyticsChart: React.FC<AnalyticsChartProps> = ({ title, data }) => {
    const option = {
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                label: {
                    backgroundColor: '#6a7985'
                }
            },
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            textStyle: {
                color: '#334155'
            }
        },
        legend: {
            data: ['Revenue', 'Transactions'],
            textStyle: {
                color: '#64748b'
            },
            bottom: 0
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '12%',
            top: '8%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: data.labels,
            axisLine: {
                lineStyle: {
                    color: '#e2e8f0'
                }
            },
            axisLabel: {
                color: '#64748b'
            }
        },
        yAxis: [
            {
                type: 'value',
                name: 'Revenue (₦)',
                position: 'left',
                axisLine: {
                    lineStyle: {
                        color: '#16a34a'
                    }
                },
                axisLabel: {
                    color: '#64748b',
                    formatter: (value: number) => `₦${(value / 1000).toFixed(0)}k`
                },
                splitLine: {
                    lineStyle: {
                        color: '#f1f5f9'
                    }
                }
            },
            {
                type: 'value',
                name: 'Transactions',
                position: 'right',
                axisLine: {
                    lineStyle: {
                        color: '#3b82f6'
                    }
                },
                axisLabel: {
                    color: '#64748b'
                },
                splitLine: {
                    show: false
                }
            }
        ],
        series: [
            {
                name: 'Revenue',
                type: 'line',
                smooth: true,
                yAxisIndex: 0,
                data: data.revenue,
                lineStyle: {
                    width: 3,
                    color: '#16a34a'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(22, 163, 74, 0.3)' },
                            { offset: 1, color: 'rgba(22, 163, 74, 0.05)' }
                        ]
                    }
                },
                emphasis: {
                    focus: 'series'
                }
            },
            {
                name: 'Transactions',
                type: 'line',
                smooth: true,
                yAxisIndex: 1,
                data: data.transactions,
                lineStyle: {
                    width: 3,
                    color: '#3b82f6'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [
                            { offset: 0, color: 'rgba(59, 130, 246, 0.3)' },
                            { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
                        ]
                    }
                },
                emphasis: {
                    focus: 'series'
                }
            }
        ]
    };

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 hover:shadow-lg transition-shadow duration-300">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-50 rounded-lg">
                    <Icon icon="solar:chart-bold-duotone" width="24" height="24" className="text-purple-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
            </div>
            <ReactECharts
                option={option}
                style={{ height: '350px' }}
                opts={{ renderer: 'svg' }}
            />
        </div>
    );
};

export default AnalyticsChart;
