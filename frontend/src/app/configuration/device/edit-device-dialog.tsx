import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

type ThresholdRange = {
    warningLow: number;
    warningHigh: number;
    alertLow: number;
    alertHigh: number;
};

type Thresholds = {
    temperature?: ThresholdRange;
    humidity?: ThresholdRange;
};

type Device = {
    mac: string;
    name: string;
    location: string;
    status: string;
    thresholds?: Thresholds;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device;
    setDevice: (device: Device) => void;
    onSubmit: () => void;
};

const EMPTY_RANGE: ThresholdRange = {
    warningLow: 0,
    warningHigh: 0,
    alertLow: 0,
    alertHigh: 0,
};

export function EditDeviceDialog({
    open,
    onOpenChange,
    device,
    setDevice,
    onSubmit,
}: Props) {
    const updateThreshold = (
        type: keyof Thresholds,
        field: keyof ThresholdRange,
        value: string,
    ) => {
        const numValue = value === "" ? 0 : parseFloat(value);
        if (isNaN(numValue)) return;

        setDevice({
            ...device,
            thresholds: {
                ...device.thresholds,
                [type]: {
                    ...(device.thresholds?.[type] ?? EMPTY_RANGE),
                    [field]: numValue,
                },
            },
        });
    };

    const isRangeInvalid = (r?: ThresholdRange): boolean => {
        if (!r) return false;
        return !(
            r.alertLow < r.warningLow &&
            r.warningLow < r.warningHigh &&
            r.warningHigh < r.alertHigh
        );
    };

    const tempInvalid = isRangeInvalid(device.thresholds?.temperature);
    const humidInvalid = isRangeInvalid(device.thresholds?.humidity);
    const hasInvalid = tempInvalid || humidInvalid;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Edit Device</DialogTitle>
                    <DialogDescription>
                        Configure device settings and thresholds.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit();
                    }}
                >
                    <Tabs defaultValue="general" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="general">General</TabsTrigger>
                            <TabsTrigger value="thresholds">
                                Thresholds
                                {hasInvalid && (
                                    <span className="ml-1 text-red-500">•</span>
                                )}
                            </TabsTrigger>
                        </TabsList>

                        {/* ============ GENERAL TAB ============ */}
                        <TabsContent value="general" className="space-y-4 mt-2">
                            <div className="space-y-2">
                                <Label htmlFor="mac">MAC Address</Label>
                                <div className="relative">
                                    <Input
                                        id="mac"
                                        value={device.mac}
                                        disabled
                                        className="bg-muted"
                                    />
                                    <Badge
                                        variant="secondary"
                                        className="absolute -top-2 -right-0 text-xs"
                                    >
                                        Read Only
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="name">Device Name</Label>
                                <Input
                                    id="name"
                                    value={device.name}
                                    onChange={(e) =>
                                        setDevice({
                                            ...device,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="location">Location</Label>
                                <Input
                                    id="location"
                                    value={device.location}
                                    onChange={(e) =>
                                        setDevice({
                                            ...device,
                                            location: e.target.value,
                                        })
                                    }
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Status</Label>
                                <Select
                                    value={device.status}
                                    onValueChange={(value) =>
                                        setDevice({ ...device, status: value })
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Active">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                Active
                                            </div>
                                        </SelectItem>
                                        <SelectItem value="Inactive">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                                Inactive
                                            </div>
                                        </SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        {/* ============ THRESHOLDS TAB ============ */}
                        <TabsContent
                            value="thresholds"
                            className="space-y-6 mt-2"
                        >
                            {/* -------- Temperature -------- */}
                            <div className="space-y-3">
                                <Label className="text-sm">
                                    Temperature (°C)
                                </Label>
                                <div className="grid grid-cols-4 gap-2">
                                    <ThresholdInput
                                        label="AL"
                                        tone="alert"
                                        value={
                                            device.thresholds?.temperature
                                                ?.alertLow ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "temperature",
                                                "alertLow",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="WL"
                                        tone="warning"
                                        value={
                                            device.thresholds?.temperature
                                                ?.warningLow ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "temperature",
                                                "warningLow",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="WH"
                                        tone="warning"
                                        value={
                                            device.thresholds?.temperature
                                                ?.warningHigh ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "temperature",
                                                "warningHigh",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="AH"
                                        tone="alert"
                                        value={
                                            device.thresholds?.temperature
                                                ?.alertHigh ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "temperature",
                                                "alertHigh",
                                                v,
                                            )
                                        }
                                    />
                                </div>
                                {tempInvalid && (
                                    <p className="text-xs text-red-500">
                                        Order must be: AL &lt; WL &lt; WH &lt;
                                        AH
                                    </p>
                                )}
                            </div>

                            {/* -------- Humidity -------- */}
                            <div className="space-y-3">
                                <Label className="text-sm">Humidity (%)</Label>
                                <div className="grid grid-cols-4 gap-2">
                                    <ThresholdInput
                                        label="AL"
                                        tone="alert"
                                        value={
                                            device.thresholds?.humidity
                                                ?.alertLow ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "humidity",
                                                "alertLow",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="WL"
                                        tone="warning"
                                        value={
                                            device.thresholds?.humidity
                                                ?.warningLow ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "humidity",
                                                "warningLow",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="WH"
                                        tone="warning"
                                        value={
                                            device.thresholds?.humidity
                                                ?.warningHigh ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "humidity",
                                                "warningHigh",
                                                v,
                                            )
                                        }
                                    />
                                    <ThresholdInput
                                        label="AH"
                                        tone="alert"
                                        value={
                                            device.thresholds?.humidity
                                                ?.alertHigh ?? ""
                                        }
                                        onChange={(v) =>
                                            updateThreshold(
                                                "humidity",
                                                "alertHigh",
                                                v,
                                            )
                                        }
                                    />
                                </div>
                                {humidInvalid && (
                                    <p className="text-xs text-red-500">
                                        Order must be: AL &lt; WL &lt; WH &lt;
                                        AH
                                    </p>
                                )}
                            </div>

                            {/* Legenda */}
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground pt-3 border-t">
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-red-500" />
                                    <span>Alert (AL / AH)</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <div className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
                                    <span>Warning (WL / WH)</span>
                                </div>
                                <span className="ml-auto font-mono">
                                    AL &lt; WL &lt; WH &lt; AH
                                </span>
                            </div>
                        </TabsContent>
                    </Tabs>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit" disabled={hasInvalid}>
                            Save
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

/* ---------- Sub-component: input dengan label di atas ---------- */
type ThresholdInputProps = {
    label: string;
    tone: "alert" | "warning";
    value: number | "";
    onChange: (v: string) => void;
};

function ThresholdInput({ label, tone, value, onChange }: ThresholdInputProps) {
    const borderColor =
        tone === "alert"
            ? "border-red-300 dark:border-red-900 focus:border-red-500 focus:ring-red-500/20"
            : "border-amber-300 dark:border-amber-900 focus:border-amber-500 focus:ring-amber-500/20";

    const labelColor =
        tone === "alert"
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400";

    return (
        <div className="space-y-1.5">
            <label className={`block text-sm text-center ${labelColor}`}>
                {label}
            </label>
            <input
                type="number"
                step="0.01"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`w-full px-2 py-2 text-sm text-center font-mono rounded-md border bg-background outline-none transition-colors focus:ring-1 ${borderColor}`}
            />
        </div>
    );
}
