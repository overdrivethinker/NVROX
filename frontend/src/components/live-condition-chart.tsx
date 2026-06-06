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

    const handleDevicesLoaded = (devices: Device[]) => {
        if (devices.length === 0) {
            setNoDevice(true);
        } else if (!selectedMac) {
            setSelectedMac(devices[0].mac_address);
        }
    };

    const isTempAlert =
        latestData !== null &&
        (latestData.temperature < limits.tempMin ||
            latestData.temperature > limits.tempMax);

    const isHumidAlert =
        latestData !== null &&
        (latestData.humidity < limits.humidMin ||
            latestData.humidity > limits.humidMax);

    const tempMargin = latestData
        ? Math.min(
              Math.abs(latestData.temperature - limits.tempMax),
              Math.abs(latestData.temperature - limits.tempMin),
          ).toFixed(2)
        : "--";

    const humidMargin = latestData
        ? Math.min(
              Math.abs(latestData.humidity - limits.humidMax),
              Math.abs(latestData.humidity - limits.humidMin),
          ).toFixed(2)
        : "--";

    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setChartData([]);
        setIsDisconnected(false);

        axios
            .get(`${import.meta.env.VITE_API_BASE_URL}/devices/threshold`, {
                params: { mac: selectedMac },
            })
            .then((res) => setLimits(res.data))
            .catch((err) => console.error("Failed to fetch limits", err));

        const socket = io(import.meta.env.VITE_SOCKET_URL, {
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

            const point: ChartPoint = {
                datetime: data.recorded_at,
                temp: data.temperature,
                humid: data.humidity,
            };

            setLatestData(data);
            setChartData((prev) => [...prev.slice(-20), point]);
            setIsLoading(false);
            setIsDisconnected(false);
            resetTimeout();
        });

        return () => {
            socket.disconnect();
            clearTimeout(noDataTimeout);
        };
    }, [selectedMac]);

    // Reusable status dot
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

    // Reusable status badge
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
                <CardAction className="flex flex-col sm:flex-row gap-4 sm:items-center">
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
                        {/* Temperature */}
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
                                <div className="relative flex items-center justify-center px-4 py-4">
                                    {isTempAlert && (
                                        <span className="absolute inset-0 bg-red-600 animate-pulse pointer-events-none" />
                                    )}
                                    <div className="relative text-[clamp(2rem,6vw,5rem)] font-medium leading-none text-primary">
                                        {latestData?.temperature != null
                                            ? `${Number(latestData.temperature).toFixed(2)}°C`
                                            : "--"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 border-t border-border">
                                    <div className="px-4 py-2 flex items-center flex-col">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Thermometer className="w-3 h-3 text-blue-500" />
                                            Min limit
                                        </span>
                                        <span className="text-sm font-medium text-blue-500">
                                            {Number(limits.tempMin).toFixed(2)}
                                            °C
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 flex flex-col border-x  items-center border-border">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Thermometer className="w-3 h-3 text-red-500" />
                                            Max limit
                                        </span>
                                        <span className="text-sm font-medium text-red-500">
                                            {Number(limits.tempMax).toFixed(2)}
                                            °C
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 flex items-center flex-col">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            Margin
                                        </span>
                                        <span
                                            className={`text-sm font-medium ${isTempAlert ? "text-red-500" : "text-primary"}`}
                                        >
                                            {isTempAlert
                                                ? `-${tempMargin}`
                                                : `${tempMargin}`}
                                            °C
                                        </span>
                                    </div>
                                </div>
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
                                        left: -30,
                                        bottom: 20,
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
                                        interval={0}
                                        tick={({ x, y, payload }) => (
                                            <text
                                                x={x}
                                                y={y + 10}
                                                textAnchor="end"
                                                transform={`rotate(-45, ${x}, ${y})`}
                                                fontSize={12}
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

                        {/* Humidity */}
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
                                <div className="relative flex items-center justify-center px-4 py-4">
                                    {isHumidAlert && (
                                        <span className="absolute inset-0 bg-red-600 animate-pulse pointer-events-none" />
                                    )}
                                    <div className="relative text-[clamp(2rem,6vw,5rem)] font-medium leading-none text-primary">
                                        {latestData?.humidity != null
                                            ? `${Number(latestData.humidity).toFixed(2)}%`
                                            : "--"}
                                    </div>
                                </div>
                                <div className="grid grid-cols-3 border-t border-border">
                                    <div className="px-4 py-2 flex items-center flex-col">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Droplet className="w-3 h-3 text-blue-500" />
                                            Min limit
                                        </span>
                                        <span className="text-sm font-medium text-blue-500">
                                            {Number(limits.humidMin).toFixed(2)}
                                            %
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 flex items-center flex-col border-x border-border">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Droplet className="w-3 h-3 text-red-500" />
                                            Max limit
                                        </span>
                                        <span className="text-sm font-medium text-red-500">
                                            {Number(limits.humidMax).toFixed(2)}
                                            %
                                        </span>
                                    </div>
                                    <div className="px-4 py-2 items-center flex flex-col">
                                        <span className="text-[15px] text-muted-foreground flex items-center gap-1">
                                            <Activity className="w-3 h-3" />
                                            Margin
                                        </span>
                                        <span
                                            className={`text-sm font-medium ${isHumidAlert ? "text-red-500" : "text-primary"}`}
                                        >
                                            {isHumidAlert
                                                ? `-${humidMargin}`
                                                : `${humidMargin}`}
                                            %
                                        </span>
                                    </div>
                                </div>
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
                                        left: -30,
                                        bottom: 20,
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
                                        interval={0}
                                        tick={({ x, y, payload }) => (
                                            <text
                                                x={x}
                                                y={y + 10}
                                                textAnchor="end"
                                                transform={`rotate(-45, ${x}, ${y})`}
                                                fontSize={12}
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
