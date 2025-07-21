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

export function AddDeviceDialog({ open, onOpenChange, device, setDevice, onSubmit }: Props) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <form onSubmit={(e) => { e.preventDefault(); onSubmit(); }}>
                <DialogContent className="sm:max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>Add New Device</DialogTitle>
                        <DialogDescription>
                            Fill in the details to register a new device.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
                        <div className="space-y-2">
                            <Label htmlFor="mac">MAC Address</Label>
                            <Input
                                id="mac"
                                name="mac"
                                value={device.mac}
                                onChange={(e) => setDevice({ ...device, mac: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="name">Device Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={device.name}
                                onChange={(e) => setDevice({ ...device, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="status">Status</Label>
                            <Select
                                value={device.status}
                                onValueChange={(value) => setDevice({ ...device, status: value })}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                                id="location"
                                name="location"
                                value={device.location}
                                onChange={(e) => setDevice({ ...device, location: e.target.value })}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button type="submit">Add Device</Button>
                    </DialogFooter>
                </DialogContent>
            </form>
        </Dialog>
    );
}
