import { useEffect, useState } from "react";
import axios from "axios";
import {
    Select,
    SelectTrigger,
    SelectValue,
    SelectContent,
    SelectItem,
} from "@/components/ui/select";

type Device = {
    device_name: string;
    mac_address: string;
    location: string;
};

type DeviceSelectorProps = {
    value?: string;
    onChange: (value: string) => void;
};

export function DeviceSelector({ value, onChange }: DeviceSelectorProps) {
    const [devices, setDevices] = useState<Device[]>([]);

    useEffect(() => {
        axios
            .get(import.meta.env.VITE_API_BASE_URL + "/devices/list")
            .then((res) => setDevices(res.data))
            .catch((err) => console.error("Error fetching devices", err));
    }, []);

    return (
        <Select value={value} onValueChange={onChange}>
            <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select device" />
            </SelectTrigger>
            <SelectContent
                className="max-h-[200px] overflow-y-auto"
                position="popper">
                {devices.map((device) => (
                    <SelectItem
                        key={device.mac_address}
                        value={device.mac_address}>
                        {device.device_name} — {device.location}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
