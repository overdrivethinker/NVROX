"use client";

import { useEffect, useState, useMemo } from "react";
import { useTheme } from "@/hooks/use-theme";
import {
    CartesianGrid,
    XAxis,
    YAxis,
    ReferenceLine,
    Line,
    LineChart,
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
import {
    AlertTriangle,
    Droplet,
    Loader2,
    Thermometer,
    Database,
} from "lucide-react";
type ChartPoint = {
    datetime: string;
    tempMin: number;
    tempMax: number;
    tempAvg: number;
    humidMin: number;
    humidMax: number;
    humidAvg: number;
    sampleCount: number;
};

type SensorHourlyData = {
    label: string;
    min_temp: string;
    max_temp: string;
    avg_temp: string;
    min_humid: string;
    max_humid: string;
    avg_humid: string;
    sample_count: string;
};

type Device = {
    device_name: string;
    mac_address: string;
    location: string;
};

export function EnvironmentTrends() {
    const { theme } = useTheme();
    const isDark = theme === "dark";
    const chartConfig = {
        temp: {
            label: "Temperature (°C)",
            color: isDark ? "#3b82f6" : "#0ea5e9",
        },
        humid: {
            label: "Humidity (%)",
            color: isDark ? "#34d399" : "#10b981",
        },
        avg: {
            color: isDark ? "#fde047" : "#f59e0b",
        },
    } satisfies ChartConfig;

    type Limits = {
        tempMin: number;
        tempMax: number;
        humidMin: number;
        humidMax: number;
    };

    const [limits, setLimits] = useState<Limits>({
        tempMin: 0,
        tempMax: 100,
        humidMin: 0,
        humidMax: 100,
    });

    const validRanges = ["daily", "weekly", "monthly", "yearly"] as const;
    type TimeRange = (typeof validRanges)[number];
    const [timeRange, setTimeRange] =
        useState<(typeof validRanges)[number]>("daily");
    const [selectedMac, setSelectedMac] = useState<string>("");
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [delayedLoading, setDelayedLoading] = useState(false);
    const [noDevice, setNoDevice] = useState(false);
    const [alarmCount, setAlarmCount] = useState({ temp: 0, humid: 0 });

    const handleDevicesLoaded = (devices: Device[]) => {
        if (devices.length === 0) {
            setNoDevice(true);
        } else if (!selectedMac) {
            setSelectedMac(devices[0].mac_address);
        }
    };
    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setDelayedLoading(true);
        axios
            .get(`${import.meta.env.VITE_API_BASE_URL}/devices/threshold`, {
                params: {
                    mac: selectedMac,
                },
            })
            .then((res) => {
                setLimits(res.data);
            })
            .catch((err) => {
                console.error("Failed to fetch limits", err);
            });

        axios
            .get(
                `${import.meta.env.VITE_API_BASE_URL}/sensor-data/alerts-sum`,
                {
                    params: { range: timeRange },
                },
            )
            .then((res) => {
                const found = (
                    res.data as {
                        device: string;
                        mac_address: string;
                        temp: number;
                        humid: number;
                    }[]
                ).find((d) => d.mac_address === selectedMac);
                setAlarmCount(
                    found
                        ? { temp: found.temp, humid: found.humid }
                        : { temp: 0, humid: 0 },
                );
            })
            .catch(() => setAlarmCount({ temp: 0, humid: 0 }));

        const delayTimeout = setTimeout(() => {
            setDelayedLoading(false);
        }, 1000);

        axios
            .get(import.meta.env.VITE_API_BASE_URL + "/sensor-data/summary", {
                params: {
                    mac_address: selectedMac,
                    range: timeRange,
                },
            })
            .then((res) => {
                console.log("full response:", res.data);
                console.log("first item:", res.data.data?.[0]);
                const parsed = (res.data.data as SensorHourlyData[]).map(
                    (item) => ({
                        datetime: item.label,
                        sampleCount: parseInt(item.sample_count),
                        tempMin: parseFloat(item.min_temp),
                        tempMax: parseFloat(item.max_temp),
                        tempAvg: parseFloat(
                            parseFloat(item.avg_temp).toFixed(2),
                        ),
                        humidMin: parseFloat(item.min_humid),
                        humidMax: parseFloat(item.max_humid),
                        humidAvg: parseFloat(
                            parseFloat(item.avg_humid).toFixed(2),
                        ),
                    }),
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

    const summary = useMemo(() => {
        if (!chartData.length) {
            return {
                avgTemp: 0,
                minTemp: 0,
                maxTemp: 0,
                avgHumid: 0,
                minHumid: 0,
                maxHumid: 0,
                status: "No Data",
                thresholdExceeded: false,
                sampleCount: 0,
            };
        }

        const totalSamples = chartData.reduce(
            (sum, item) => sum + item.sampleCount,
            0,
        );

        const avgTemp =
            totalSamples > 0
                ? chartData.reduce(
                      (sum, item) => sum + item.tempAvg * item.sampleCount,
                      0,
                  ) / totalSamples
                : 0;

        const avgHumid =
            totalSamples > 0
                ? chartData.reduce(
                      (sum, item) => sum + item.humidAvg * item.sampleCount,
                      0,
                  ) / totalSamples
                : 0;

        const minTemp = Math.min(...chartData.map((d) => d.tempMin));
        const maxTemp = Math.max(...chartData.map((d) => d.tempMax));

        const minHumid = Math.min(...chartData.map((d) => d.humidMin));
        const maxHumid = Math.max(...chartData.map((d) => d.humidMax));

        const thresholdExceeded =
            maxTemp > limits.tempMax ||
            minTemp < limits.tempMin ||
            maxHumid > limits.humidMax ||
            minHumid < limits.humidMin;

        return {
            avgTemp,
            minTemp,
            maxTemp,
            avgHumid,
            minHumid,
            maxHumid,
            thresholdExceeded,
            totalSamples,
        };
    }, [chartData, limits]);

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Environmental Trends</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Temperature and humidity trends by device
                    </span>
                    <span className="@[540px]/card:hidden">Device trends</span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    <DeviceSelector
                        value={selectedMac}
                        onChange={setSelectedMac}
                        onDevicesLoaded={handleDevicesLoaded}
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
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4"
                    >
                        <ToggleGroupItem value="daily">Daily</ToggleGroupItem>
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
                            <SelectItem value="daily" className="rounded-lg">
                                Daily
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
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 px-6">
                <Card className="bg-transparent border-1 shadow-none">
                    <CardHeader>
                        <CardDescription>Average Temperature</CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {summary.avgTemp.toFixed(2)}°C
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Min{" "}
                            <span className="font-medium text-blue-500">
                                {summary.minTemp.toFixed(2)}°
                            </span>{" "}
                            - Max{" "}
                            <span className="font-medium text-red-500">
                                {summary.maxTemp.toFixed(2)}°
                            </span>
                        </div>
                        <CardAction>
                            <Thermometer />
                        </CardAction>
                    </CardHeader>
                </Card>

                <Card className="bg-transparent border shadow-none">
                    <CardHeader>
                        <CardDescription>Average Humidity</CardDescription>

                        <CardTitle className="text-2xl font-bold">
                            {summary.avgHumid.toFixed(2)}%
                        </CardTitle>

                        <div className="text-sm text-muted-foreground">
                            Min{" "}
                            <span className="font-medium text-blue-500">
                                {summary.minHumid.toFixed(2)}%
                            </span>{" "}
                            - Max{" "}
                            <span className="font-medium text-red-500">
                                {summary.maxHumid.toFixed(2)}%
                            </span>
                        </div>

                        <CardAction>
                            <Droplet />
                        </CardAction>
                    </CardHeader>
                </Card>

                <Card className="bg-transparent border shadow-none">
                    <CardHeader>
                        <CardDescription>Threshold Alarms</CardDescription>

                        <CardTitle
                            className={`text-2xl font-bold ${
                                alarmCount.temp + alarmCount.humid > 0
                                    ? "text-amber-500"
                                    : "text-green-500"
                            }`}
                        >
                            {alarmCount.temp + alarmCount.humid}
                        </CardTitle>

                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                                <Thermometer className="h-3 w-3 text-blue-400" />
                                <span className="text-blue-500 font-medium">
                                    {alarmCount.temp}
                                </span>
                            </div>

                            <span>|</span>

                            <div className="flex items-center gap-1">
                                <Droplet className="h-3 w-3 text-green-500" />
                                <span className="text-green-300 font-medium">
                                    {alarmCount.humid}
                                </span>
                            </div>
                        </div>

                        <CardAction>
                            <AlertTriangle />
                        </CardAction>
                    </CardHeader>
                </Card>
                <Card className="bg-transparent border shadow-none">
                    <CardHeader>
                        <CardDescription>Sample Count</CardDescription>
                        <CardTitle className="text-2xl font-bold">
                            {chartData.reduce(
                                (sum, item) => sum + item.sampleCount,
                                0,
                            )}
                        </CardTitle>
                        <div className="text-sm text-muted-foreground">
                            Total data points recorded
                        </div>
                        <CardAction>
                            <Database />
                        </CardAction>
                    </CardHeader>
                </Card>
            </div>
            <CardContent className="flex flex-col flex-1 overflow-x-auto mb-2">
                {noDevice ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-red-400 text-red-500 dark:border-red-700 dark:text-red-400"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No devices registered
                        </Badge>
                    </div>
                ) : !selectedMac || isLoading || delayedLoading ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                        >
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Loading chart...
                        </Badge>
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex justify-center items-center min-h-full w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-yellow-500 text-yellow-600 dark:border-yellow-900 dark:text-yellow-300"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No data available
                        </Badge>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 xl:grid-cols-2 w-full">
                            {/* Temperature Chart */}
                            <div>
                                <div className="text-xs text-muted-foreground mb-6">
                                    Temperature (°C)
                                </div>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[300px] w-full -ml-8"
                                >
                                    <LineChart data={chartData}>
                                        <defs>
                                            <linearGradient
                                                id="fillTemp"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor={
                                                        chartConfig.temp.color
                                                    }
                                                    stopOpacity={0.1}
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
                                            tickFormatter={(value) => {
                                                if (timeRange === "daily") {
                                                    // "2025-06-01" → "01"
                                                    return value.split("-")[2];
                                                } else if (
                                                    timeRange === "weekly"
                                                ) {
                                                    // "2025-W23" → "W23"
                                                    return value.split("-")[1];
                                                } else if (
                                                    timeRange === "monthly"
                                                ) {
                                                    // "2025-06" → "Jun"
                                                    const [year, month] =
                                                        value.split("-");
                                                    return new Date(
                                                        parseInt(year),
                                                        parseInt(month) - 1,
                                                    ).toLocaleString("en-US", {
                                                        month: "short",
                                                    });
                                                } else if (
                                                    timeRange === "yearly"
                                                ) {
                                                    // "2025" → "2025"
                                                    return value;
                                                }
                                                return value;
                                            }}
                                            tick={{ dy: 15 }}
                                            fontSize={15}
                                        />
                                        <YAxis
                                            stroke={chartConfig.temp.color}
                                            fontSize={15}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[
                                                limits.tempMin - 10,
                                                limits.tempMax + 10,
                                            ]}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            defaultIndex={10}
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) => {
                                                        if (
                                                            timeRange ===
                                                            "daily"
                                                        )
                                                            return `Date: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "weekly"
                                                        )
                                                            return `Week: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "monthly"
                                                        )
                                                            return `Month: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "yearly"
                                                        )
                                                            return `Year: ${value}`;
                                                        return value;
                                                    }}
                                                    indicator="dot"
                                                />
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="tempMax"
                                            stroke={chartConfig.temp.color}
                                            fill="url(#fillTemp)"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="tempAvg"
                                            stroke={chartConfig.avg.color}
                                            fill="url(#fillTemp)"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="tempMin"
                                            stroke={chartConfig.temp.color}
                                            fillOpacity={0}
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <ReferenceLine
                                            y={limits.tempMax}
                                            stroke="red"
                                            strokeDasharray="5 15"
                                            strokeWidth={2}
                                            label={{
                                                value: "MAX",
                                                position: "right",
                                                fill: "#ff0000",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                offset: -30,
                                            }}
                                        />
                                        <ReferenceLine
                                            y={limits.tempMin}
                                            stroke="blue"
                                            strokeDasharray="5 15"
                                            strokeWidth={2}
                                            label={{
                                                value: "MIN",
                                                position: "right",
                                                fill: "#0000ff",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                offset: -30,
                                            }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                            <div>
                                <div className="ml-8 text-xs text-muted-foreground mb-6">
                                    Humidity (%)
                                </div>
                                <ChartContainer
                                    config={chartConfig}
                                    className="h-[300px] w-full"
                                >
                                    <LineChart data={chartData}>
                                        <defs>
                                            <linearGradient
                                                id="fillHumid"
                                                x1="0"
                                                y1="0"
                                                x2="0"
                                                y2="1"
                                            >
                                                <stop
                                                    offset="5%"
                                                    stopColor={
                                                        chartConfig.humid.color
                                                    }
                                                    stopOpacity={0.1}
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
                                            tickFormatter={(value) => {
                                                if (timeRange === "daily") {
                                                    // "2025-06-01" → "01"
                                                    return value.split("-")[2];
                                                } else if (
                                                    timeRange === "weekly"
                                                ) {
                                                    // "2025-W23" → "W23"
                                                    return value.split("-")[1];
                                                } else if (
                                                    timeRange === "monthly"
                                                ) {
                                                    // "2025-06" → "Jun"
                                                    const [year, month] =
                                                        value.split("-");
                                                    return new Date(
                                                        parseInt(year),
                                                        parseInt(month) - 1,
                                                    ).toLocaleString("en-US", {
                                                        month: "short",
                                                    });
                                                } else if (
                                                    timeRange === "yearly"
                                                ) {
                                                    // "2025" → "2025"
                                                    return value;
                                                }
                                                return value;
                                            }}
                                            tick={{ dy: 15 }}
                                            fontSize={15}
                                        />
                                        <YAxis
                                            stroke={chartConfig.humid.color}
                                            fontSize={15}
                                            tickLine={false}
                                            axisLine={false}
                                            domain={[
                                                limits.humidMin - 20,
                                                limits.humidMax + 20,
                                            ]}
                                        />
                                        <ChartTooltip
                                            cursor={false}
                                            defaultIndex={10}
                                            content={
                                                <ChartTooltipContent
                                                    labelFormatter={(value) => {
                                                        if (
                                                            timeRange ===
                                                            "daily"
                                                        )
                                                            return `Date: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "weekly"
                                                        )
                                                            return `Week: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "monthly"
                                                        )
                                                            return `Month: ${value}`;
                                                        if (
                                                            timeRange ===
                                                            "yearly"
                                                        )
                                                            return `Year: ${value}`;
                                                        return value;
                                                    }}
                                                    indicator="dot"
                                                />
                                            }
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="humidMax"
                                            stroke={chartConfig.humid.color}
                                            fill="url(#fillHumid)"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="humidAvg"
                                            stroke={chartConfig.avg.color}
                                            fill="url(#fillHumid)"
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <Line
                                            type="monotone"
                                            dataKey="humidMin"
                                            stroke={chartConfig.humid.color}
                                            fillOpacity={0}
                                            dot={false}
                                            strokeWidth={2}
                                        />
                                        <ReferenceLine
                                            y={limits.humidMax}
                                            stroke="red"
                                            strokeDasharray="5 15"
                                            strokeWidth={2}
                                            label={{
                                                value: "MAX",
                                                position: "right",
                                                fill: "#ff0000",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                offset: -30,
                                            }}
                                        />
                                        <ReferenceLine
                                            y={limits.humidMin}
                                            stroke="blue"
                                            strokeDasharray="5 15"
                                            strokeWidth={2}
                                            label={{
                                                value: "MIN",
                                                position: "right",
                                                fill: "#0000ff",
                                                fontSize: 12,
                                                fontWeight: 600,
                                                offset: -30,
                                            }}
                                        />
                                    </LineChart>
                                </ChartContainer>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}
