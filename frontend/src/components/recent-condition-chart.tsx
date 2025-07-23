"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";

import {
    Card,
    CardAction,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import type { ChartConfig } from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { DeviceSelector } from "./device-selector";
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, AudioLines } from "lucide-react";

type Limits = {
    tempMin: number;
    tempMax: number;
    humidMin: number;
    humidMax: number;
};

type ChartPoint = {
    datetime: string;
    tempMin: number;
    tempMax: number;
    tempAvg: number;
    humidMin: number;
    humidMax: number;
    humidAvg: number;
};

type SensorHourlyData = {
    hour: string;
    min_temp: string;
    max_temp: string;
    avg_temp: string;
    min_humid: string;
    max_humid: string;
    avg_humid: string;
};

export function RecentChart() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const chartConfig = {
        temp: {
            label: "Temperature (°C)",
            color: isDark ? "#3b82f6" : "#1a92eeff",
        },
        humid: {
            label: "Humidity (%)",
            color: isDark ? "#55de87ff" : "#00b84dff",
        },
        avg: {
            color: isDark ? "#fffb00ff" : "#ff6600ff",
        },
    } satisfies ChartConfig;
    const limits: Limits = {
        tempMin: 22,
        tempMax: 35,
        humidMin: 40,
        humidMax: 75,
    };

    const validRanges = ["today", "yesterday", "2daysago"] as const;
    type TimeRange = (typeof validRanges)[number];
    const [timeRange, setTimeRange] =
        useState<(typeof validRanges)[number]>("today");
    const [selectedMac, setSelectedMac] = useState<string | undefined>(
        undefined
    );
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [delayedLoading, setDelayedLoading] = useState(false);

    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setDelayedLoading(true);

        const delayTimeout = setTimeout(() => {
            setDelayedLoading(false);
        }, 1000);

        axios
            .get(
                import.meta.env.VITE_API_BASE_URL + "/sensor-data/3days-hourly",
                {
                    params: {
                        mac_address: selectedMac,
                        range: timeRange,
                    },
                }
            )
            .then((res) => {
                const parsed = (res.data.data as SensorHourlyData[]).map(
                    (item) => ({
                        datetime: item.hour,
                        tempMin: parseFloat(item.min_temp),
                        tempMax: parseFloat(item.max_temp),
                        tempAvg: parseFloat(
                            parseFloat(item.avg_temp).toFixed(2)
                        ),
                        humidMin: parseFloat(item.min_humid),
                        humidMax: parseFloat(item.max_humid),
                        humidAvg: parseFloat(
                            parseFloat(item.avg_humid).toFixed(2)
                        ),
                    })
                );
                setChartData(parsed);
            })
            .catch((err) => {
                console.error("Error fetching chart data", err);
                setChartData([]);
            })
            .finally(() => {
                setIsLoading(false);
            });
        return () => clearTimeout(delayTimeout);
    }, [selectedMac, timeRange]);

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Device Status</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Monitoring for the last 3 days
                    </span>
                    <span className="@[540px]/card:hidden">Last 3 days</span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <DeviceSelector
                        value={selectedMac}
                        onChange={setSelectedMac}
                    />

                    <ToggleGroup
                        type="single"
                        value={timeRange}
                        onValueChange={(val) => {
                            if (validRanges.includes(val as TimeRange)) {
                                setTimeRange(val as TimeRange);
                            }
                        }}
                        variant="outline"
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4">
                        <ToggleGroupItem value="today">Today</ToggleGroupItem>
                        <ToggleGroupItem value="yesterday">
                            Yesterday
                        </ToggleGroupItem>
                        <ToggleGroupItem value="2daysago">
                            2 Days Ago
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Select Dropdown for Mobile */}
                    <Select
                        value={timeRange}
                        onValueChange={(val) => {
                            if (validRanges.includes(val as TimeRange)) {
                                setTimeRange(val as TimeRange);
                            }
                        }}>
                        <SelectTrigger
                            className="flex w-40 @[767px]/card:hidden"
                            size="sm">
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="today" className="rounded-lg">
                                Today
                            </SelectItem>
                            <SelectItem
                                value="yesterday"
                                className="rounded-lg">
                                Yesterday
                            </SelectItem>
                            <SelectItem value="2daysago" className="rounded-lg">
                                2 Days Ago
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>

            <CardContent className="w-full overflow-x-hidden px-2 sm:px-6 pt-2 sm:pt-4 mb-3">
                {!selectedMac ? (
                    <div className="flex justify-center py-12">
                        <Badge
                            variant="outline"
                            className="text-base border-red-700 text-red-700 dark:text-red-400 dark:border-red-400">
                            <AudioLines className="w-4 h-4 me-1.5" />
                            Select device first
                        </Badge>
                    </div>
                ) : isLoading || delayedLoading ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400">
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Loading chart...
                        </Badge>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex justify-center py-12">
                        <Badge
                            variant="outline"
                            className="text-base border-yellow-500 text-yellow-600 dark:border-yellow-900 dark:text-yellow-300 text-sm">
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No data available
                        </Badge>
                    </div>
                ) : (
                    <>
                        {/* Temperature Chart */}
                        <ChartContainer
                            config={chartConfig}
                            className="h-[330px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="fillTemp"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={
                                                    chartConfig.temp.color
                                                }
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={
                                                    chartConfig.temp.color
                                                }
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="datetime"
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleTimeString(
                                                "en-US",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                }
                                            )
                                        }
                                        tick={{ dy: 15 }}
                                    />
                                    <YAxis
                                        stroke={chartConfig.temp.color}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[20, 40]}
                                        label={{
                                            value: chartConfig.temp.label,
                                            angle: -90,
                                            position: "outsideLeft",
                                            dx: -20,
                                            style: {
                                                textAnchor: "middle",
                                                fill: chartConfig.temp.color,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        defaultIndex={10}
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) =>
                                                    new Date(
                                                        value
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        }
                                                    )
                                                }
                                                indicator="dot"
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tempMax"
                                        stroke={chartConfig.temp.color}
                                        fill="url(#fillTemp)"
                                        dot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tempAvg"
                                        stroke={chartConfig.avg.color}
                                        fill="url(#fillTemp)"
                                        dot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="tempMin"
                                        stroke={chartConfig.temp.color}
                                        fillOpacity={0}
                                        dot={false}
                                    />
                                    <ReferenceLine
                                        y={limits.tempMax}
                                        stroke="red"
                                        strokeDasharray="20 10"
                                        strokeWidth={2}
                                    />
                                    <ReferenceLine
                                        y={limits.tempMin}
                                        stroke="red"
                                        strokeDasharray="20 10"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                        {/* Humidity Chart */}
                        <ChartContainer
                            config={chartConfig}
                            className="h-[330px] w-full mt-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient
                                            id="fillHumid"
                                            x1="0"
                                            y1="0"
                                            x2="0"
                                            y2="1">
                                            <stop
                                                offset="5%"
                                                stopColor={
                                                    chartConfig.humid.color
                                                }
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset="95%"
                                                stopColor={
                                                    chartConfig.humid.color
                                                }
                                                stopOpacity={0.1}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid vertical={false} />
                                    <XAxis
                                        dataKey="datetime"
                                        tickFormatter={(value) =>
                                            new Date(value).toLocaleTimeString(
                                                "en-US",
                                                {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    hour12: false,
                                                }
                                            )
                                        }
                                        tick={{ dy: 15 }}
                                    />
                                    <YAxis
                                        stroke={chartConfig.humid.color}
                                        fontSize={12}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[30, 90]}
                                        label={{
                                            value: chartConfig.humid.label,
                                            angle: -90,
                                            position: "outsideLeft",
                                            dx: -20,
                                            style: {
                                                textAnchor: "middle",
                                                fill: chartConfig.humid.color,
                                                fontSize: 16,
                                            },
                                        }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        defaultIndex={10}
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) =>
                                                    new Date(
                                                        value
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        }
                                                    )
                                                }
                                                indicator="dot"
                                            />
                                        }
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="humidMax"
                                        stroke={chartConfig.humid.color}
                                        fill="url(#fillHumid)"
                                        dot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="humidAvg"
                                        stroke={chartConfig.avg.color}
                                        fill="url(#fillHumid)"
                                        dot={false}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="humidMin"
                                        stroke={chartConfig.humid.color}
                                        fillOpacity={0}
                                        dot={false}
                                    />
                                    <ReferenceLine
                                        y={limits.humidMax}
                                        stroke="red"
                                        strokeDasharray="20 10"
                                        strokeWidth={2}
                                    />
                                    <ReferenceLine
                                        y={limits.humidMin}
                                        stroke="red"
                                        strokeDasharray="20 10"
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </ChartContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
