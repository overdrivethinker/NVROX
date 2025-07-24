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
    const deviceTimeouts = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => {
        const socket = io(import.meta.env.VITE_SOCKET_URL);

        const initialStates: Record<string, "no_data"> = {};
        devices.forEach((d) => {
            initialStates[d.mac_address] = "no_data";
        });
        setDeviceStates(initialStates);

        const timeouts = deviceTimeouts.current;

        socket.on("sensor_data", (data: SensorData) => {
            const { mac_address } = data;

            setSensors((prev) => ({
                ...prev,
                [mac_address]: data,
            }));

            setDeviceStates((prev) => ({
                ...prev,
                [mac_address]: "ok",
            }));

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
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, [devices]);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-5 p-6 pt-1">
            {devices.map((device) => {
                const sensor = sensors[device.mac_address];
                const state = deviceStates[device.mac_address] || "no_data";
                const limit = limitsMap[device.mac_address];

                return (
                    <div
                        key={device.mac_address}
                        className="rounded-xl overflow-hidden bg-blue-50 dark:bg-blue-800 text-blue-900 dark:text-white transition-all">
                        {/* Header */}
                        <div className="px-4 py-2 bg-blue-200 dark:bg-blue-700 font-semibold text-sm flex items-center justify-between">
                            <div>
                                {device.device_name} <br />
                                <span className="text-xs font-normal text-blue-500 dark:text-blue-200">
                                    {device.location}
                                </span>
                            </div>
                            <div>
                                {state === "no_data" ? (
                                    <IconCircleX className="text-red-400 w-7 h-7" />
                                ) : state === "lost" ? (
                                    <IconPlugConnected className="text-yellow-500 w-7 h-7" />
                                ) : (
                                    <IconCircleCheck className="text-green-500 w-7 h-7" />
                                )}
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex h-25">
                            {!sensor || !limit || state !== "ok" ? (
                                <div
                                    className={classNames(
                                        "flex items-center justify-center w-full text-sm font-semibold",
                                        {
                                            "text-red-600 dark:text-red-400":
                                                state === "no_data",
                                            "text-yellow-500 dark:text-yellow-400":
                                                state === "lost",
                                        }
                                    )}>
                                    {state === "no_data"
                                        ? "No Data"
                                        : "Lost Connection"}
                                </div>
                            ) : (
                                <>
                                    {/* Temperature */}
                                    <div
                                        className={classNames(
                                            "flex-1 flex flex-col items-center justify-center",
                                            {
                                                "bg-red-600 text-white animate-pulse":
                                                    sensor.temperature <
                                                        limit.tempMin ||
                                                    sensor.temperature >
                                                        limit.tempMax,
                                                "bg-blue-100 dark:bg-blue-900":
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

                                    {/* Humidity */}
                                    <div
                                        className={classNames(
                                            "flex-1 flex flex-col items-center justify-center",
                                            {
                                                "bg-red-600 text-white animate-pulse":
                                                    sensor.humidity <
                                                        limit.humidMin ||
                                                    sensor.humidity >
                                                        limit.humidMax,
                                                "bg-emerald-100 dark:bg-emerald-900":
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
