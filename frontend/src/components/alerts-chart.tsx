"use client";
import { useState } from "react";
import { Bar, BarChart, XAxis, YAxis } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import type { ChartConfig } from "@/components/ui/chart";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import AlertsDataTable from "./alerts-table";
export const description = "A multiple bar chart";

const chartData = [
    { device: "NVROX-01", temp: 186, humid: 80 },
    { device: "NVROX-02", temp: 305, humid: 200 },
    { device: "NVROX-03", temp: 237, humid: 120 },
    { device: "NVROX-04", temp: 73, humid: 190 },
    { device: "NVROX-05", temp: 209, humid: 130 },
    { device: "NVROX-06", temp: 214, humid: 140 },
    { device: "NVROX-07", temp: 165, humid: 110 },
    { device: "NVROX-08", temp: 98, humid: 85 },
    { device: "NVROX-09", temp: 125, humid: 95 },
    { device: "NVROX-10", temp: 144, humid: 105 },
    { device: "NVROX-11", temp: 178, humid: 90 },
    { device: "NVROX-12", temp: 222, humid: 115 },
    { device: "NVROX-13", temp: 133, humid: 120 },
    { device: "NVROX-14", temp: 156, humid: 98 },
    { device: "NVROX-15", temp: 189, humid: 76 },
    { device: "NVROX-16", temp: 210, humid: 89 },
    { device: "NVROX-17", temp: 195, humid: 102 },
    { device: "NVROX-18", temp: 160, humid: 117 },
    { device: "NVROX-19", temp: 130, humid: 108 },
    { device: "NVROX-20", temp: 175, humid: 95 },
    { device: "NVROX-21", temp: 140, humid: 132 },
    { device: "NVROX-22", temp: 199, humid: 121 },
    { device: "NVROX-23", temp: 183, humid: 110 },
    { device: "NVROX-24", temp: 121, humid: 107 },
    { device: "NVROX-25", temp: 134, humid: 123 },
    { device: "NVROX-26", temp: 169, humid: 92 },
    { device: "NVROX-27", temp: 205, humid: 119 },
    { device: "NVROX-28", temp: 157, humid: 100 },
    { device: "NVROX-29", temp: 190, humid: 105 },
    { device: "NVROX-30", temp: 177, humid: 88 },
];

const chartConfig = {
    temp: {
        label: "Temperature",
        color: "#fbbf24",
    },
    humid: {
        label: "Humidity",
        color: "#f59e0b",
    },
} satisfies ChartConfig;

export function AlertsChart() {
    const validRanges = ["today", "yesterday", "2daysago"] as const;
    type TimeRange = (typeof validRanges)[number];
    const [timeRange, setTimeRange] =
        useState<(typeof validRanges)[number]>("today");
    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden">
            <CardHeader>
                <CardTitle>Device Alarm</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Alarm count for the last 3 days
                    </span>
                    <span className="@[540px]/card:hidden">Last 3 days</span>
                </CardDescription>
                <CardAction className="flex flex-col sm:flex-row gap-4 sm:items-center">
                    <ToggleGroup
                        type="single"
                        variant="outline"
                        value={timeRange}
                        onValueChange={(val) => {
                            if (validRanges.includes(val as TimeRange)) {
                                setTimeRange(val as TimeRange);
                            }
                        }}
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4">
                        <ToggleGroupItem value="today">Today</ToggleGroupItem>
                        <ToggleGroupItem value="yesterday">
                            Yesterday
                        </ToggleGroupItem>
                        <ToggleGroupItem value="2daysago">
                            2 Days Ago
                        </ToggleGroupItem>
                    </ToggleGroup>
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
            <CardContent className="flex flex-col flex-1 justify-center items-center overflow-x-auto overflow-y-auto sm:px-4 pt-2 sm:pt-3">
                <ChartContainer
                    config={chartConfig}
                    className="h-[40vh] sm:h-[360px] w-full">
                    <BarChart
                        data={chartData}
                        margin={{
                            top: 0,
                            right: 10,
                            left: -20,
                            bottom: 30,
                        }}>
                        <XAxis
                            dataKey="device"
                            tickLine={true}
                            interval={0}
                            tickMargin={5}
                            axisLine={true}
                            tick={({ x, y, payload }) => (
                                <text
                                    x={x}
                                    y={y + 10}
                                    textAnchor="end"
                                    transform={`rotate(-45, ${x}, ${y})`}
                                    fontSize={12}>
                                    {payload.value}
                                </text>
                            )}
                        />
                        <YAxis
                            stroke={chartConfig.temp.color}
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[0, 100]}
                        />
                        <ChartTooltip
                            content={<ChartTooltipContent indicator="dot" />}
                        />
                        <Bar
                            dataKey="temp"
                            fill={chartConfig.temp.color}
                            radius={4}
                        />
                        <Bar
                            dataKey="humid"
                            fill={chartConfig.humid.color}
                            radius={4}
                        />
                    </BarChart>
                </ChartContainer>
                <CardFooter className="flex justify-center text-sm gap-4 mt-10">
                    <div className="flex items-center gap-2">
                        <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: chartConfig.temp.color }}
                        />
                        <span className="text-muted-foreground">
                            Temperature Alarm
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: chartConfig.humid.color }}
                        />
                        <span className="text-muted-foreground">
                            Humidity Alarm
                        </span>
                    </div>
                </CardFooter>
            </CardContent>
            <AlertsDataTable />
        </Card>
    );
}
