"use client";

import {
    IconTemperature,
    IconDroplet,
    IconCircleX,
    IconPlugConnected,
    IconCircleCheck,
} from "@tabler/icons-react";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import classNames from "classnames";
import { throttle } from "lodash";

type Device = {
    mac_address: string;
    device_name: string;
    location: string;
};

type SensorData = {
    mac_address: string;
    temperature: number;
    humidity: number;
    recorded_at: string;
};

type Limits = {
    mac_address: string;
    tempMin: number;
    tempMax: number;
    humidMin: number;
    humidMax: number;
};

const MAX_INACTIVE_SECONDS = 3;

export default function SensorCardGrid({
    devices,
    limitsMap,
}: {
    devices: Device[];
    limitsMap: Record<string, Limits>;
}) {
    const [sensors, setSensors] = useState<Record<string, SensorData>>({});
    const [deviceStates, setDeviceStates] = useState<
        Record<string, "no_data" | "ok" | "lost">
    >({});

    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const deviceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});
    const throttledUpdatesRef = useRef<
        Record<string, ReturnType<typeof throttle>>
    >({});

    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
        const socket = socketRef.current;

        const timeouts = deviceTimeouts.current;
        socket.on("connect", () => {
            console.log("[SOCKET] Connected:", socket.id);
        });

        socket.on("disconnect", () => {
            console.log("[SOCKET] Disconnected");
        });

        socket.on("sensor_data", (data: SensorData) => {
            const { mac_address } = data;
            const throttled = throttledUpdatesRef.current[mac_address];
            throttled?.(data);

            if (timeouts[mac_address]) {
                clearTimeout(timeouts[mac_address]);
            }

            timeouts[mac_address] = setTimeout(() => {
                setDeviceStates((prev) => ({
                    ...prev,
                    [mac_address]: "lost",
                }));
            }, MAX_INACTIVE_SECONDS * 1000);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const initialStates: Record<string, "no_data"> = {};
        const throttledMap: typeof throttledUpdatesRef.current = {};

        devices.forEach((d) => {
            initialStates[d.mac_address] = "no_data";

            throttledMap[d.mac_address] = throttle((data: SensorData) => {
                setSensors((prev) => ({
                    ...prev,
                    [data.mac_address]: data,
                }));

                setDeviceStates((prev) => ({
                    ...prev,
                    [data.mac_address]: "ok",
                }));
            }, 1000);
        });

        setDeviceStates(initialStates);
        throttledUpdatesRef.current = throttledMap;
    }, [devices]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 p-6 pt-0">
            {devices.map((device) => {
                const sensor = sensors[device.mac_address];
                const state = deviceStates[device.mac_address] || "no_data";
                const limit = limitsMap[device.mac_address];
                return (
                    <div
                        key={device.mac_address}
                        className="rounded-md overflow-hidden bg-sky-200 dark:bg-blue-800 text-blue-900 dark:text-white transition-all">
                        <div className="px-4 py-2 bg-sky-300 dark:bg-blue-700 font-semibold text-sm flex items-center justify-between">
                            <div>
                                {device.device_name} <br />
                                <span className="text-xs font-normal text-sky-700 dark:text-blue-200">
                                    {device.location}
                                </span>
                            </div>
                            <div>
                                {state === "no_data" ? (
                                    <IconCircleX className="text-red-500 w-7 h-7" />
                                ) : state === "lost" ? (
                                    <IconPlugConnected className="text-yellow-600 w-7 h-7" />
                                ) : (
                                    <IconCircleCheck className="text-green-600 w-7 h-7" />
                                )}
                            </div>
                        </div>
                        <div className="flex h-25">
                            {!sensor || !limit || state !== "ok" ? (
                                <div
                                    className={classNames(
                                        "flex items-center justify-center w-full text-sm font-semibold",
                                        {
                                            "text-red-500 dark:text-red-400":
                                                state === "no_data",
                                            "text-yellow-600 dark:text-yellow-400":
                                                state === "lost",
                                        }
                                    )}>
                                    {state === "no_data"
                                        ? "No Data"
                                        : "Lost Connection"}
                                </div>
                            ) : (
                                <>
                                    <div
                                        className={classNames(
                                            "flex-1 flex flex-col items-center justify-center",
                                            {
                                                "bg-red-600 text-white animate-pulse":
                                                    sensor.temperature <
                                                    limit.tempMin ||
                                                    sensor.temperature >
                                                    limit.tempMax,
                                                "bg-sky-200 dark:bg-blue-900":
                                                    sensor.temperature >=
                                                    limit.tempMin &&
                                                    sensor.temperature <=
                                                    limit.tempMax,
                                            }
                                        )}>
                                        <span className="text-xs mb-1">
                                            Temperature
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <IconTemperature className="w-6 h-6" />
                                            <span className="text-xl font-bold">
                                                {sensor.temperature}°C
                                            </span>
                                        </div>
                                    </div>
                                    <div
                                        className={classNames(
                                            "flex-1 flex flex-col items-center justify-center",
                                            {
                                                "bg-red-600 text-white animate-pulse":
                                                    sensor.humidity <
                                                    limit.humidMin ||
                                                    sensor.humidity >
                                                    limit.humidMax,
                                                "bg-emerald-200 dark:bg-emerald-900":
                                                    sensor.humidity >=
                                                    limit.humidMin &&
                                                    sensor.humidity <=
                                                    limit.humidMax,
                                            }
                                        )}>
                                        <span className="text-xs mb-1">
                                            Humidity
                                        </span>
                                        <div className="flex items-center gap-1">
                                            <IconDroplet className="w-6 h-6" />
                                            <span className="text-xl font-bold">
                                                {sensor.humidity}%
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
