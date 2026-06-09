"use client";
import { useState, useEffect, useMemo } from "react";
import { Bar, BarChart, XAxis, YAxis, LabelList } from "recharts";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartLegend,
    ChartLegendContent,
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
import axios from "axios";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Loader2 } from "lucide-react";

type AlertData = {
    device: string;
    mac_address: string;
    temp: number;
    humid: number;
};

type ChartPoint = {
    device_name: string;
    temperature: number;
    humidity: number;
};

const chartConfig = {
    temperature: { label: "Temperature", color: "#ff0000" },
    humidity: { label: "Humidity", color: "#ff5454" },
} satisfies ChartConfig;

const validRanges = ["daily", "weekly", "monthly", "yearly"] as const;
type TimeRange = (typeof validRanges)[number];

export function AlertsChart() {
    const [timeRange, setTimeRange] = useState<TimeRange>("daily");
    const [alertSum, setAlertSum] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasLoaded, setHasLoaded] = useState(false);

    const sortedAlertSum = useMemo(() => {
        return [...alertSum].sort(
            (a, b) => b.temperature + b.humidity - (a.temperature + a.humidity),
        );
    }, [alertSum]);

    useEffect(() => {
        setIsLoading(true);
        axios
            .get(
                `${import.meta.env.VITE_API_BASE_URL}/sensor-data/alerts-sum`,
                {
                    params: { range: timeRange },
                },
            )
            .then((res) => {
                const data: ChartPoint[] = (res.data as AlertData[]).map(
                    (d) => ({
                        device_name: d.device,
                        temperature: d.temp || 0,
                        humidity: d.humid || 0,
                    }),
                );
                setAlertSum(data);
            })
            .catch((err) => {
                console.error("Failed to fetch alerts summary", err);
                setAlertSum([]);
            })
            .finally(() => {
                setIsLoading(false);
                setHasLoaded(true);
            });
    }, [timeRange]);

    return (
        <Card className="@container/card flex-1 h-full overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Device Alerts</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Alert frequency per device
                    </span>
                    <span className="@[540px]/card:hidden">
                        Alert frequency
                    </span>
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
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4"
                    >
                        <ToggleGroupItem value="daily">Today</ToggleGroupItem>
                        <ToggleGroupItem value="weekly">Weekly</ToggleGroupItem>
                        <ToggleGroupItem value="monthly">
                            Monthly
                        </ToggleGroupItem>
                        <ToggleGroupItem value="yearly">Yearly</ToggleGroupItem>
                    </ToggleGroup>
                    <Select
                        value={timeRange}
                        onValueChange={(val) => {
                            if (validRanges.includes(val as TimeRange)) {
                                setTimeRange(val as TimeRange);
                            }
                        }}
                    >
                        <SelectTrigger
                            className="flex w-40 @[767px]/card:hidden"
                            size="sm"
                        >
                            <SelectValue placeholder="Select range" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="today" className="rounded-lg">
                                Today
                            </SelectItem>
                            <SelectItem value="weekly" className="rounded-lg">
                                Weekly
                            </SelectItem>
                            <SelectItem value="monthly" className="rounded-lg">
                                Monthly
                            </SelectItem>
                            <SelectItem value="yearly" className="rounded-lg">
                                Yearly
                            </SelectItem>
                        </SelectContent>
                    </Select>
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 overflow-x-auto mb-2">
                {isLoading ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                        >
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Loading chart...
                        </Badge>
                    </div>
                ) : !hasLoaded ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                ) : alertSum.length === 0 ||
                  alertSum.every(
                      (item) => item.temperature === 0 && item.humidity === 0,
                  ) ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-green-500 text-green-600 dark:border-green-400 dark:text-green-400"
                        >
                            <CheckCircle className="w-4 h-4 me-1.5" />
                            All devices operating normally
                        </Badge>
                    </div>
                ) : (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="w-full"
                            style={{
                                height: Math.max(
                                    600,
                                    sortedAlertSum.length * 25,
                                ),
                            }}
                        >
                            <BarChart
                                data={sortedAlertSum}
                                margin={{
                                    top: 25,
                                    right: 10,
                                    left: -20,
                                    bottom: 30,
                                }}
                            >
                                <XAxis
                                    dataKey="device_name"
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
                                            fontSize={12}
                                        >
                                            {payload.value}
                                        </text>
                                    )}
                                />
                                <YAxis
                                    stroke={chartConfig.temperature.color}
                                    fontSize={12}
                                    tickLine={true}
                                    axisLine={false}
                                    domain={[
                                        (dataMin: number) =>
                                            Math.max(0, dataMin - 5),
                                        (dataMax: number) => dataMax + 5,
                                    ]}
                                />
                                <ChartTooltip
                                    content={
                                        <ChartTooltipContent indicator="dot" />
                                    }
                                />
                                <ChartLegend
                                    className="-mt-5 mb-6"
                                    verticalAlign="top"
                                    align="center"
                                    height={0}
                                    iconType="circle"
                                    content={<ChartLegendContent />}
                                />
                                <Bar
                                    dataKey="temperature"
                                    fill={chartConfig.temperature.color}
                                    radius={2}
                                    isAnimationActive={false}
                                >
                                    <LabelList
                                        dataKey="temperature"
                                        position="top"
                                        fontSize={11}
                                        formatter={(val: number) =>
                                            val > 0 ? val : ""
                                        }
                                    />
                                </Bar>
                                <Bar
                                    dataKey="humidity"
                                    fill={chartConfig.humidity.color}
                                    radius={2}
                                    isAnimationActive={false}
                                >
                                    <LabelList
                                        dataKey="humidity"
                                        position="top"
                                        fontSize={11}
                                        formatter={(val: number) =>
                                            val > 0 ? val : ""
                                        }
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
