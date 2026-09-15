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
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import {
    AlertTriangle,
    Loader2,
    Droplet,
    Thermometer,
    Activity,
    CheckCircle,
} from "lucide-react";
import io from "socket.io-client";
import axios from "axios";
import { DeviceSelector } from "./device-selector";
import { API_BASE_URL, SOCKET_BASE_URL } from "@/config/api";

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

type Device = {
    device_name: string;
    mac_address: string;
    location: string;
};

type WindowSize = "20" | "50" | "100" | "all";

// 👇 Helper: rotasi label biar gak numpuk saat data banyak
function getXAxisAngle(dataLength: number): number {
    if (dataLength <= 10) return -30;
    if (dataLength <= 30) return -45;
    return -60;
}

// ==================== SPEC PANEL (KANAN) ====================
function SpecPanel({
    unit,
    minLimit,
    maxLimit,
    margin,
    alert,
    icon,
}: {
    unit: string;
    minLimit: number;
    maxLimit: number;
    margin: string;
    alert: boolean;
    icon: React.ReactNode;
}) {
    return (
        <div className="flex flex-col gap-1 rounded-lg border px-2.5 py-1.5 text-sm leading-tight backdrop-blur-sm min-w-[100px]">
            <div className="flex items-center gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                    {icon}
                    Min
                </span>
                <span className="ml-auto font-medium text-blue-500 tabular-nums">
                    {minLimit.toFixed(2)}
                    {unit}
                </span>
            </div>
            <div className="flex items-center gap-1">
                <span className="text-muted-foreground flex items-center gap-1">
                    {icon}
                    Max
                </span>
                <span className="ml-auto font-medium text-red-500 tabular-nums">
                    {maxLimit.toFixed(2)}
                    {unit}
                </span>
            </div>
            <div className="flex items-center gap-1 border-t border-border/60 pt-1">
                <span className="text-muted-foreground flex items-center gap-1">
                    <Activity className="w-2.5 h-2.5" />
                    Margin
                </span>
                <span
                    className={`ml-auto font-medium tabular-nums ${
                        alert ? "text-red-500" : "text-primary"
                    }`}
                >
                    {alert ? "-" : ""}
                    {margin}
                    {unit}
                </span>
            </div>
        </div>
    );
}

// ==================== LIVE STATS ROW (BAWAH) ====================
function LiveStatsRow({
    unit,
    stats,
}: {
    unit: string;
    stats: { max: number; min: number; avg: number; count: number };
}) {
    const items = [
        {
            label: "Live Max",
            value: `${stats.max.toFixed(2)}${unit}`,
            cls: "text-red-500",
        },
        {
            label: "Live Min",
            value: `${stats.min.toFixed(2)}${unit}`,
            cls: "text-blue-500",
        },
        {
            label: "Live Avg",
            value: `${stats.avg.toFixed(2)}${unit}`,
            cls: "text-green-600 dark:text-green-400",
        },
        {
            label: "Samples",
            value: `${stats.count}`,
            cls: "text-foreground",
        },
    ];

    return (
        <div className="grid grid-cols-4 border-t border-border">
            {items.map((it, i) => (
                <div
                    key={i}
                    className={`px-3 py-2 flex flex-col items-center ${
                        i > 0 ? "border-l border-border" : ""
                    }`}
                >
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                        {it.label}
                    </span>
                    <span className={`text-md tabular-nums ${it.cls}`}>
                        {it.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

export function LiveChart() {
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

    const [selectedMac, setSelectedMac] = useState<string>("");
    const [chartData, setChartData] = useState<ChartPoint[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [latestData, setLatestData] = useState<SensorData | null>(null);
    const [isDisconnected, setIsDisconnected] = useState(false);
    const [noDevice, setNoDevice] = useState(false);

    // 👇 Window size sebagai string ("20" | "50" | "100" | "all")
    const [windowSize, setWindowSize] = useState<WindowSize>("20");

    const handleDevicesLoaded = (devices: Device[]) => {
        if (devices.length === 0) {
            setNoDevice(true);
        } else if (!selectedMac) {
            setSelectedMac(devices[0].mac_address);
        }
    };

    const isTempAlert =
        latestData !== null &&
        Number.isFinite(latestData.temperature) &&
        (latestData.temperature < limits.tempMin ||
            latestData.temperature > limits.tempMax);

    const isHumidAlert =
        latestData !== null &&
        Number.isFinite(latestData.humidity) &&
        (latestData.humidity < limits.humidMin ||
            latestData.humidity > limits.humidMax);

    const tempMargin =
        latestData && Number.isFinite(latestData.temperature)
            ? Math.min(
                  Math.abs(latestData.temperature - limits.tempMax),
                  Math.abs(latestData.temperature - limits.tempMin),
              ).toFixed(2)
            : "--";

    const humidMargin =
        latestData && Number.isFinite(latestData.humidity)
            ? Math.min(
                  Math.abs(latestData.humidity - limits.humidMax),
                  Math.abs(latestData.humidity - limits.humidMin),
              ).toFixed(2)
            : "--";

    const calcStats = (arr: number[]) => {
        const clean = arr.filter((n) => Number.isFinite(n));
        if (clean.length === 0) return { max: 0, min: 0, avg: 0, count: 0 };
        return {
            max: Math.max(...clean),
            min: Math.min(...clean),
            avg: clean.reduce((a, b) => a + b, 0) / clean.length,
            count: clean.length,
        };
    };

    const tempStats = calcStats(chartData.map((d) => d.temp));
    const humidStats = calcStats(chartData.map((d) => d.humid));

    const xAngle = getXAxisAngle(chartData.length);

    useEffect(() => {
        setChartData((prev) => {
            if (windowSize === "all") return prev;
            return prev.slice(-Number(windowSize));
        });
    }, [windowSize]);

    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setChartData([]);
        setIsDisconnected(false);

        axios
            .get(`${API_BASE_URL}/devices/threshold`, {
                params: { mac: selectedMac },
            })
            .then((res) => setLimits(res.data))
            .catch((err) => console.error("Failed to fetch limits", err));

        const socket = io(SOCKET_BASE_URL, {
            query: { mac: selectedMac },
        });

        let noDataTimeout: ReturnType<typeof setTimeout>;

        const resetTimeout = () => {
            clearTimeout(noDataTimeout);
            noDataTimeout = setTimeout(() => {
                setIsDisconnected(true);
                setIsLoading(false);
                setChartData([]);
            }, 7_000);
        };

        resetTimeout();

        socket.on("heartbeat", (data: { mac_address: string }) => {
            if (data.mac_address !== selectedMac) return;
            setIsDisconnected(false);
            resetTimeout();
        });

        socket.on("sensor_data", (data: SensorData) => {
            if (data.mac_address !== selectedMac) return;

            const tempNum = Number(data.temperature);
            const humidNum = Number(data.humidity);
            if (!Number.isFinite(tempNum) || !Number.isFinite(humidNum)) {
                console.warn("Invalid sensor data:", data);
                return;
            }

            const point: ChartPoint = {
                datetime: data.recorded_at,
                temp: tempNum,
                humid: humidNum,
            };

            setLatestData({
                ...data,
                temperature: tempNum,
                humidity: humidNum,
            });

            setChartData((prev) => {
                const next = [...prev, point];
                return windowSize === "all"
                    ? next
                    : next.slice(-Number(windowSize));
            });

            setIsLoading(false);
            setIsDisconnected(false);
            resetTimeout();
        });

        return () => {
            socket.disconnect();
            clearTimeout(noDataTimeout);
        };
    }, [selectedMac, windowSize]);

    const StatusDot = ({ alert }: { alert: boolean }) => (
        <div className="relative flex items-center justify-center w-4 h-4">
            <span
                className={`absolute inline-flex h-full w-full rounded-full opacity-50 animate-ping ${
                    alert ? "bg-red-400" : "bg-green-400"
                }`}
            />
            <span
                className={`relative inline-flex w-2.5 h-2.5 rounded-full ${
                    alert ? "bg-red-500" : "bg-green-500"
                }`}
            />
        </div>
    );

    const StatusBadge = ({
        alert,
        value,
        min,
    }: {
        alert: boolean;
        value: number;
        min: number;
        max: number;
    }) =>
        alert ? (
            <Badge
                variant="outline"
                className="border-red-400 text-red-500 dark:border-red-700 dark:text-red-400 gap-1"
            >
                <AlertTriangle className="w-4 h-4" />
                {value < min ? "Under limit" : "Over limit"}
            </Badge>
        ) : (
            <Badge
                variant="outline"
                className="border-green-500 text-green-600 dark:border-green-400 dark:text-green-400 gap-1"
            >
                <CheckCircle className="w-4 h-4" />
                Normal
            </Badge>
        );

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Device Monitoring</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        Real-time environmental monitoring
                    </span>
                    <span className="@[540px]/card:hidden">Live chart</span>
                </CardDescription>
                <CardAction className="flex flex-col sm:flex-row gap-2 sm:items-center">
                    {/* 👇 Sampling size Select */}
                    <div className="hidden @[767px]/card:flex items-center gap-2">
                        <Select
                            value={windowSize}
                            onValueChange={(v) =>
                                setWindowSize(v as WindowSize)
                            }
                        >
                            <SelectTrigger className="w-auto min-w-[150px]">
                                <SelectValue placeholder="Select size" />
                            </SelectTrigger>
                            <SelectContent
                                className="max-w-[300px] min-w-[var(--radix-select-trigger-width)] max-h-[200px] overflow-y-auto"
                                position="popper"
                            >
                                <SelectItem value="20">20 Samples</SelectItem>
                                <SelectItem value="50">50 Samples</SelectItem>
                                <SelectItem value="100">100 Samples</SelectItem>
                                <SelectItem value="all">All Samples</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <DeviceSelector
                        value={selectedMac}
                        onChange={setSelectedMac}
                        onDevicesLoaded={handleDevicesLoaded}
                    />
                </CardAction>
            </CardHeader>
            <CardContent className="flex flex-1 justify-center overflow-x-auto overflow-y-auto px-4 sm:px-6 mb-0">
                {noDevice ? (
                    <div className="flex justify-center items-center w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-red-400 text-red-500 dark:border-red-700 dark:text-red-400"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No devices registered
                        </Badge>
                    </div>
                ) : !selectedMac || isLoading ? (
                    <div className="flex justify-center items-center w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                        >
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Waiting for live data...
                        </Badge>
                    </div>
                ) : isDisconnected ? (
                    <div className="flex justify-center items-center w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-yellow-500 text-yellow-600 dark:border-yellow-900 dark:text-yellow-300"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            Lost Connection
                        </Badge>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-4 w-full">
                        {/* ==================== Temperature ==================== */}
                        <div className="w-full lg:w-1/2">
                            <div className="rounded-lg border border-border overflow-hidden mb-4">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <StatusDot alert={isTempAlert} />
                                        <span className="text-sm font-medium">
                                            Temperature
                                        </span>
                                    </div>
                                    <StatusBadge
                                        alert={isTempAlert}
                                        value={latestData?.temperature ?? 0}
                                        min={limits.tempMin}
                                        max={limits.tempMax}
                                    />
                                </div>

                                <div className="relative flex items-center justify-between gap-3 px-4 py-4">
                                    {isTempAlert && (
                                        <span className="absolute inset-0 bg-red-600 animate-pulse pointer-events-none" />
                                    )}
                                    <div className="relative flex-1 flex items-center justify-center">
                                        <div className="text-[clamp(2rem,6vw,5rem)] font-medium leading-none text-primary">
                                            {latestData?.temperature != null &&
                                            Number.isFinite(
                                                latestData.temperature,
                                            )
                                                ? `${Number(latestData.temperature).toFixed(2)}°C`
                                                : "--"}
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <SpecPanel
                                            unit="°C"
                                            minLimit={limits.tempMin}
                                            maxLimit={limits.tempMax}
                                            margin={tempMargin}
                                            alert={isTempAlert}
                                            icon={
                                                <Thermometer className="w-3 h-3" />
                                            }
                                        />
                                    </div>
                                </div>

                                <LiveStatsRow unit="°C" stats={tempStats} />
                            </div>

                            <ChartContainer
                                config={chartConfig}
                                className="min-h-[300px] max-h-[430px] w-full"
                            >
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -10,
                                        bottom: 50,
                                    }}
                                >
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
                                        interval="preserveStartEnd"
                                        angle={xAngle}
                                        tick={({ x, y, payload }) => (
                                            <text
                                                x={x}
                                                y={y + 10}
                                                textAnchor="end"
                                                transform={`rotate(${xAngle}, ${x}, ${y})`}
                                                fontSize={14}
                                            >
                                                {new Date(
                                                    payload.value,
                                                ).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: false,
                                                })}
                                            </text>
                                        )}
                                    />
                                    <YAxis
                                        stroke={chartConfig.temp.color}
                                        fontSize={14}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[
                                            limits.tempMin - 10,
                                            limits.tempMax + 10,
                                        ]}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) =>
                                                    new Date(
                                                        value,
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "long",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        },
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
                                </AreaChart>
                            </ChartContainer>
                        </div>

                        {/* ==================== Humidity ==================== */}
                        <div className="w-full lg:w-1/2">
                            <div className="rounded-lg border border-border overflow-hidden mb-4">
                                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                                    <div className="flex items-center gap-2">
                                        <StatusDot alert={isHumidAlert} />
                                        <span className="text-sm font-medium">
                                            Humidity
                                        </span>
                                    </div>
                                    <StatusBadge
                                        alert={isHumidAlert}
                                        value={latestData?.humidity ?? 0}
                                        min={limits.humidMin}
                                        max={limits.humidMax}
                                    />
                                </div>

                                <div className="relative flex items-center justify-between gap-3 px-4 py-4">
                                    {isHumidAlert && (
                                        <span className="absolute inset-0 bg-red-600 animate-pulse pointer-events-none" />
                                    )}
                                    <div className="relative flex-1 flex items-center justify-center">
                                        <div className="text-[clamp(2rem,6vw,5rem)] font-medium leading-none text-primary">
                                            {latestData?.humidity != null &&
                                            Number.isFinite(latestData.humidity)
                                                ? `${Number(latestData.humidity).toFixed(2)}%`
                                                : "--"}
                                        </div>
                                    </div>
                                    <div className="relative shrink-0">
                                        <SpecPanel
                                            unit="%"
                                            minLimit={limits.humidMin}
                                            maxLimit={limits.humidMax}
                                            margin={humidMargin}
                                            alert={isHumidAlert}
                                            icon={
                                                <Droplet className="w-3 h-3" />
                                            }
                                        />
                                    </div>
                                </div>

                                <LiveStatsRow unit="%" stats={humidStats} />
                            </div>

                            <ChartContainer
                                config={chartConfig}
                                className="min-h-[300px] max-h-[430px] w-full"
                            >
                                <AreaChart
                                    data={chartData}
                                    margin={{
                                        top: 10,
                                        right: 10,
                                        left: -10,
                                        bottom: 50,
                                    }}
                                >
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
                                        interval="preserveStartEnd"
                                        angle={xAngle}
                                        tick={({ x, y, payload }) => (
                                            <text
                                                x={x}
                                                y={y + 10}
                                                textAnchor="end"
                                                transform={`rotate(${xAngle}, ${x}, ${y})`}
                                                fontSize={14}
                                            >
                                                {new Date(
                                                    payload.value,
                                                ).toLocaleTimeString("en-US", {
                                                    hour: "2-digit",
                                                    minute: "2-digit",
                                                    second: "2-digit",
                                                    hour12: false,
                                                })}
                                            </text>
                                        )}
                                    />
                                    <YAxis
                                        stroke={chartConfig.humid.color}
                                        fontSize={14}
                                        tickLine={false}
                                        axisLine={false}
                                        domain={[
                                            limits.humidMin - 20,
                                            limits.humidMax + 20,
                                        ]}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={
                                            <ChartTooltipContent
                                                labelFormatter={(value) =>
                                                    new Date(
                                                        value,
                                                    ).toLocaleDateString(
                                                        "en-US",
                                                        {
                                                            month: "short",
                                                            day: "numeric",
                                                            hour: "2-digit",
                                                            minute: "2-digit",
                                                            second: "2-digit",
                                                            hour12: false,
                                                        },
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
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
