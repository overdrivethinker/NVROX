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
import { DeviceSelector } from "./device-selector";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2, AudioLines } from "lucide-react";
import io from "socket.io-client";

type ChartPoint = {
    datetime: string;
    temp: number;
    humid: number;
};

type SensorData = {
    mac_address: string;
    temperature: number;
    humidity: number;
    recorded_at: string;
};

export function LiveChart() {
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
    } satisfies ChartConfig;

    const limits = {
        tempMin: 22,
        tempMax: 35,
        humidMin: 40,
        humidMax: 75,
    };

    const [selectedMac, setSelectedMac] = useState<string | undefined>(
        undefined
    );
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [delayedLoading, setDelayedLoading] = useState(false);

    // SOCKET.IO - aktif setelah pilih MAC
    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setChartData([]);

        const socket = io("http://localhost:3000", {
            query: { mac: selectedMac },
        });

        const timeout = setTimeout(() => setDelayedLoading(true), 1000);

        socket.on("sensor_data", (data: SensorData) => {
            if (data.mac_address !== selectedMac) return;

            const point: ChartPoint = {
                datetime: data.recorded_at,
                temp: data.temperature,
                humid: data.humidity,
            };

            setChartData((prev) => [...prev.slice(-20), point]);
            setIsLoading(false);
            setDelayedLoading(false);
            clearTimeout(timeout);
        });

        return () => {
            socket.disconnect();
            clearTimeout(timeout);
        };
    }, [selectedMac]);

    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Device Monitoring</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Real-time data
                    </span>
                    <span className="@[540px]/card:hidden">Live chart</span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <DeviceSelector
                        value={selectedMac}
                        onChange={setSelectedMac}
                    />
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
                        <div className="flex flex-col lg:flex-row gap-6">
                            <div className="flex-1">
                                <div className="flex justify-center px-2 sm:px-4 mb-2">
                                    <span className="text-2xl font-bold text-primary">
                                        xxx
                                    </span>
                                </div>
                                {/* Chart Temperature */}
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[330px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 10,
                                                right: 30,
                                                left: 0,
                                                bottom: 40,
                                            }}>
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
                                                            chartConfig.temp
                                                                .color
                                                        }
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={
                                                            chartConfig.temp
                                                                .color
                                                        }
                                                        stopOpacity={0.1}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="datetime"
                                                interval={0}
                                                tick={({ x, y, payload }) => (
                                                    <text
                                                        x={x}
                                                        y={y + 10}
                                                        textAnchor="end"
                                                        transform={`rotate(-45, ${x}, ${y})`}
                                                        fontSize={10}>
                                                        {new Date(
                                                            payload.value
                                                        ).toLocaleTimeString(
                                                            "en-US",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                second: "2-digit",
                                                                hour12: false,
                                                            }
                                                        )}
                                                    </text>
                                                )}
                                            />

                                            <YAxis
                                                stroke={chartConfig.temp.color}
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                domain={[20, 40]}
                                                label={{
                                                    value: chartConfig.temp
                                                        .label,
                                                    angle: -90,
                                                    position: "outsideLeft",
                                                    dx: -20,
                                                    style: {
                                                        textAnchor: "middle",
                                                        fill: chartConfig.temp
                                                            .color,
                                                        fontSize: 16,
                                                    },
                                                }}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent
                                                        labelFormatter={(
                                                            value
                                                        ) =>
                                                            new Date(
                                                                value
                                                            ).toLocaleDateString(
                                                                "en-US",
                                                                {
                                                                    month: "long",
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
                                                dataKey="temp"
                                                stroke={chartConfig.temp.color}
                                                fill="url(#fillTemp)"
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
                            </div>

                            {/* Chart Humidity */}
                            <div className="flex-1">
                                {/* Label atas Temperature */}
                                <div className="flex justify-center px-2 sm:px-4 mb-2">
                                    <span className="text-2xl font-bold text-primary">
                                        xxx
                                    </span>
                                </div>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[330px] w-full">
                                    <ResponsiveContainer
                                        width="100%"
                                        height="100%">
                                        <AreaChart
                                            data={chartData}
                                            margin={{
                                                top: 10,
                                                right: 30,
                                                left: 0,
                                                bottom: 40,
                                            }}>
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
                                                            chartConfig.humid
                                                                .color
                                                        }
                                                        stopOpacity={0.3}
                                                    />
                                                    <stop
                                                        offset="95%"
                                                        stopColor={
                                                            chartConfig.humid
                                                                .color
                                                        }
                                                        stopOpacity={0.1}
                                                    />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid vertical={false} />
                                            <XAxis
                                                dataKey="datetime"
                                                interval={0}
                                                tick={({ x, y, payload }) => (
                                                    <text
                                                        x={x}
                                                        y={y + 10}
                                                        textAnchor="end"
                                                        transform={`rotate(-45, ${x}, ${y})`}
                                                        fontSize={10}>
                                                        {new Date(
                                                            payload.value
                                                        ).toLocaleTimeString(
                                                            "en-US",
                                                            {
                                                                hour: "2-digit",
                                                                minute: "2-digit",
                                                                second: "2-digit",
                                                                hour12: false,
                                                            }
                                                        )}
                                                    </text>
                                                )}
                                            />
                                            <YAxis
                                                stroke={chartConfig.humid.color}
                                                fontSize={12}
                                                tickLine={false}
                                                axisLine={false}
                                                domain={[30, 90]}
                                                label={{
                                                    value: chartConfig.humid
                                                        .label,
                                                    angle: -90,
                                                    position: "outsideLeft",
                                                    dx: -20,
                                                    style: {
                                                        textAnchor: "middle",
                                                        fill: chartConfig.humid
                                                            .color,
                                                        fontSize: 16,
                                                    },
                                                }}
                                            />
                                            <ChartTooltip
                                                cursor={false}
                                                content={
                                                    <ChartTooltipContent
                                                        labelFormatter={(
                                                            value
                                                        ) =>
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
                                                dataKey="humid"
                                                stroke={chartConfig.humid.color}
                                                fill="url(#fillHumid)"
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
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
