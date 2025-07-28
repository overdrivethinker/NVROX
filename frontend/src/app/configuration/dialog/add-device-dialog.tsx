import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
    DialogClose,
} from "@/components/ui/dialog";
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
import { toast } from "sonner";

type Device = {
    mac: string;
    name: string;
    location: string;
    status: string;
};

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    device: Device;
    setDevice: (device: Device) => void;
    onSubmit: () => void;
};

const MAC_ADDRESS_REGEX = /^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/;

const isValidMacAddress = (mac: string): boolean => {
    if (!mac) return false;
    return MAC_ADDRESS_REGEX.test(mac.trim());
};

const formatMacAddressInput = (value: string): string => {
    const cleaned = value.replace(/[^0-9A-Fa-f:-]/g, "").toUpperCase();

    let formatted = "";
    for (let i = 0; i < cleaned.length && i < 17; i++) {
        if (i > 0 && i % 3 === 2 && cleaned[i] !== ":" && cleaned[i] !== "-") {
            formatted += ":";
        }
        formatted += cleaned[i];
    }

    return formatted;
};

export function AddDeviceDialog({
    open,
    onOpenChange,
    device,
    setDevice,
    onSubmit,
}: Props) {
    const [macError, setMacError] = useState<string>("");

    const handleMacChange = (value: string) => {
        const formatted = formatMacAddressInput(value);

        setDevice({
            ...device,
            mac: formatted,
        });
        if (formatted.length > 0) {
            if (formatted.length === 17 && !isValidMacAddress(formatted)) {
                setMacError("Invalid MAC address format");
            } else if (formatted.length < 17) {
                setMacError(
                    "MAC address must be 17 characters (XX:XX:XX:XX:XX:XX)"
                );
            } else {
                setMacError("");
            }
        } else {
            setMacError("");
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (!device.mac.trim()) {
            setMacError("MAC Address is required");
            return;
        }

        if (!isValidMacAddress(device.mac)) {
            setMacError("Please enter a valid MAC address (XX:XX:XX:XX:XX:XX)");
            return;
        }

        if (!device.name.trim()) {
            toast.error("Device Name is required");
            return;
        }

        setMacError("");
        onSubmit();
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>Add New Device</DialogTitle>
                    <DialogDescription>
                        Fill in the details to register a new device.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 gap-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="mac">MAC Address</Label>
                            <Input
                                id="mac"
                                name="mac"
                                value={device.mac}
                                placeholder="AA:BB:CC:DD:EE:FF"
                                maxLength={17}
                                className={macError ? "border-red-500" : ""}
                                onChange={(e) =>
                                    handleMacChange(e.target.value)
                                }
                            />
                            {macError && (
                                <p className="text-sm text-red-500">
                                    {macError}
                                </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                                Format: XX:XX:XX:XX:XX:XX (hexadecimal)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name">Device Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={device.name}
                                placeholder="Enter device name"
                                required
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
                                name="location"
                                value={device.location}
                                placeholder="Enter location"
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
                                }>
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
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
                    </div>

                    <DialogFooter className="mt-6">
                        <DialogClose asChild>
                            <Button type="button" variant="outline">
                                Cancel
                            </Button>
                        </DialogClose>
                        <Button
                            type="submit"
                            disabled={
                                !!macError ||
                                !device.mac.trim() ||
                                !device.name.trim()
                            }>
                            Add Device
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
