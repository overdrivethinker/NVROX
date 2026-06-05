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
import { AlertTriangle, Loader2, Droplet, Thermometer } from "lucide-react";
import io from "socket.io-client";
import axios from "axios";

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

import { DeviceSelector } from "./device-selector";

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
            setSelectedMac(devices[0].mac_address); // auto-select pertama
        }
    };

    useEffect(() => {
        if (!selectedMac) return;

        setIsLoading(true);
        setChartData([]);
        setIsDisconnected(false);
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
            <CardContent className="flex flex-1 justify-center items-center overflow-x-auto overflow-y-auto px-2 sm:px-4 pt-2 sm:pt-3 mb-2">
                {noDevice ? (
                    <div className="flex justify-center items-center min-h-[200px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-red-400 text-red-500 dark:border-red-700 dark:text-red-400"
                        >
                            <AlertTriangle className="w-4 h-4 me-1.5" />
                            No devices registered
                        </Badge>
                    </div>
                ) : !selectedMac || isLoading ? (
                    <div className="flex justify-center items-center min-h-[200px] w-full">
                        <Badge
                            variant="outline"
                            className="text-base border-blue-700 text-blue-700 dark:text-blue-400 dark:border-blue-400"
                        >
                            <Loader2 className="w-4 h-4 me-1.5 animate-spin" />
                            Waiting for live data...
                        </Badge>
                    </div>
                ) : isDisconnected ? (
                    <div className="flex justify-center items-center min-h-[200px] w-full">
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
                        <div className="w-full lg:w-1/2">
                            <div className="flex justify-center px-3 mb-4">
                                <Card
                                    className={`w-full overflow-visible bg-transparent border-1 shadow-none ${
                                        latestData &&
                                        (latestData.temperature <
                                            limits.tempMin ||
                                            latestData.temperature >
                                                limits.tempMax)
                                            ? "bg-red-600 animate-pulse"
                                            : ""
                                    }`}
                                >
                                    <CardHeader className="text-center">
                                        <CardTitle className="text-lg">
                                            Live Temperature Data
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center items-center overflow-visible mb-4">
                                        <div className="flex items-center justify-center text-[clamp(2rem,6vw,8rem)] font-bold text-primary leading-none whitespace-nowrap overflow-visible">
                                            <Thermometer className="w-[clamp(2rem,6vw,8rem)] h-auto text-primary" />
                                            {latestData?.temperature != null
                                                ? `${Number(latestData.temperature).toFixed(2)}°C`
                                                : "--"}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <ChartContainer
                                config={chartConfig}
                                className="min-h-[300px] max-h-[380px] w-full"
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
                                    />
                                    <YAxis
                                        stroke={chartConfig.temp.color}
                                        fontSize={12}
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
                                </AreaChart>
                            </ChartContainer>
                        </div>
                        <div className="w-full lg:w-1/2">
                            <div className="flex justify-center px-3 mb-4">
                                <Card
                                    className={`w-full overflow-visible bg-transparent border-1 shadow-none ${
                                        latestData &&
                                        (latestData.humidity <
                                            limits.humidMin ||
                                            latestData.humidity >
                                                limits.humidMax)
                                            ? "bg-red-600 animate-pulse"
                                            : ""
                                    }`}
                                >
                                    <CardHeader className="text-center ">
                                        <CardTitle className="text-lg">
                                            Live Humidity Data
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="flex justify-center items-center overflow-visible mb-4">
                                        <div className="flex items-center justify-center text-[clamp(2rem,6vw,8rem)] font-bold text-primary leading-none whitespace-nowrap overflow-visible">
                                            <Droplet className="w-[clamp(2rem,6vw,8rem)] h-auto text-primary" />
                                            {latestData?.humidity != null
                                                ? `${Number(
                                                      latestData.humidity,
                                                  ).toFixed(2)}%`
                                                : "--"}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <ChartContainer
                                config={chartConfig}
                                className="min-h-[300px] max-h-[380px] w-full"
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
                                    />
                                    <YAxis
                                        stroke={chartConfig.humid.color}
                                        fontSize={12}
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
                                </AreaChart>
                            </ChartContainer>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
