"use client";

// Requires shadcn/ui components:
// npx shadcn@latest add button badge popover scroll-area card separator toggle-group tooltip

import {
    IconTemperature,
    IconDroplet,
    IconEdit,
    IconLayoutGrid,
    IconDeviceFloppy,
    IconArrowBackUp,
    IconDotsVertical,
    IconCheck,
    IconCircleX,
    IconPlugConnected,
    IconCircleCheck,
} from "@tabler/icons-react";
import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import io from "socket.io-client";
import { throttle } from "lodash";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardAction,
    CardContent,
} from "@/components/ui/card";
import { useAuth } from "@/config/auth";

import floor1 from "@/assets/floor1.svg";
import floor2 from "@/assets/floor2.svg";
import floor3 from "@/assets/floor3.svg";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
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

type Position = { x: number; y: number };
type ConnectionState = "no_data" | "ok" | "lost";
type SensorStatus = "normal" | "warning" | "alarm";

/** layout[floorId][mac] = Position. */
type Layout = Record<string, Record<string, Position>>;

type FactoryMapProps = {
    devices: Device[];
    limitsMap: Record<string, Limits>;
    initialPositions?: Layout;
    onSaveLayout?: (layout: Layout) => Promise<void> | void;
    warningMarginPercent?: number;
    backgroundImageUrl?: string;
    floorBackgrounds?: Record<string, string>;
};

const MAX_INACTIVE_MS = 8_000;
const STORAGE_KEY = "factory-map-positions-v2";
const FLOORS = ["1", "2", "3"] as const;

const FLOOR_ASPECT_RATIOS: Record<string, number> = {
    "1": 1500 / 200,
    "2": 1000 / 700,
    "3": 1000 / 700,
};

const MAP_MAX_HEIGHT = 700;

const DEFAULT_FLOOR_BACKGROUNDS: Record<string, string> = {
    "1": floor1,
    "2": floor2,
    "3": floor3,
};

// Shared surface for both hover tooltip and click popover.
// p-0 karena card di dalamnya sudah punya padding sendiri.
const TOOLTIP_SURFACE_CLASS =
    "w-fit rounded-lg border bg-popover/95 p-0 text-xs text-popover-foreground backdrop-blur-sm";

// Every color glows — consistent styling across red / amber / emerald.
const COLOR_CLASSES = {
    red: {
        dot: "bg-red-500",
        glow: "shadow-[0_0_8px_2px_rgba(239,68,68,0.65),0_0_16px_6px_rgba(239,68,68,0.25)]",
        hoverGlow:
            "group-hover:shadow-[0_0_12px_3px_rgba(239,68,68,0.9),0_0_24px_8px_rgba(239,68,68,0.4)]",
        tooltipGlow:
            "border-red-500/40 shadow-[0_0_12px_2px_rgba(239,68,68,0.35)]",
        badge: "bg-red-500/15 text-red-600 dark:text-red-400",
        text: "text-red-600 dark:text-red-400",
    },
    yellow: {
        dot: "bg-amber-500",
        glow: "shadow-[0_0_8px_2px_rgba(245,158,11,0.65),0_0_16px_6px_rgba(245,158,11,0.25)]",
        hoverGlow:
            "group-hover:shadow-[0_0_12px_3px_rgba(245,158,11,0.9),0_0_24px_8px_rgba(245,158,11,0.4)]",
        tooltipGlow:
            "border-amber-500/40 shadow-[0_0_12px_2px_rgba(245,158,11,0.35)]",
        badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
        text: "text-amber-600 dark:text-amber-400",
    },
    green: {
        dot: "bg-emerald-500",
        glow: "shadow-[0_0_8px_2px_rgba(16,185,129,0.65),0_0_16px_6px_rgba(16,185,129,0.25)]",
        hoverGlow:
            "group-hover:shadow-[0_0_12px_3px_rgba(16,185,129,0.9),0_0_24px_8px_rgba(16,185,129,0.4)]",
        tooltipGlow:
            "border-emerald-500/40 shadow-[0_0_12px_2px_rgba(16,185,129,0.35)]",
        badge: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400",
        text: "text-emerald-600 dark:text-emerald-400",
    },
} as const;

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------
function getDefaultPosition(index: number, total: number): Position {
    const cols = Math.max(1, Math.min(4, total));
    const rows = Math.max(1, Math.ceil(total / cols));
    const col = index % cols;
    const row = Math.floor(index / cols);
    return {
        x: (100 / (cols + 1)) * (col + 1),
        y: (100 / (rows + 1)) * (row + 1),
    };
}

function getSensorStatus(
    value: number,
    min: number,
    max: number,
    marginPct: number,
): SensorStatus {
    if (value < min || value > max) return "alarm";
    const range = max - min;
    if (range <= 0) return "normal";
    const margin = range * (marginPct / 100);
    if (value <= min + margin || value >= max - margin) return "warning";
    return "normal";
}

function getOverallSensorStatus(
    sensor: SensorData | undefined,
    limit: Limits | undefined,
    marginPct: number,
): SensorStatus {
    if (!sensor || !limit) return "normal";
    const temp = getSensorStatus(
        sensor.temperature,
        limit.tempMin,
        limit.tempMax,
        marginPct,
    );
    const humid = getSensorStatus(
        sensor.humidity,
        limit.humidMin,
        limit.humidMax,
        marginPct,
    );
    if (temp === "alarm" || humid === "alarm") return "alarm";
    if (temp === "warning" || humid === "warning") return "warning";
    return "normal";
}

function getPinVisual(
    connectionState: ConnectionState,
    sensorStatus: SensorStatus,
) {
    if (connectionState === "no_data")
        return { color: "red" as const, label: "No data", pulse: false };
    if (connectionState === "lost")
        return {
            color: "yellow" as const,
            label: "Connection lost",
            pulse: false,
        };
    if (sensorStatus === "alarm")
        return { color: "red" as const, label: "Alarm", pulse: true };
    if (sensorStatus === "warning")
        return { color: "yellow" as const, label: "Warning", pulse: true };
    return { color: "green" as const, label: "Normal", pulse: false };
}

// ---------------------------------------------------------------------------
// PinDot
// ---------------------------------------------------------------------------
function PinDot({
    color,
    pulse,
}: {
    color: keyof typeof COLOR_CLASSES;
    pulse: boolean;
}) {
    const colors = COLOR_CLASSES[color];
    return (
        <div className="relative flex h-6 w-6 items-center justify-center">
            {pulse && (
                <span
                    className={cn(
                        "absolute h-4 w-4 rounded-full animate-ping opacity-60",
                        colors.dot,
                    )}
                />
            )}
            <span
                className={cn(
                    "relative h-3 w-3 rounded-full border-2 border-white/95",
                    "transition-all duration-200 ease-out",
                    "group-hover:scale-125",
                    colors.dot,
                    colors.glow,
                    colors.hoverGlow,
                )}
            />
        </div>
    );
}

// ---------------------------------------------------------------------------
// SensorInfoBody — shared body for hover tooltip & click popover
// ---------------------------------------------------------------------------
function SensorInfoBody({
    device,
    sensor,
    connectionState,
    limit,
}: {
    device: Device;
    sensor?: SensorData;
    connectionState: ConnectionState;
    limit?: Limits;
}) {
    const showReadings = sensor && limit && connectionState === "ok";

    return (
        <div className="w-56 rounded-sm overflow-hidden bg-sky-200 dark:bg-blue-800 text-blue-900 dark:text-white transition-all">
            {/* Header */}
            <div className="px-3 py-2 bg-sky-300 dark:bg-blue-700 font-semibold text-sm flex items-center justify-between gap-2">
                <div className="min-w-0 flex-1">
                    <div className="truncate">{device.device_name}</div>
                    <span className="text-xs font-normal text-sky-700 dark:text-blue-200 truncate block">
                        {device.location}
                    </span>
                </div>
                <div className="shrink-0">
                    {connectionState === "no_data" ? (
                        <IconCircleX className="text-red-500 w-6 h-6" />
                    ) : connectionState === "lost" ? (
                        <IconPlugConnected className="text-yellow-600 w-6 h-6" />
                    ) : (
                        <IconCircleCheck className="dark:text-green-400 text-green-600 w-6 h-6" />
                    )}
                </div>
            </div>

            {/* Body */}
            <div className="flex h-20">
                {!showReadings ? (
                    <div
                        className={cn(
                            "flex items-center justify-center w-full text-sm font-semibold",
                            {
                                "text-red-500 dark:text-red-400":
                                    connectionState === "no_data",
                                "text-yellow-600 dark:text-yellow-400":
                                    connectionState === "lost",
                            },
                        )}
                    >
                        {connectionState === "no_data"
                            ? "No Data"
                            : "Lost Connection"}
                    </div>
                ) : (
                    <>
                        {/* Temperature */}
                        <div
                            className={cn(
                                "flex-1 min-w-0 flex flex-col items-center justify-center px-1",
                                {
                                    "bg-red-600 text-white animate-pulse":
                                        sensor!.temperature < limit!.tempMin ||
                                        sensor!.temperature > limit!.tempMax,
                                    "bg-sky-200 dark:bg-blue-900":
                                        sensor!.temperature >= limit!.tempMin &&
                                        sensor!.temperature <= limit!.tempMax,
                                },
                            )}
                        >
                            <span className="text-xs mb-1">Temperature</span>
                            <div className="flex items-center gap-1">
                                <IconTemperature className="w-5 h-5 shrink-0" />
                                <span className="text-xl font-bold">
                                    {sensor!.temperature}°C
                                </span>
                            </div>
                        </div>

                        {/* Humidity */}
                        <div
                            className={cn(
                                "flex-1 min-w-0 flex flex-col items-center justify-center px-1",
                                {
                                    "bg-red-600 text-white animate-pulse":
                                        sensor!.humidity < limit!.humidMin ||
                                        sensor!.humidity > limit!.humidMax,
                                    "bg-emerald-200 dark:bg-emerald-900":
                                        sensor!.humidity >= limit!.humidMin &&
                                        sensor!.humidity <= limit!.humidMax,
                                },
                            )}
                        >
                            <span className="text-xs mb-1">Humidity</span>
                            <div className="flex items-center gap-1">
                                <IconDroplet className="w-5 h-5 shrink-0" />
                                <span className="text-xl font-bold">
                                    {sensor!.humidity}%
                                </span>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Sensor pin
// ---------------------------------------------------------------------------
function SensorPin({
    device,
    position,
    connectionState,
    sensorStatus,
    sensor,
    limit,
    isEditMode,
    isSelected,
    onSelect,
    onDragStart,
}: {
    device: Device;
    position: Position;
    connectionState: ConnectionState;
    sensorStatus: SensorStatus;
    sensor?: SensorData;
    limit?: Limits;
    isEditMode: boolean;
    isSelected: boolean;
    onSelect: (mac: string | null) => void;
    onDragStart: (e: React.PointerEvent<HTMLDivElement>, mac: string) => void;
}) {
    const visual = getPinVisual(connectionState, sensorStatus);

    const [hoverOpen, setHoverOpen] = useState(false);

    const info = (
        <SensorInfoBody
            device={device}
            sensor={sensor}
            connectionState={connectionState}
            limit={limit}
        />
    );

    const pinDot = <PinDot color={visual.color} pulse={visual.pulse} />;

    if (isEditMode) {
        return (
            <Tooltip open={hoverOpen} onOpenChange={setHoverOpen}>
                <TooltipTrigger asChild>
                    <div
                        className="group absolute -translate-x-1/2 -translate-y-1/2 touch-none cursor-grab active:cursor-grabbing"
                        style={{
                            left: `${position.x}%`,
                            top: `${position.y}%`,
                        }}
                        onPointerDown={(e) =>
                            onDragStart(e, device.mac_address)
                        }
                    >
                        {pinDot}
                    </div>
                </TooltipTrigger>
                <TooltipContent
                    side="top"
                    align="center"
                    sideOffset={12}
                    collisionPadding={8}
                    className={cn(
                        TOOLTIP_SURFACE_CLASS,

                        "pointer-events-none",
                    )}
                >
                    {info}
                </TooltipContent>
            </Tooltip>
        );
    }

    return (
        <Tooltip open={hoverOpen && !isSelected} onOpenChange={setHoverOpen}>
            <Popover
                open={isSelected}
                onOpenChange={(open) =>
                    onSelect(open ? device.mac_address : null)
                }
            >
                <TooltipTrigger asChild>
                    <PopoverTrigger asChild>
                        <button
                            type="button"
                            className="group absolute -translate-x-1/2 -translate-y-1/2"
                            style={{
                                left: `${position.x}%`,
                                top: `${position.y}%`,
                                zIndex: isSelected ? 20 : 10,
                            }}
                        >
                            {pinDot}
                        </button>
                    </PopoverTrigger>
                </TooltipTrigger>
                <PopoverContent
                    side="top"
                    align="center"
                    sideOffset={12}
                    collisionPadding={8}
                    className={cn(TOOLTIP_SURFACE_CLASS)}
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    {info}
                </PopoverContent>
            </Popover>
            <TooltipContent
                side="top"
                align="center"
                sideOffset={12}
                collisionPadding={8}
                className={cn(TOOLTIP_SURFACE_CLASS)}
            >
                {info}
            </TooltipContent>
        </Tooltip>
    );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------
export default function DashboardFactoryLayout({
    devices,
    limitsMap,
    initialPositions,
    onSaveLayout,
    warningMarginPercent = 10,
    backgroundImageUrl,
    floorBackgrounds,
}: FactoryMapProps) {
    const [sensors, setSensors] = useState<Record<string, SensorData>>({});
    const [deviceStates, setDeviceStates] = useState<
        Record<string, ConnectionState>
    >({});

    const [layout, setLayout] = useState<Layout>({});
    const [pendingLayout, setPendingLayout] = useState<Layout | null>(null);

    const [activeFloor, setActiveFloor] = useState<string>(FLOORS[0]);
    const [isEditMode, setIsEditMode] = useState(false);
    const [selected, setSelected] = useState<string | null>(null);
    const [saveState, setSaveState] = useState<
        "idle" | "saving" | "saved" | "error"
    >("idle");

    const { isAdmin } = useAuth();

    const socketRef = useRef<ReturnType<typeof io> | null>(null);
    const deviceTimeouts = useRef<
        Record<string, ReturnType<typeof setTimeout>>
    >({});
    const throttledUpdatesRef = useRef<
        Record<string, ReturnType<typeof throttle>>
    >({});
    const mapRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef<{
        mac: string;
        startX: number;
        startY: number;
        startPos: Position;
    } | null>(null);

    // ----- realtime socket -----
    useEffect(() => {
        socketRef.current = io(import.meta.env.VITE_SOCKET_URL);
        const socket = socketRef.current;
        const timeouts = deviceTimeouts.current;

        const resetTimeout = (mac_address: string) => {
            if (timeouts[mac_address]) clearTimeout(timeouts[mac_address]);
            timeouts[mac_address] = setTimeout(() => {
                setDeviceStates((prev) => ({ ...prev, [mac_address]: "lost" }));
            }, MAX_INACTIVE_MS);
        };

        socket.on("heartbeat", (data: { mac_address: string }) => {
            setDeviceStates((prev) =>
                prev[data.mac_address] === "lost"
                    ? { ...prev, [data.mac_address]: "ok" }
                    : prev,
            );
            resetTimeout(data.mac_address);
        });

        socket.on("sensor_data", (data: SensorData) => {
            throttledUpdatesRef.current[data.mac_address]?.(data);
            resetTimeout(data.mac_address);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    useEffect(() => {
        const initialStates: Record<string, ConnectionState> = {};
        const throttledMap: typeof throttledUpdatesRef.current = {};

        devices.forEach((d) => {
            initialStates[d.mac_address] = "no_data";
            throttledMap[d.mac_address] = throttle((data: SensorData) => {
                setSensors((prev) => ({ ...prev, [data.mac_address]: data }));
                setDeviceStates((prev) => ({
                    ...prev,
                    [d.mac_address]: "ok",
                }));
            }, 1000);
        });

        setDeviceStates(initialStates);
        throttledUpdatesRef.current = throttledMap;
    }, [devices]);

    // ----- bootstrap layout -----
    useEffect(() => {
        const stored =
            typeof window !== "undefined"
                ? window.localStorage.getItem(STORAGE_KEY)
                : null;
        const storedLayout: Layout | null = stored ? JSON.parse(stored) : null;

        const validMacs = new Set(devices.map((d) => d.mac_address));

        const sanitize = (raw: Layout): Layout => {
            const out: Layout = {};
            FLOORS.forEach((f) => {
                out[f] = {};
                Object.entries(raw[f] ?? {}).forEach(([mac, pos]) => {
                    if (validMacs.has(mac)) out[f][mac] = pos;
                });
            });
            return out;
        };

        let initial: Layout;

        if (initialPositions) {
            initial = sanitize(initialPositions);
        } else if (storedLayout) {
            initial = sanitize(storedLayout);
        } else {
            initial = {};
            FLOORS.forEach((f) => (initial[f] = {}));
            devices.forEach((d, i) => {
                initial[FLOORS[0]][d.mac_address] = getDefaultPosition(
                    i,
                    devices.length,
                );
            });
        }

        setLayout(initial);
        setPendingLayout(null);
    }, [devices, initialPositions]);

    useEffect(() => {
        setSelected(null);
    }, [activeFloor]);

    // ----- derived state -----
    const currentLayout: Layout = pendingLayout ?? layout;
    const hasPendingChanges = pendingLayout !== null;

    const floorAssignments = useMemo(() => {
        const map: Record<string, string> = {};
        FLOORS.forEach((f) => {
            Object.keys(currentLayout[f] ?? {}).forEach((mac) => {
                map[mac] = f;
            });
        });
        return map;
    }, [currentLayout]);

    const devicesOnFloor = useMemo(
        () =>
            devices.filter(
                (d) => floorAssignments[d.mac_address] === activeFloor,
            ),
        [devices, floorAssignments, activeFloor],
    );

    const devicesNotOnFloor = useMemo(
        () =>
            devices.filter(
                (d) => floorAssignments[d.mac_address] !== activeFloor,
            ),
        [devices, floorAssignments, activeFloor],
    );

    // ----- layout mutators -----
    const writeLayout = (mutate: (draft: Layout) => void) => {
        setPendingLayout((prev) => {
            const base = prev ?? layout;
            const next: Layout = {};
            FLOORS.forEach((f) => {
                next[f] = { ...(base[f] ?? {}) };
            });
            mutate(next);
            return next;
        });
    };

    const moveDevice = (mac: string, toFloor: string) => {
        writeLayout((draft) => {
            let lastPos: Position | undefined;
            FLOORS.forEach((f) => {
                if (draft[f][mac]) {
                    lastPos = draft[f][mac];
                    delete draft[f][mac];
                }
            });
            const existingCount = Object.keys(draft[toFloor] ?? {}).length;
            draft[toFloor][mac] =
                lastPos ?? getDefaultPosition(existingCount, existingCount + 1);
        });
    };

    // ----- drag -----
    const handleDragStart = useCallback(
        (e: React.PointerEvent<HTMLDivElement>, mac: string) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            dragRef.current = {
                mac,
                startX: e.clientX,
                startY: e.clientY,
                startPos: currentLayout[activeFloor]?.[mac] ?? { x: 50, y: 50 },
            };
        },
        [currentLayout, activeFloor],
    );

    const handlePointerMove = useCallback(
        (e: React.PointerEvent<HTMLDivElement>) => {
            if (!dragRef.current || !mapRef.current) return;
            const { mac, startX, startY, startPos } = dragRef.current;
            const rect = mapRef.current.getBoundingClientRect();
            const dx = ((e.clientX - startX) / rect.width) * 100;
            const dy = ((e.clientY - startY) / rect.height) * 100;
            const x = Math.min(98, Math.max(2, startPos.x + dx));
            const y = Math.min(96, Math.max(4, startPos.y + dy));
            writeLayout((draft) => {
                draft[activeFloor][mac] = { x, y };
            });
        },
        [activeFloor, layout], // eslint-disable-line react-hooks/exhaustive-deps
    );

    const handlePointerUp = useCallback(() => {
        dragRef.current = null;
    }, []);

    // ----- save / discard -----
    const handleSave = async () => {
        if (!pendingLayout) return;
        setSaveState("saving");
        try {
            if (onSaveLayout) {
                await onSaveLayout(pendingLayout);
            } else if (typeof window !== "undefined") {
                window.localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify(pendingLayout),
                );
            }
            setLayout(pendingLayout);
            setPendingLayout(null);
            setSaveState("saved");
            setTimeout(() => setSaveState("idle"), 1500);
        } catch {
            setSaveState("error");
        }
    };

    const handleDiscard = () => {
        setPendingLayout(null);
        setSaveState("idle");
    };

    // Resolve background — prop first, then imported SVG per floor
    const activeBg =
        floorBackgrounds?.[activeFloor] ??
        backgroundImageUrl ??
        DEFAULT_FLOOR_BACKGROUNDS[activeFloor];

    const mapAspect = FLOOR_ASPECT_RATIOS[activeFloor] ?? 1000 / 700;

    return (
        <TooltipProvider delayDuration={80} skipDelayDuration={0}>
            <Card className="@container/card flex-1 overflow-hidden bg-transparent border-0 shadow-none">
                <CardHeader>
                    <CardTitle>Factory Environment Map</CardTitle>
                    <CardDescription>
                        Sensor placement and live environmental data
                    </CardDescription>
                    <CardAction className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <ToggleGroup
                            type="single"
                            value={activeFloor}
                            onValueChange={(v) => v && setActiveFloor(v)}
                            variant="outline"
                            className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4"
                        >
                            {FLOORS.map((f) => (
                                <ToggleGroupItem key={f} value={f}>
                                    Floor {f}
                                </ToggleGroupItem>
                            ))}
                        </ToggleGroup>

                        {isEditMode && hasPendingChanges && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-9 gap-1.5"
                                    onClick={handleDiscard}
                                >
                                    <IconArrowBackUp className="h-4 w-4" />
                                    Cancel
                                </Button>

                                <Button
                                    size="sm"
                                    className="h-9 gap-1.5"
                                    disabled={saveState === "saving"}
                                    onClick={handleSave}
                                >
                                    {saveState === "saving" ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <IconDeviceFloppy className="h-4 w-4" />
                                    )}

                                    {saveState === "saving"
                                        ? "Saving..."
                                        : saveState === "saved"
                                          ? "Saved"
                                          : "Save Layout"}
                                </Button>
                            </>
                        )}

                        <Tooltip>
                            <TooltipTrigger asChild>
                                <span className="inline-block">
                                    <Button
                                        variant={
                                            isEditMode ? "secondary" : "outline"
                                        }
                                        size="sm"
                                        className="h-9 gap-1.5"
                                        disabled={!isAdmin}
                                        aria-label={
                                            isEditMode
                                                ? "Finish editing sensor positions"
                                                : "Edit sensor positions"
                                        }
                                        onClick={() => {
                                            if (!isAdmin) return;
                                            setIsEditMode((v) => !v);
                                            if (
                                                isEditMode &&
                                                hasPendingChanges
                                            ) {
                                                handleDiscard();
                                            }
                                        }}
                                    >
                                        {isEditMode ? (
                                            <IconLayoutGrid className="h-4 w-4" />
                                        ) : (
                                            <IconEdit className="h-4 w-4" />
                                        )}
                                        {isEditMode ? "Done" : "Edit Layout"}
                                    </Button>
                                </span>
                            </TooltipTrigger>
                            {!isAdmin && (
                                <TooltipContent side="left">
                                    <p>Only admin can edit layout</p>
                                </TooltipContent>
                            )}
                        </Tooltip>
                    </CardAction>
                </CardHeader>

                <CardContent className="flex flex-col gap-3">
                    {/* Use items-stretch so sidebar matches map height */}
                    <div className="flex flex-col gap-4 md:flex-row md:items-stretch">
                        {/* ---- Map: aspect-ratio matched to SVG viewBox ---- */}
                        <div
                            ref={mapRef}
                            onPointerMove={handlePointerMove}
                            onPointerUp={handlePointerUp}
                            onClick={() => !isEditMode && setSelected(null)}
                            className="relative w-full flex-1 select-none overflow-hidden rounded-lg border bg-card"
                            style={{
                                aspectRatio: `${mapAspect}`,
                                maxHeight: `${MAP_MAX_HEIGHT}px`,
                                ...(activeBg
                                    ? {
                                          backgroundImage: `url(${activeBg})`,
                                          backgroundSize: "100% 100%",
                                          backgroundRepeat: "no-repeat",
                                          backgroundPosition: "center",
                                      }
                                    : {}),
                            }}
                        >
                            {devicesOnFloor.map((d) => (
                                <SensorPin
                                    key={d.mac_address}
                                    device={d}
                                    position={
                                        currentLayout[activeFloor]?.[
                                            d.mac_address
                                        ] ?? { x: 50, y: 50 }
                                    }
                                    connectionState={
                                        deviceStates[d.mac_address] ?? "no_data"
                                    }
                                    sensorStatus={getOverallSensorStatus(
                                        sensors[d.mac_address],
                                        limitsMap[d.mac_address],
                                        warningMarginPercent,
                                    )}
                                    sensor={sensors[d.mac_address]}
                                    limit={limitsMap[d.mac_address]}
                                    isEditMode={isEditMode}
                                    isSelected={selected === d.mac_address}
                                    onSelect={setSelected}
                                    onDragStart={handleDragStart}
                                />
                            ))}

                            {devicesOnFloor.length === 0 && (
                                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                    <div className="rounded-lg border bg-background/80 px-4 py-2 text-xs text-muted-foreground shadow-sm backdrop-blur">
                                        No sensors on Floor {activeFloor}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* ---- Sidebar: stretches to match map height ---- */}
                        <div className="hidden w-64 shrink-0 md:flex md:flex-col md:min-h-0">
                            <ScrollArea className="h-[700px] rounded-lg border bg-card">
                                {devicesOnFloor.length > 0 && (
                                    <div className="border-b bg-muted/30 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        On Floor {activeFloor}
                                    </div>
                                )}
                                {devicesOnFloor.map((d) => {
                                    const conn =
                                        deviceStates[d.mac_address] ??
                                        "no_data";
                                    const status = getOverallSensorStatus(
                                        sensors[d.mac_address],
                                        limitsMap[d.mac_address],
                                        warningMarginPercent,
                                    );
                                    const visual = getPinVisual(conn, status);
                                    const colors = COLOR_CLASSES[visual.color];
                                    const sensor = sensors[d.mac_address];
                                    const isSelectedRow =
                                        selected === d.mac_address;

                                    return (
                                        <div
                                            key={d.mac_address}
                                            className={cn(
                                                "flex items-center gap-2 border-b px-3 py-2 last:border-0 transition-colors",
                                                isSelectedRow
                                                    ? "bg-accent text-accent-foreground"
                                                    : "hover:bg-accent/50",
                                            )}
                                        >
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setSelected(
                                                        isSelectedRow
                                                            ? null
                                                            : d.mac_address,
                                                    )
                                                }
                                                className="flex flex-1 min-w-0 items-center gap-2 text-left"
                                            >
                                                <span
                                                    className={cn(
                                                        "h-2 w-2 shrink-0 rounded-full",
                                                        colors.dot,
                                                        colors.glow,
                                                    )}
                                                />
                                                <span className="min-w-0 flex-1">
                                                    <span className="block truncate text-sm font-medium text-foreground">
                                                        {d.device_name}
                                                    </span>
                                                    <span className="block truncate text-xs text-muted-foreground">
                                                        {d.location}
                                                    </span>
                                                </span>
                                                {sensor && conn === "ok" && (
                                                    <span className="shrink-0 text-right text-xs text-muted-foreground">
                                                        {sensor.temperature}°C
                                                        <br />
                                                        {sensor.humidity}%
                                                    </span>
                                                )}
                                            </button>

                                            {isEditMode && (
                                                <Popover>
                                                    <PopoverTrigger asChild>
                                                        <Button
                                                            size="icon"
                                                            variant="ghost"
                                                            className="h-6 w-6 shrink-0"
                                                            aria-label="Sensor options"
                                                        >
                                                            <IconDotsVertical className="h-3.5 w-3.5" />
                                                        </Button>
                                                    </PopoverTrigger>
                                                    <PopoverContent
                                                        className="w-44 p-1 text-xs"
                                                        align="end"
                                                    >
                                                        <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                                                            Move to
                                                        </div>
                                                        {FLOORS.map((f) => (
                                                            <button
                                                                key={f}
                                                                type="button"
                                                                onClick={() =>
                                                                    moveDevice(
                                                                        d.mac_address,
                                                                        f,
                                                                    )
                                                                }
                                                                className={cn(
                                                                    "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-left hover:bg-accent",
                                                                    f ===
                                                                        activeFloor &&
                                                                        "opacity-50",
                                                                )}
                                                            >
                                                                <span>
                                                                    Floor {f}
                                                                </span>
                                                                {f ===
                                                                    activeFloor && (
                                                                    <IconCheck className="h-3.5 w-3.5" />
                                                                )}
                                                            </button>
                                                        ))}
                                                    </PopoverContent>
                                                </Popover>
                                            )}
                                        </div>
                                    );
                                })}

                                {devicesNotOnFloor.length > 0 && (
                                    <div className="border-b bg-muted/30 px-3 py-1.5 text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                        Other sensors
                                    </div>
                                )}
                                {devicesNotOnFloor.map((d) => {
                                    const assignedFloor =
                                        floorAssignments[d.mac_address];
                                    return (
                                        <div
                                            key={d.mac_address}
                                            className="flex items-center gap-2 border-b px-3 py-2 opacity-60 last:border-0 transition-opacity hover:opacity-100"
                                        >
                                            <span className="h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                                            <div className="min-w-0 flex-1">
                                                <div className="truncate text-sm font-medium text-foreground">
                                                    {d.device_name}
                                                </div>
                                                <div className="truncate text-xs text-muted-foreground">
                                                    {assignedFloor
                                                        ? `On Floor ${assignedFloor}`
                                                        : "Not assigned"}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </ScrollArea>
                        </div>
                    </div>

                    {isEditMode && (
                        <p className="hidden md:block text-xs leading-relaxed text-muted-foreground">
                            Tip: drag a pin to reposition · click <span>⋮</span>{" "}
                            to move a sensor to another floor
                        </p>
                    )}
                </CardContent>
            </Card>
        </TooltipProvider>
    );
}
