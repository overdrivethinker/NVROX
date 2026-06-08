"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import * as echarts from "echarts";
import type { ECElementEvent } from "echarts";
import type { TopLevelFormatterParams } from "echarts/types/dist/shared";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
} from "@/components/ui/card";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useTheme } from "@/hooks/use-theme";
import type { CallbackDataParams } from "echarts/types/dist/shared";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, CalendarIcon, Search } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";

type HeatmapRow = {
    device_name: string;
    time_label: string;
    avg_temp: number;
    avg_humid: number;
};

const validRanges = ["daily", "weekly", "monthly", "yearly"] as const;
type TimeRange = (typeof validRanges)[number];

export function DashboardOverview() {
    const chartRef = useRef<HTMLDivElement>(null);
    const chartInstance = useRef<echarts.ECharts | null>(null);
    const [data, setData] = useState<HeatmapRow[]>([]);
    const [devices, setDevices] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const chartHeight = Math.max(400, devices.length * 25 + 100);
    const [noData, setNoData] = useState(false);
    const [timeRange, setTimeRange] = useState<TimeRange>("daily");
    const today = new Date();
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [startDate, setStartDate] = useState<Date>(today);
    const [endDate, setEndDate] = useState<Date>(today);
    const [appliedStart, setAppliedStart] = useState<Date>(today);
    const [appliedEnd, setAppliedEnd] = useState<Date>(today);

    // Fetch data
    useEffect(() => {
        setIsLoading(true);
        axios
            .get(`${import.meta.env.VITE_API_BASE_URL}/sensor-data/heatmap`, {
                params: {
                    range: timeRange,
                    start_date: appliedStart.toISOString().split("T")[0],
                    end_date: appliedEnd.toISOString().split("T")[0],
                },
            })
            .then((res) => {
                const result = res.data.data;
                setData(result);
                setNoData(result.length === 0);
            })
            .catch(console.error)
            .finally(() => setIsLoading(false));
    }, [timeRange, appliedStart, appliedEnd]);

    useEffect(() => {
        return () => {
            chartInstance.current?.dispose();
            chartInstance.current = null;
        };
    }, []);

    useEffect(() => {
        if (!chartRef.current || !data.length) return;

        // Dispose dan init ulang kalau theme berubah
        if (chartInstance.current) {
            chartInstance.current.dispose();
            chartInstance.current = null;
        }

        chartInstance.current = echarts.init(
            chartRef.current,
            isDark ? "dark" : undefined,
        );

        const deviceList = [...new Set(data.map((d) => d.device_name))];
        const times = [...new Set(data.map((d) => d.time_label))].sort();

        setDevices(deviceList);

        const option: echarts.EChartsOption = {
            backgroundColor: "transparent",
            tooltip: {
                trigger: "item",
                backgroundColor: isDark ? "#18181b" : "#ffffff",
                borderColor: isDark ? "#3f3f46" : "#e4e4e7",
                textStyle: {
                    color: isDark ? "#f4f4f5" : "#18181b",
                    fontSize: 12,
                },
                formatter: (p: TopLevelFormatterParams) => {
                    const item = Array.isArray(p) ? p[0] : p;
                    const d = (item as ECElementEvent).data as [
                        number,
                        number,
                        number,
                    ];
                    const device = deviceList[d[1]];
                    const time = times[d[0]];
                    const val = d[2];
                    const isTemp = (item as ECElementEvent).seriesIndex === 0;
                    return `
                    <div style="font-weight:500">${device}</div>
                    <div style="color:#71717a">${time}</div>
                    <div style="margin-top:4px">${isTemp ? "Temp" : "Humidity"}: <b>${val.toFixed(2)}${isTemp ? "°C" : "%"}</b></div>
                `;
                },
            },
            grid: [
                {
                    left: 2,
                    right: "52%",
                    bottom: 80,
                    top: 40,
                    containLabel: true,
                },
                {
                    left: "52%",
                    right: 2,
                    bottom: 80,
                    top: 40,
                    containLabel: true,
                },
            ],
            xAxis: [
                {
                    type: "category",
                    data: times,
                    gridIndex: 0,
                    axisLabel: {
                        rotate: 35,
                        fontSize: 12,
                        color: isDark ? "#a1a1aa" : "#71717a",
                    },
                    splitArea: { show: true },
                },
                {
                    type: "category",
                    data: times,
                    gridIndex: 1,
                    axisLabel: {
                        rotate: 35,
                        fontSize: 12,
                        color: isDark ? "#a1a1aa" : "#71717a",
                    },
                    splitArea: { show: true },
                },
            ],
            yAxis: [
                {
                    type: "category",
                    data: deviceList,
                    gridIndex: 0,
                    axisLabel: {
                        fontSize: 12,
                        color: isDark ? "#a1a1aa" : "#71717a",
                    },
                    splitArea: { show: true },
                },
                {
                    type: "category",
                    data: deviceList,
                    gridIndex: 1,
                    axisLabel: { show: false },
                    splitArea: { show: true },
                },
            ],
            visualMap: [
                {
                    min: Math.min(
                        ...data.map((d) =>
                            parseFloat(Number(d.avg_temp).toFixed(1)),
                        ),
                    ),
                    max: Math.max(
                        ...data.map((d) =>
                            parseFloat(Number(d.avg_temp).toFixed(1)),
                        ),
                    ),
                    calculable: true,
                    orient: "horizontal",
                    left: "0%",
                    bottom: 5,
                    inRange: {
                        color: ["#2563eb", "#f59e0b", "#dc2626"],
                    },
                    textStyle: {
                        color: isDark ? "#a1a1aa" : "#71717a",
                        fontSize: 12,
                    },
                    text: ["High", "Low"],
                    seriesIndex: 0,
                },
                {
                    min: Math.min(
                        ...data.map((d) =>
                            parseFloat(Number(d.avg_humid).toFixed(1)),
                        ),
                    ),
                    max: Math.max(
                        ...data.map((d) =>
                            parseFloat(Number(d.avg_humid).toFixed(1)),
                        ),
                    ),
                    calculable: true,
                    orient: "horizontal",
                    left: "50%",
                    bottom: 5,
                    inRange: {
                        color: ["#16a34a", "#15803d", "#14532d"],
                    },
                    textStyle: {
                        color: isDark ? "#a1a1aa" : "#71717a",
                        fontSize: 12,
                    },
                    text: ["High", "Low"],
                    seriesIndex: 1,
                },
            ],
            dataZoom: [{ type: "inside", xAxisIndex: [0, 1] }],
            graphic: [
                {
                    type: "text",
                    left: "0%",
                    top: 4,
                    style: {
                        text: "Temperature (°C)",
                        fill: isDark ? "#a1a1aa" : "#71717a",
                        fontSize: 15,
                    },
                },
                {
                    type: "text",
                    left: "52%",
                    top: 4,
                    style: {
                        text: "Humidity (%)",
                        fill: isDark ? "#a1a1aa" : "#71717a",
                        fontSize: 15,
                    },
                },
            ],
            series: [
                {
                    type: "heatmap",
                    data: data.map((d) => [
                        times.indexOf(d.time_label),
                        deviceList.indexOf(d.device_name),
                        parseFloat(Number(d.avg_temp).toFixed(2)),
                    ]),
                    xAxisIndex: 0,
                    yAxisIndex: 0,
                    label: {
                        show: true,
                        fontSize: 12,
                        color: "#ffffff",
                        formatter: (p: CallbackDataParams) => {
                            const v = p.data as [number, number, number];
                            return `${v[2].toFixed(2)}`;
                        },
                    },
                    itemStyle: {
                        borderColor: isDark ? "#09090b" : "#ffffff",
                        borderWidth: 0.5,
                        borderRadius: 0,
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 8,
                            shadowColor: "rgba(0,0,0,0.3)",
                        },
                    },
                },
                {
                    type: "heatmap",
                    data: data.map((d) => [
                        times.indexOf(d.time_label),
                        deviceList.indexOf(d.device_name),
                        parseFloat(Number(d.avg_humid).toFixed(2)),
                    ]),
                    xAxisIndex: 1,
                    yAxisIndex: 1,
                    label: {
                        show: true,
                        fontSize: 12,
                        color: "#ffffff",
                        formatter: (p: CallbackDataParams) => {
                            const v = p.data as [number, number, number];
                            return `${v[2].toFixed(2)}`;
                        },
                    },
                    itemStyle: {
                        borderColor: isDark ? "#09090b" : "#ffffff",
                        borderWidth: 0.5,
                        borderRadius: 0,
                    },
                    emphasis: {
                        itemStyle: {
                            shadowBlur: 8,
                            shadowColor: "rgba(0,0,0,0.3)",
                        },
                    },
                },
            ],
        };

        chartInstance.current.setOption(option, true);
        chartInstance.current.resize();

        const handleResize = () => chartInstance.current?.resize();
        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [data, isDark]);

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Condition Overview</CardTitle>
                <CardDescription>
                    Temperature and humidity distribution by device
                </CardDescription>
                <CardAction>
                    <div className="flex flex-wrap gap-2 items-center">
                        <Popover
                            open={openDatePicker}
                            onOpenChange={setOpenDatePicker}
                        >
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    className="justify-start text-left w-full sm:w-auto h-9"
                                >
                                    {startDate && endDate
                                        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                                        : startDate
                                          ? startDate.toLocaleDateString()
                                          : "Select Date Range"}
                                    <CalendarIcon className="ml-2 h-4 w-4" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: startDate,
                                        to: endDate,
                                    }}
                                    onSelect={(range) => {
                                        if (range?.from)
                                            setStartDate(range.from);
                                        if (range?.to) setEndDate(range.to);
                                    }}
                                    numberOfMonths={2}
                                    initialFocus
                                />
                                <div className="flex justify-end gap-2 pb-5 px-5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9"
                                        onClick={() => {
                                            setStartDate(today);
                                            setEndDate(today);
                                            setAppliedStart(today);
                                            setAppliedEnd(today);
                                            setOpenDatePicker(false);
                                        }}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        disabled={!startDate || !endDate}
                                        onClick={() => {
                                            setAppliedStart(startDate);
                                            setAppliedEnd(endDate);
                                            setOpenDatePicker(false);
                                        }}
                                        className="h-9"
                                    >
                                        <Search className="h-4 w-4" />
                                        Search
                                    </Button>
                                </div>
                            </PopoverContent>
                        </Popover>
                        <ToggleGroup
                            type="single"
                            value={timeRange}
                            onValueChange={(v) =>
                                validRanges.includes(v as TimeRange) &&
                                setTimeRange(v as TimeRange)
                            }
                            variant="outline"
                            className="w-fit"
                        >
                            <ToggleGroupItem value="daily">
                                Daily
                            </ToggleGroupItem>
                            <ToggleGroupItem value="weekly">
                                Weekly
                            </ToggleGroupItem>
                            <ToggleGroupItem value="monthly">
                                Monthly
                            </ToggleGroupItem>
                            <ToggleGroupItem value="yearly">
                                Yearly
                            </ToggleGroupItem>
                        </ToggleGroup>
                    </div>
                </CardAction>
            </CardHeader>
            <CardContent>
                {isLoading && (
                    <div className="flex justify-center items-center h-[600px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                        >
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Loading chart...
                        </Badge>
                    </div>
                )}
                {noData && !isLoading && (
                    <div className="flex justify-center items-center h-[600px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-yellow-500 text-yellow-600 dark:border-yellow-900 dark:text-yellow-300"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No data available
                        </Badge>
                    </div>
                )}
                <div
                    ref={chartRef}
                    style={{
                        height: chartHeight,
                        width: "100%",
                        display: isLoading || noData ? "none" : "block",
                    }}
                />
            </CardContent>
        </Card>
    );
}
