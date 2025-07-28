import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
    IconDotsVertical,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteDeviceDialog } from "@/app/configuration/dialog/delete-device-dialog";
import { EditDeviceDialog } from "@/app/configuration/dialog/edit-device-dialog";
import { Plus } from "lucide-react";
import { AddDeviceDialog } from "@/app/configuration/dialog/add-device-dialog";

type DeviceData = {
    device_name: string;
    mac_address: string;
    location: string;
    status: string;
    tempMin: number;
    tempMax: number;
    humidMin: number;
    humidMax: number;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export default function DeviceDataTable() {
    const [data, setData] = useState<DeviceData[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<{
        mac: string;
        name: string;
        location: string;
        status: string;
        thresholds?: {
            temperature?: { min: number; max: number };
            humidity?: { min: number; max: number };
            pressure?: { min: number; max: number };
        };
    }>({
        mac: "",
        name: "",
        location: "",
        status: "",
        thresholds: {
            temperature: { min: 0, max: 0 },
            humidity: { min: 0, max: 0 },
            pressure: { min: 0, max: 0 },
        },
    });

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 15,
        total: 0,
        pages: 1,
    });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                import.meta.env.VITE_API_BASE_URL + "/devices/with-thresholds",
                {
                    params: {
                        page: pagination.page,
                        limit: pagination.limit,
                    },
                }
            );
            setData(res.data.data);
            setPagination(res.data.pagination);
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    }, [pagination.page, pagination.limit]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.pages) {
            setPagination((prev) => ({ ...prev, page }));
        }
    };

    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);
    const handleDelete = async (mac: string) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/devices/${mac}`
            );
            await fetchData();
            toast.success(
                `${selectedDevice.name} successfully removed from the system`
            );
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Delete Failed");
        }
    };
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        mac: "",
        name: "",
        location: "",
        status: "Active",
    });

    const handleAddSubmit = async () => {

        try {
            const payload = {
                mac_address: newDevice.mac,
                device_name: newDevice.name,
                location: newDevice.location,
                status: newDevice.status,
            };

            console.log("Payload to send:", payload);
            console.log(
                "API URL:",
                `${import.meta.env.VITE_API_BASE_URL}/devices`
            );

            const response = await axios.post(
                `${import.meta.env.VITE_API_BASE_URL}/devices`,
                payload
            );

            console.log("API Response:", response.data);

            await fetchData();
            toast.success(`${newDevice.name} added successfully`);

            setAddDialogOpen(false);
            setNewDevice({
                mac: "",
                name: "",
                location: "",
                status: "Active",
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
                console.error("Response status:", err.response?.status);
                console.error("Response data:", err.response?.data);
                console.error("Request config:", err.config);

                if (err.response?.status === 400) {
                    toast.error(err.response.data.error || "Invalid data");
                } else if (err.response?.status === 404) {
                    toast.error("API endpoint not found");
                } else {
                    toast.error(`Request failed: ${err.response?.status}`);
                }
            } else {
                console.error("Non-axios error:", err);
                toast.error("An unexpected error occurred");
            }
        }
    };

    const handleEditSubmit = async () => {
        try {
            const existingDevice = data.find(
                (device) =>
                    device.device_name.toLowerCase() ===
                    selectedDevice.name.toLowerCase() &&
                    device.mac_address !== selectedDevice.mac
            );

            if (existingDevice) {
                toast.error(
                    "A device with this name already exists. Please choose a different name."
                );
                return;
            }

            const payload = {
                name: selectedDevice.name,
                location: selectedDevice.location,
                status: selectedDevice.status,
                thresholds: selectedDevice.thresholds,
            };

            await axios.put(
                `${import.meta.env.VITE_API_BASE_URL}/devices/${selectedDevice.mac
                }`,
                payload
            );

            await fetchData();
            toast.success(`${selectedDevice.name} updated successfully`);
            setEditDialog(false);
        } catch (err) {
            console.error("Update error:", err);

            if (axios.isAxiosError(err) && err.response) {
                const status = err.response.status;
                const message =
                    err.response.data?.message ||
                    err.response.data?.error ||
                    "";

                if (
                    (status === 409 || status === 400) &&
                    (message.toLowerCase().includes("duplicate") ||
                        message.toLowerCase().includes("already exists") ||
                        message.toLowerCase().includes("name"))
                ) {
                    toast.error(
                        "A device with this name already exists. Please choose a different name."
                    );
                } else if (status === 404) {
                    toast.error("Device not found");
                } else {
                    toast.error("Failed to update device");
                }
            } else {
                toast.error("Network error - please check your connection");
            }
        }
    };

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden">
            <CardHeader>
                <CardTitle>Device Setup</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        List of all connected devices
                    </span>
                    <span className="@[540px]/card:hidden">Device list</span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row sm:items-center">
                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => setAddDialogOpen(true)}>
                        <Plus className="h-4 w-4" /> Add Device
                    </Button>
                    <AddDeviceDialog
                        open={addDialogOpen}
                        onOpenChange={setAddDialogOpen}
                        device={newDevice}
                        setDevice={setNewDevice}
                        onSubmit={handleAddSubmit}
                    />
                </CardAction>
            </CardHeader>
            <Tabs defaultValue="outline" className="w-full flex-col gap-4">
                <TabsContent
                    value="outline"
                    className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[600px]">
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                <TableRow>
                                    <TableHead>Device Name</TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Temp Min</TableHead>
                                    <TableHead>Temp Max</TableHead>
                                    <TableHead>Humid Min</TableHead>
                                    <TableHead>Humid Max</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((row) => (
                                        <TableRow key={row.device_name}>
                                            <TableCell>
                                                {row.device_name}
                                            </TableCell>
                                            <TableCell>
                                                {row.mac_address}
                                            </TableCell>
                                            <TableCell>
                                                {row.location}
                                            </TableCell>
                                            <TableCell>
                                                {" "}
                                                <Badge
                                                    variant="outline"
                                                    className={
                                                        row.status === "Active"
                                                            ? "border-green-300 text-green-500 dark:border-green-900 dark:text-green-400"
                                                            : "border-red-300 text-red-500 dark:border-red-900 dark:text-red-400"
                                                    }>
                                                    {row.status === "Active" ? (
                                                        <>
                                                            <CheckCircle className="w-4 h-4" />
                                                            Active
                                                        </>
                                                    ) : (
                                                        <>
                                                            <XCircle className="w-4 h-4" />
                                                            Inactive
                                                        </>
                                                    )}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ArrowDown className="w-4 h-4 text-blue-500" />
                                                    <span>{row.tempMin}°C</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ArrowUp className="w-4 h-4 text-red-500" />
                                                    <span>{row.tempMax}°C</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ArrowDown className="w-4 h-4 text-blue-500" />
                                                    <span>{row.humidMin}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1">
                                                    <ArrowUp className="w-4 h-4 text-red-500" />
                                                    <span>{row.humidMax}%</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="p-0 pr-2 text-right w-[40px]">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger
                                                        asChild>
                                                        <Button
                                                            variant="ghost"
                                                            className="data-[state=open]:bg-muted text-muted-foreground flex size-3"
                                                            size="icon">
                                                            <IconDotsVertical />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-32">
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setEditDialog(
                                                                    true
                                                                );
                                                                setSelectedDevice(
                                                                    {
                                                                        mac: row.mac_address,
                                                                        name: row.device_name,
                                                                        location:
                                                                            row.location,
                                                                        status: row.status,
                                                                        thresholds:
                                                                        {
                                                                            temperature:
                                                                            {
                                                                                min:
                                                                                    row.tempMin ||
                                                                                    0,
                                                                                max:
                                                                                    row.tempMax ||
                                                                                    0,
                                                                            },
                                                                            humidity:
                                                                            {
                                                                                min:
                                                                                    row.humidMin ||
                                                                                    0,
                                                                                max:
                                                                                    row.humidMax ||
                                                                                    0,
                                                                            },
                                                                        },
                                                                    }
                                                                );
                                                            }}>
                                                            Edit
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem
                                                            onClick={() => {
                                                                setOpenDialog(
                                                                    true
                                                                );
                                                                setSelectedDevice(
                                                                    {
                                                                        mac: row.mac_address,
                                                                        name: row.device_name,
                                                                        location:
                                                                            row.location,
                                                                        status: row.status,
                                                                        thresholds:
                                                                        {
                                                                            temperature:
                                                                            {
                                                                                min:
                                                                                    row.tempMin ||
                                                                                    0,
                                                                                max:
                                                                                    row.tempMax ||
                                                                                    0,
                                                                            },
                                                                            humidity:
                                                                            {
                                                                                min:
                                                                                    row.humidMin ||
                                                                                    0,
                                                                                max:
                                                                                    row.humidMax ||
                                                                                    0,
                                                                            },
                                                                        },
                                                                    }
                                                                );
                                                            }}
                                                            variant="destructive">
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={8}
                                            className="text-center font-medium">
                                            {loading
                                                ? "Loading..."
                                                : "No records found."}
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        <DeleteDeviceDialog
                            open={openDialog}
                            onOpenChange={setOpenDialog}
                            device={selectedDevice}
                            onDelete={handleDelete}
                        />
                        <EditDeviceDialog
                            open={editDialog}
                            onOpenChange={setEditDialog}
                            device={selectedDevice}
                            setDevice={setSelectedDevice}
                            onSubmit={handleEditSubmit}
                        />
                    </div>
                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {pagination.total} row(s) found.
                        </div>

                        <div className="flex items-center gap-1 flex-wrap">
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(1)}
                                disabled={pagination.page === 1}>
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={pagination.page === 1}>
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="px-2 text-sm font-medium">
                                Page {pagination.page} of {pagination.pages}
                            </div>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={pagination.page === pagination.pages}>
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.pages)}
                                disabled={pagination.page === pagination.pages}>
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
