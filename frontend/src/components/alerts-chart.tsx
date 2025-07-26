"use client";
import { useState, useEffect, useMemo } from "react";
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
export const description = "A multiple bar chart";
import axios from "axios";
import io from "socket.io-client";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Loader2 } from "lucide-react";

type Device = {
    device_name: string;
    mac_address: string;
    location: string;
    status: string;
    created_at: string;
    updated_at: string;
};

type AlertData = {
    device: string;
    temp: number;
    humid: number;
};

type ChartPoint = {
    device_name: string;
    temperature: number;
    humidity: number;
};

const chartConfig = {
    temp: {
        label: "Temperature",
        color: "#fca5a5",
    },
    humid: {
        label: "Humidity",
        color: "#ef4444",
    },
} satisfies ChartConfig;

export function AlertsChart() {
    const validRanges = ["today", "yesterday", "2daysago"] as const;
    type TimeRange = (typeof validRanges)[number];
    const [timeRange, setTimeRange] =
        useState<(typeof validRanges)[number]>("today");
    const [alertSum, setAlertSum] = useState<ChartPoint[]>([]);
    const [devices, setDevices] = useState<Device[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [delayedLoading, setDelayedLoading] = useState(false);

    useEffect(() => {
        setIsLoading(true);
        setDelayedLoading(true);
        const delayTimeout = setTimeout(() => {
            setDelayedLoading(false);
        }, 1000);
        axios
            .get(import.meta.env.VITE_API_BASE_URL + "/devices/list")
            .then((res) => {
                setDevices(res.data);
                const initialChartData: ChartPoint[] = res.data.map(
                    (device: Device) => ({
                        device_name: device.device_name,
                        temperature: 0,
                        humidity: 0,
                    })
                );
                setAlertSum(initialChartData);
            })
            .catch((err) => console.error("Error fetching devices", err));
        return () => clearTimeout(delayTimeout);
    }, []);

    const deviceMap = useMemo(() => {
        const map: Record<string, string> = {};
        devices.forEach((device) => {
            map[device.mac_address] = device.device_name;
        });
        return map;
    }, [devices]);

    useEffect(() => {
        if (devices.length === 0) return;
        setIsLoading(true);
        axios
            .get(`${import.meta.env.VITE_API_BASE_URL}/devices/alerts-sum`, {
                params: { range: timeRange },
            })
            .then((res) => {
                const chartData: ChartPoint[] = devices.map((device) => {
                    const alertData = res.data.find(
                        (d: AlertData) => d.device === device.device_name
                    );
                    return {
                        device_name: device.device_name,
                        temperature: alertData?.temp || 0,
                        humidity: alertData?.humid || 0,
                    };
                });
                setAlertSum(chartData);
            })
            .catch((err) => {
                console.error("Failed to fetch alerts summary", err);
                const resetData: ChartPoint[] = devices.map((device) => ({
                    device_name: device.device_name,
                    temperature: 0,
                    humidity: 0,
                }));
                setAlertSum(resetData);
            })
            .finally(() => {
                setIsLoading(false);
            });
    }, [timeRange, devices]);

    useEffect(() => {
        if (timeRange !== "today" || devices.length === 0) return;

        const socket = io(import.meta.env.VITE_SOCKET_URL);

        function handleRealtimeUpdate(data: {
            mac_address: string;
            temperature: number;
            humidity: number;
        }) {
            const device_name = deviceMap[data.mac_address];
            if (!device_name) return;

            setAlertSum((prev) => {
                return prev.map((item) => {
                    if (item.device_name === device_name) {
                        return {
                            ...item,
                            temperature: item.temperature + data.temperature,
                            humidity: item.humidity + data.humidity,
                        };
                    }
                    return item;
                });
            });
        }

        socket.on("new_alerts", handleRealtimeUpdate);

        return () => {
            socket.off("new_alerts", handleRealtimeUpdate);
            socket.disconnect();
        };
    }, [timeRange, deviceMap, devices.length]);

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden">
            <CardHeader>
                <CardTitle>Device Alerts</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Alerts count for the last 3 days
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
                {isLoading || delayedLoading ? (
                    <div className="flex justify-center items-center min-h-[200px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400">
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Loading chart...
                        </Badge>
                    </div>
                ) : alertSum.length === 0 ||
                  alertSum.every(
                      (item) => item.temperature === 0 && item.humidity === 0
                  ) ? (
                    <div className="flex justify-center items-center min-h-[200px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-yellow-500 text-yellow-600 dark:border-yellow-900 dark:text-yellow-300">
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No data available
                        </Badge>
                    </div>
                ) : (
                    <>
                        <ChartContainer
                            config={chartConfig}
                            className="h-[650px] w-full">
                            <BarChart
                                key={timeRange}
                                data={alertSum}
                                margin={{
                                    top: 0,
                                    right: 10,
                                    left: -20,
                                    bottom: 30,
                                }}>
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
                                            fontSize={12}>
                                            {payload.value}
                                        </text>
                                    )}
                                />
                                <YAxis
                                    stroke={chartConfig.temp.color}
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
                                <Bar
                                    dataKey="temperature"
                                    fill={chartConfig.temp.color}
                                    radius={4}
                                />
                                <Bar
                                    dataKey="humidity"
                                    fill={chartConfig.humid.color}
                                    radius={4}
                                />
                            </BarChart>
                        </ChartContainer>
                        <CardFooter className="flex justify-center text-sm gap-4 mt-10">
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                        backgroundColor: chartConfig.temp.color,
                                    }}
                                />
                                <span className="text-muted-foreground">
                                    Temperature Alerts
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span
                                    className="h-3 w-3 rounded-full"
                                    style={{
                                        backgroundColor:
                                            chartConfig.humid.color,
                                    }}
                                />
                                <span className="text-muted-foreground">
                                    Humidity Alerts
                                </span>
                            </div>
                        </CardFooter>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
