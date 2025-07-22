"use client";
import { useState } from "react";
import * as React from "react";
import {
    Area,
    AreaChart,
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    ResponsiveContainer,
} from "recharts";

import { useIsMobile } from "@/hooks/use-mobile";
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

const chartData = [
    { date: "2024-04-01", temp: 26.2, humid: 67 },
    { date: "2024-04-02", temp: 27.1, humid: 70 },
    { date: "2024-04-03", temp: 28.3, humid: 68 },
    { date: "2024-04-04", temp: 29.0, humid: 72 },
    { date: "2024-04-05", temp: 30.4, humid: 75 },
    { date: "2024-04-06", temp: 31.1, humid: 78 },
    { date: "2024-04-07", temp: 30.0, humid: 70 },
    { date: "2024-04-08", temp: 32.5, humid: 76 },
    { date: "2024-04-09", temp: 25.6, humid: 60 },
    { date: "2024-04-10", temp: 27.8, humid: 69 },
    { date: "2024-04-11", temp: 29.2, humid: 73 },
    { date: "2024-04-12", temp: 28.7, humid: 71 },
    { date: "2024-04-13", temp: 30.0, humid: 79 },
    { date: "2024-04-14", temp: 26.5, humid: 65 },
    { date: "2024-04-15", temp: 25.9, humid: 63 },
    { date: "2024-04-16", temp: 26.4, humid: 66 },
    { date: "2024-04-17", temp: 32.0, humid: 81 },
    { date: "2024-04-18", temp: 31.3, humid: 83 },
    { date: "2024-04-19", temp: 28.5, humid: 68 },
    { date: "2024-04-20", temp: 24.7, humid: 62 },
    { date: "2024-04-21", temp: 26.2, humid: 67 },
    { date: "2024-04-22", temp: 27.5, humid: 66 },
    { date: "2024-04-23", temp: 26.3, humid: 71 },
    { date: "2024-04-24", temp: 30.8, humid: 75 },
    { date: "2024-04-25", temp: 28.0, humid: 74 },
    { date: "2024-04-26", temp: 25.3, humid: 61 },
    { date: "2024-04-27", temp: 30.6, humid: 82 },
    { date: "2024-04-28", temp: 26.0, humid: 68 },
    { date: "2024-04-29", temp: 29.5, humid: 72 },
    { date: "2024-04-30", temp: 32.2, humid: 80 },
    { date: "2024-05-01", temp: 27.2, humid: 69 },
    { date: "2024-05-02", temp: 29.0, humid: 76 },
    { date: "2024-05-03", temp: 28.1, humid: 68 },
    { date: "2024-05-04", temp: 30.7, humid: 82 },
    { date: "2024-05-05", temp: 33.0, humid: 85 },
    { date: "2024-05-06", temp: 33.8, humid: 88 },
    { date: "2024-05-07", temp: 31.2, humid: 77 },
    { date: "2024-05-08", temp: 26.4, humid: 69 },
    { date: "2024-05-09", temp: 27.9, humid: 67 },
    { date: "2024-05-10", temp: 29.1, humid: 79 },
    { date: "2024-05-11", temp: 30.2, humid: 74 },
    { date: "2024-05-12", temp: 27.6, humid: 71 },
    { date: "2024-05-13", temp: 27.4, humid: 66 },
    { date: "2024-05-14", temp: 32.4, humid: 84 },
    { date: "2024-05-15", temp: 33.1, humid: 81 },
    { date: "2024-05-16", temp: 30.7, humid: 78 },
    { date: "2024-05-17", temp: 33.5, humid: 82 },
    { date: "2024-05-18", temp: 29.6, humid: 75 },
    { date: "2024-05-19", temp: 27.3, humid: 68 },
    { date: "2024-05-20", temp: 26.5, humid: 70 },
    { date: "2024-05-21", temp: 25.1, humid: 64 },
    { date: "2024-05-22", temp: 24.9, humid: 61 },
    { date: "2024-05-23", temp: 28.2, humid: 75 },
    { date: "2024-05-24", temp: 29.3, humid: 71 },
    { date: "2024-05-25", temp: 27.8, humid: 73 },
    { date: "2024-05-26", temp: 28.0, humid: 66 },
    { date: "2024-05-27", temp: 31.9, humid: 84 },
    { date: "2024-05-28", temp: 28.4, humid: 70 },
    { date: "2024-05-29", temp: 25.0, humid: 63 },
    { date: "2024-05-30", temp: 30.0, humid: 76 },
    { date: "2024-05-31", temp: 26.3, humid: 70 },
    { date: "2024-06-01", temp: 26.1, humid: 68 },
    { date: "2024-06-02", temp: 32.9, humid: 83 },
    { date: "2024-06-03", temp: 25.7, humid: 65 },
    { date: "2024-06-04", temp: 31.8, humid: 80 },
    { date: "2024-06-05", temp: 24.8, humid: 64 },
    { date: "2024-06-06", temp: 29.3, humid: 72 },
    { date: "2024-06-07", temp: 30.1, humid: 78 },
    { date: "2024-06-08", temp: 30.6, humid: 74 },
    { date: "2024-06-09", temp: 31.7, humid: 86 },
    { date: "2024-06-10", temp: 26.7, humid: 69 },
    { date: "2024-06-11", temp: 25.4, humid: 67 },
    { date: "2024-06-12", temp: 33.2, humid: 84 },
    { date: "2024-06-13", temp: 24.7, humid: 62 },
    { date: "2024-06-14", temp: 32.5, humid: 79 },
    { date: "2024-06-15", temp: 30.3, humid: 76 },
    { date: "2024-06-16", temp: 31.1, humid: 73 },
    { date: "2024-06-17", temp: 33.0, humid: 89 },
    { date: "2024-06-18", temp: 25.9, humid: 66 },
    { date: "2024-06-19", temp: 29.4, humid: 72 },
    { date: "2024-06-20", temp: 31.0, humid: 81 },
    { date: "2024-06-21", temp: 26.6, humid: 70 },
    { date: "2024-06-22", temp: 29.8, humid: 74 },
    { date: "2024-06-23", temp: 33.4, humid: 88 },
    { date: "2024-06-24", temp: 25.5, humid: 68 },
    { date: "2024-06-25", temp: 25.8, humid: 69 },
    { date: "2024-06-26", temp: 31.6, humid: 80 },
    { date: "2024-06-27", temp: 32.4, humid: 85 },
    { date: "2024-06-28", temp: 26.4, humid: 67 },
    { date: "2024-06-29", temp: 25.7, humid: 65 },
    { date: "2024-06-30", temp: 32.0, humid: 82 },
];

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
    const isMobile = useIsMobile();
    const [timeRange, setTimeRange] = React.useState("90d");

    React.useEffect(() => {
        if (isMobile) {
            setTimeRange("7d");
        }
    }, [isMobile]);

    const filteredData = chartData.filter((item) => {
        const date = new Date(item.date);
        const referenceDate = new Date("2024-06-30");
        let daysToSubtract = 90;
        if (timeRange === "30d") {
            daysToSubtract = 30;
        } else if (timeRange === "7d") {
            daysToSubtract = 7;
        }
        const startDate = new Date(referenceDate);
        startDate.setDate(startDate.getDate() - daysToSubtract);
        return date >= startDate;
    });
    const [selectedMac, setSelectedMac] = useState<string | undefined>(
        undefined
    );
    return (
        <Card className="@container/card">
            <CardHeader>
                <CardTitle>Device Status</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Monitoring for the last 3 months
                    </span>
                    <span className="@[540px]/card:hidden">Last 3 months</span>
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
                        onValueChange={setTimeRange}
                        variant="outline"
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4">
                        <ToggleGroupItem value="90d">
                            Last 3 months
                        </ToggleGroupItem>
                        <ToggleGroupItem value="30d">
                            Last 30 days
                        </ToggleGroupItem>
                        <ToggleGroupItem value="7d">
                            Last 7 days
                        </ToggleGroupItem>
                    </ToggleGroup>

                    {/* Select Dropdown for Mobile */}
                    <Select value={timeRange} onValueChange={setTimeRange}>
                        <SelectTrigger
                            className="flex w-40 @[767px]/card:hidden"
                            size="sm"
                            aria-label="Select a value">
                            <SelectValue placeholder="Last 3 months" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="90d" className="rounded-lg">
                                Last 3 months
                            </SelectItem>
                            <SelectItem value="30d" className="rounded-lg">
                                Last 30 days
                            </SelectItem>
                            <SelectItem value="7d" className="rounded-lg">
                                Last 7 days
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
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "short",
                                            day: "numeric",
                                        }
                                    )
                                }
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
                                defaultIndex={isMobile ? -1 : 10}
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
                                dataKey="temp"
                                stroke={chartConfig.temp.color}
                                fill="url(#fillTemp)"
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
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickMargin={8}
                                minTickGap={32}
                                tickFormatter={(value) =>
                                    new Date(value).toLocaleDateString(
                                        "en-US",
                                        {
                                            month: "short",
                                            day: "numeric",
                                        }
                                    )
                                }
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
                                defaultIndex={isMobile ? -1 : 10}
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
                                dataKey="humid"
                                stroke={chartConfig.humid.color}
                                fill="url(#fillHumid)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}
