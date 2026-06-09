import { useEffect, useState } from "react";
import axios from "axios";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";
import { API_BASE_URL } from "@/config/api";

export type Device = {
    device_name: string;
    mac_address: string;
    location: string;
};

type DeviceSelectorProps = {
    value?: string;
    onChange: (value: string) => void;
    onDevicesLoaded?: (devices: Device[]) => void;
};

export function DeviceSelector({
    value,
    onChange,
    onDevicesLoaded,
}: DeviceSelectorProps) {
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        axios
            .get(`${API_BASE_URL}/devices/list`)
            .then((res) => {
                setDevices(res.data);
                onDevicesLoaded?.(res.data);
            })
            .catch((err) => console.error("Error fetching devices", err));
    }, [onDevicesLoaded]);

    return (
        <Select value={value} onValueChange={onChange}>
            {/* Trigger fleksibel tapi minimal 200px */}
            <SelectTrigger className="w-auto min-w-[200px]">
                <SelectValue placeholder="Select device" />
            </SelectTrigger>

            {/* Dropdown maksimal 300px dan wrap teks panjang */}
            <SelectContent
                className="max-w-[300px] min-w-[var(--radix-select-trigger-width)] max-h-[200px] overflow-y-auto"
                position="popper"
            >
                {devices.map((device) => (
                    <SelectItem
                        key={device.mac_address}
                        value={device.mac_address}
                        className="whitespace-normal break-words"
                    >
                        {device.device_name} [{device.location}]
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
