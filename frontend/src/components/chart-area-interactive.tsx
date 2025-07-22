"use client";
import { useState } from "react";
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
type Limits = {
    tempMin: number;
    tempMax: number;
    humidMin: number;
    humidMax: number;
};

export const description = "An interactive area chart";
const fullDayData = [
    { date: "2025-07-20", temp: 26.4, humid: 65 },
    { date: "2025-07-21", temp: 28.1, humid: 70 },
    { date: "2025-07-22", temp: 27.3, humid: 68 },
];

function getRandomOffset(range: number) {
    return (Math.random() * range * 2 - range); // e.g. range = 1 → -1 to +1
}

function dailyPattern(hour: number, peakHour: number, amplitude: number) {
    // Pola sinus naik turun sehari, puncak di peakHour
    const radians = ((hour - peakHour) / 24) * 2 * Math.PI;
    return amplitude * Math.cos(radians);
}

const chartData = fullDayData.flatMap((entry) => {
    const [year, month, day] = entry.date.split("-").map(Number);

    let tempPrev = entry.temp + getRandomOffset(1.5);
    let humidPrev = entry.humid + getRandomOffset(2);

    return Array.from({ length: 24 }, (_, hour) => {
        // Pola harian (misal suhu puncak jam 14)
        const tempPattern = dailyPattern(hour, 14, 4); // ±4°C daily variation
        const humidPattern = dailyPattern(hour, 6, 10); // ±10% RH daily variation (misal pagi)

        // Random walk step kecil + noise moderate
        tempPrev =
            tempPrev * 0.7 +
            (entry.temp + tempPattern) * 0.3 +
            (Math.random() - 0.5) * 1.5;
        humidPrev =
            humidPrev * 0.7 +
            (entry.humid + humidPattern) * 0.3 +
            (Math.random() - 0.5) * 3;

        // Fluktuasi min/max sekitar nilai tengah
        const tempFluctuation = 1 + Math.random() * 1.5; // 1 – 2.5°C
        const humidFluctuation = 3 + Math.random() * 5; // 3 – 8%

        const tempMin = +(tempPrev - tempFluctuation).toFixed(1);
        const tempMax = +(tempPrev + tempFluctuation).toFixed(1);

        const humidMin = Math.max(0, +(humidPrev - humidFluctuation).toFixed(0));
        const humidMax = Math.min(100, +(humidPrev + humidFluctuation).toFixed(0));

        return {
            datetime: new Date(year, month - 1, day, hour).toISOString(),
            tempMin,
            tempMax,
            humidMin,
            humidMax,
        };
    });
});

const chartConfig = {
    temp: {
        label: "Temperature (°C)",
        color: "#3b82f6", // biru
    },
    humid: {
        label: "Humidity (%)",
        color: "#10b981", // hijau
    },
} satisfies ChartConfig;

export function ChartAreaInteractive() {
    const limits: Limits = {
        tempMin: 25,
        tempMax: 30,
        humidMin: 50,
        humidMax: 75,
    };
    const [timeRange, setTimeRange] = useState<"today" | "yesterday" | "2daysago">("today");

    const filteredData = chartData.filter((item) => {
        const itemDate = new Date(item.datetime);
        const now = new Date();
        const dateOnly = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
        const itemDateOnly = dateOnly(itemDate);
        const today = dateOnly(now);
        const diffDays = Math.floor((today.getTime() - itemDateOnly.getTime()) / (1000 * 60 * 60 * 24));

        const match = {
            today: 0,
            yesterday: 1,
            "2daysago": 2,
        };

        return diffDays === match[timeRange];
    });


    const [selectedMac, setSelectedMac] = useState<string | undefined>(
        undefined
    );

    const validRanges = ["today", "yesterday", "2daysago"] as const;
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
                    {/* Device Selector */}
                    <DeviceSelector
                        value={selectedMac}
                        onChange={setSelectedMac}
                    />

                    {/* ToggleGroup for Desktop */}
                    <ToggleGroup
                        type="single"
                        value={timeRange}
                        onValueChange={(val) => {
                            if (validRanges.includes(val as typeof validRanges[number])) {
                                setTimeRange(val as typeof timeRange);
                            }
                        }}
                        variant="outline"
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4">
                        <ToggleGroupItem value="today">
                            Today
                        </ToggleGroupItem>
                        <ToggleGroupItem value="yesterday">
                            Yesterday
                        </ToggleGroupItem>
                        <ToggleGroupItem value="2daysago">
                            2 Days Ago
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Select Dropdown for Mobile */}
                    <Select value={timeRange} onValueChange={(val) => {
                        if (validRanges.includes(val as typeof validRanges[number])) {
                            setTimeRange(val as typeof timeRange);
                        }
                    }}>
                        <SelectTrigger
                            className="flex w-40 @[767px]/card:hidden"
                            size="sm"
                            aria-label="Select a value">
                            <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="today" className="rounded-lg">
                                Today
                            </SelectItem>
                            <SelectItem value="yesterday" className="rounded-lg">
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
                {/* Temperature Chart */}
                <ChartContainer
                    config={chartConfig}
                    className="h-[330px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData}>
                            <defs>
                                <linearGradient
                                    id="fillTemp"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={chartConfig.temp.color}
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={chartConfig.temp.color}
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="datetime"
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })
                                }
                                tick={{
                                    dy: 15
                                }}
                            />
                            <YAxis
                                stroke={chartConfig.temp.color}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[20, 35]}
                                label={{
                                    value: chartConfig.temp.label,
                                    angle: -90,
                                    position: "outsideLeft",
                                    dx: -20,
                                    style: {
                                        textAnchor: "middle",
                                        fill: chartConfig.temp.color,
                                    },
                                }}
                            />
                            <ReferenceLine
                                y={limits.tempMax}
                                stroke="red"
                                strokeDasharray="20 10"
                                strokeWidth={1}
                            />
                            <ReferenceLine
                                y={limits.tempMin}
                                stroke="red"
                                strokeDasharray="20 10"
                                strokeWidth={1}
                            />
                            <ChartTooltip
                                cursor={false}
                                defaultIndex={10}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) =>
                                            new Date(value).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
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
                                dataKey="tempMin"
                                stroke={chartConfig.temp.color}
                                fillOpacity={0}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Humidity Chart */}
                <ChartContainer
                    config={chartConfig}
                    className="h-[330px] w-full mt-10">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={filteredData}>
                            <defs>
                                <linearGradient
                                    id="fillHumid"
                                    x1="0"
                                    y1="0"
                                    x2="0"
                                    y2="1">
                                    <stop
                                        offset="5%"
                                        stopColor={chartConfig.humid.color}
                                        stopOpacity={0.8}
                                    />
                                    <stop
                                        offset="95%"
                                        stopColor={chartConfig.humid.color}
                                        stopOpacity={0.1}
                                    />
                                </linearGradient>
                            </defs>
                            <CartesianGrid vertical={false} />
                            <XAxis
                                dataKey="datetime"
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleTimeString("en-US", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        hour12: false,
                                    })
                                }
                                tick={{
                                    dy: 15
                                }}
                            />

                            <YAxis
                                stroke={chartConfig.humid.color}
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                domain={[40, 80]}
                                label={{
                                    value: chartConfig.humid.label,
                                    angle: -90,
                                    position: "outsideLeft",
                                    dx: -20,
                                    style: {
                                        textAnchor: "middle",
                                        fill: chartConfig.humid.color,
                                    },
                                }}
                            />
                            <ReferenceLine
                                y={limits.humidMax}
                                stroke="red"
                                strokeDasharray="20 10"
                                strokeWidth={1}
                            />
                            <ReferenceLine
                                y={limits.humidMin}
                                stroke="red"
                                strokeDasharray="20 10"
                                strokeWidth={1}
                            />
                            <ChartTooltip
                                cursor={false}
                                defaultIndex={10}
                                content={
                                    <ChartTooltipContent
                                        labelFormatter={(value) =>
                                            new Date(value).toLocaleDateString(
                                                "en-US",
                                                {
                                                    month: "short",
                                                    day: "numeric",
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
                                dataKey="humidMin"
                                stroke={chartConfig.humid.color}
                                fillOpacity={0}
                                dot={false}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
