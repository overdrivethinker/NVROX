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
import { CheckCircle, XCircle, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteDeviceDialog } from "@/app/configuration/device/delete-device-dialog";
import { EditDeviceDialog } from "@/app/configuration/device/edit-device-dialog";
import { AddDeviceDialog } from "@/app/configuration/device/add-device-dialog";
import { useAuth } from "@/config/auth";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { API_BASE_URL } from "@/config/api";

type DeviceData = {
    device_name: string;
    mac_address: string;
    location: string;
    status: string;

    tempWarningLow: number;
    tempWarningHigh: number;
    tempAlertLow: number;
    tempAlertHigh: number;

    humidWarningLow: number;
    humidWarningHigh: number;
    humidAlertLow: number;
    humidAlertHigh: number;
};

type ThresholdRange = {
    warningLow: number;
    warningHigh: number;
    alertLow: number;
    alertHigh: number;
};

type SelectedDevice = {
    mac: string;
    name: string;
    location: string;
    status: string;
    thresholds?: {
        temperature?: ThresholdRange;
        humidity?: ThresholdRange;
    };
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

const EMPTY_RANGE: ThresholdRange = {
    warningLow: 0,
    warningHigh: 0,
    alertLow: 0,
    alertHigh: 0,
};

/**
 * Sel angka dengan warna sesuai level.
 * alert → merah, warning → kuning
 */
function NumCell({
    value,
    level,
    tinted,
}: {
    value: number;
    level: "alert" | "warning";
    tinted?: "temp" | "humid";
}) {
    const color =
        level === "alert"
            ? "text-red-600 dark:text-red-400"
            : "text-amber-600 dark:text-amber-400";

    const bg =
        tinted === "temp"
            ? "bg-orange-50/40 dark:bg-orange-950/10"
            : tinted === "humid"
              ? "bg-blue-50/40 dark:bg-blue-950/10"
              : "";

    return (
        <TableCell className={`text-center ${bg}`}>
            <span className={`font-mono text-sm font-medium ${color}`}>
                {value}
            </span>
        </TableCell>
    );
}

export default function DeviceDataTable() {
    const [data, setData] = useState<DeviceData[]>([]);
    const [selectedDevice, setSelectedDevice] = useState<SelectedDevice>({
        mac: "",
        name: "",
        location: "",
        status: "",
        thresholds: {
            temperature: { ...EMPTY_RANGE },
            humidity: { ...EMPTY_RANGE },
        },
    });

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 9,
        total: 0,
        pages: 1,
    });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                `${API_BASE_URL}/devices/with-thresholds`,
                {
                    params: {
                        page: pagination.page,
                        limit: pagination.limit,
                    },
                },
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

    const buildSelectedDevice = (row: DeviceData): SelectedDevice => ({
        mac: row.mac_address,
        name: row.device_name,
        location: row.location,
        status: row.status,
        thresholds: {
            temperature: {
                warningLow: row.tempWarningLow ?? 0,
                warningHigh: row.tempWarningHigh ?? 0,
                alertLow: row.tempAlertLow ?? 0,
                alertHigh: row.tempAlertHigh ?? 0,
            },
            humidity: {
                warningLow: row.humidWarningLow ?? 0,
                warningHigh: row.humidWarningHigh ?? 0,
                alertLow: row.humidAlertLow ?? 0,
                alertHigh: row.humidAlertHigh ?? 0,
            },
        },
    });

    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);

    const handleDelete = async (mac: string) => {
        try {
            await axios.delete(`${API_BASE_URL}/devices/${mac}`);
            await fetchData();
            toast.success(
                `${selectedDevice.name} successfully removed from the system`,
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

            const response = await axios.post(
                `${API_BASE_URL}/devices`,
                payload,
            );

            console.log("API Response:", response.data);

            await fetchData();
            toast.success(`${newDevice.name} added successfully`, {
                description: "Default thresholds have been applied.",
            });

            setAddDialogOpen(false);
            setNewDevice({
                mac: "",
                name: "",
                location: "",
                status: "Active",
            });
        } catch (err) {
            if (axios.isAxiosError(err)) {
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
                    device.mac_address !== selectedDevice.mac,
            );

            if (existingDevice) {
                toast.error(
                    "A device with this name already exists. Please choose a different name.",
                );
                return;
            }

            const t = selectedDevice.thresholds?.temperature;
            const h = selectedDevice.thresholds?.humidity;

            const isInvalid = (r?: ThresholdRange) =>
                r &&
                !(
                    r.alertLow < r.warningLow &&
                    r.warningLow < r.warningHigh &&
                    r.warningHigh < r.alertHigh
                );

            if (isInvalid(t) || isInvalid(h)) {
                toast.error(
                    "Invalid threshold order. Must be: alertLow < warningLow < warningHigh < alertHigh",
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
                `${API_BASE_URL}/devices/${selectedDevice.mac}`,
                payload,
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
                        "A device with this name already exists. Please choose a different name.",
                    );
                } else if (status === 404) {
                    toast.error("Device not found");
                } else if (message.toLowerCase().includes("threshold order")) {
                    toast.error(message);
                } else {
                    toast.error("Failed to update device");
                }
            } else {
                toast.error("Network error - please check your connection");
            }
        }
    };

    const { isAdmin } = useAuth();

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Device Setup</CardTitle>
                <CardDescription>
                    <span className="hidden @[540px]/card:block">
                        List of all registered devices
                    </span>
                    <span className="@[540px]/card:hidden">Device list</span>
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row sm:items-center">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <span className="inline-block">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9"
                                    disabled={!isAdmin}
                                    onClick={() => setAddDialogOpen(true)}
                                >
                                    <Plus className="h-4 w-4" /> Add Device
                                </Button>
                            </span>
                        </TooltipTrigger>
                        {!isAdmin && (
                            <TooltipContent side="left">
                                <p>Only admin can add new device</p>
                            </TooltipContent>
                        )}
                    </Tooltip>
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
                    className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6"
                >
                    <div className="overflow-x-auto rounded-lg border">
                        <Table className="min-w-[1000px]">
                            <TableHeader className="bg-muted sticky top-0 z-10">
                                {/* Baris header 1: grup parameter */}
                                <TableRow>
                                    <TableHead
                                        rowSpan={2}
                                        className="w-[150px]"
                                    >
                                        Device Name
                                    </TableHead>
                                    <TableHead
                                        rowSpan={2}
                                        className="w-[150px]"
                                    >
                                        MAC Address
                                    </TableHead>
                                    <TableHead
                                        rowSpan={2}
                                        className="w-[110px]"
                                    >
                                        Location
                                    </TableHead>
                                    <TableHead rowSpan={2} className="w-[90px]">
                                        Status
                                    </TableHead>

                                    {/* Grup Temperature */}
                                    <TableHead
                                        colSpan={4}
                                        className="text-center border-b bg-orange-50/40 dark:bg-orange-950/10 text-orange-700 dark:text-orange-300"
                                    >
                                        Temperature (°C)
                                    </TableHead>

                                    {/* Grup Humidity */}
                                    <TableHead
                                        colSpan={4}
                                        className="text-center border-b bg-blue-50/40 dark:bg-blue-950/10 text-blue-700 dark:text-blue-300"
                                    >
                                        Humidity (%)
                                    </TableHead>

                                    <TableHead
                                        rowSpan={2}
                                        className="w-[50px] text-center"
                                    ></TableHead>
                                </TableRow>

                                {/* Baris header 2: AL WL WH AH */}
                                <TableRow>
                                    {/* Temperature sub-header */}
                                    <TableHead className="text-center w-[60px] border-b bg-orange-50/40 dark:bg-orange-950/10 text-red-600 dark:text-red-400 font-mono">
                                        AL
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-orange-50/40 dark:bg-orange-950/10 text-amber-600 dark:text-amber-400 font-mono">
                                        WL
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-orange-50/40 dark:bg-orange-950/10 text-amber-600 dark:text-amber-400 font-mono">
                                        WH
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-orange-50/40 dark:bg-orange-950/10 text-red-600 dark:text-red-400 font-mono">
                                        AH
                                    </TableHead>

                                    {/* Humidity sub-header */}
                                    <TableHead className="text-center w-[60px] border-b bg-blue-50/40 dark:bg-blue-950/10 text-red-600 dark:text-red-400 font-mono">
                                        AL
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-blue-50/40 dark:bg-blue-950/10 text-amber-600 dark:text-amber-400 font-mono">
                                        WL
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-blue-50/40 dark:bg-blue-950/10 text-amber-600 dark:text-amber-400 font-mono">
                                        WH
                                    </TableHead>
                                    <TableHead className="text-center w-[60px] border-b bg-blue-50/40 dark:bg-blue-950/10 text-red-600 dark:text-red-400 font-mono">
                                        AH
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((row) => {
                                        const isActive =
                                            row.status === "Active";
                                        return (
                                            <TableRow
                                                key={row.mac_address}
                                                className="hover:bg-muted/40"
                                            >
                                                {/* Metadata device */}
                                                <TableCell>
                                                    {row.device_name}
                                                </TableCell>
                                                <TableCell className="text-xs">
                                                    {row.mac_address}
                                                </TableCell>
                                                <TableCell>
                                                    {row.location || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            isActive
                                                                ? "border-green-300 text-green-500 dark:border-green-900 dark:text-green-400"
                                                                : "border-red-300 text-red-500 dark:border-red-900 dark:text-red-400"
                                                        }
                                                    >
                                                        {isActive ? (
                                                            <>
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                                Active
                                                            </>
                                                        ) : (
                                                            <>
                                                                <XCircle className="w-3.5 h-3.5" />
                                                                Inactive
                                                            </>
                                                        )}
                                                    </Badge>
                                                </TableCell>

                                                {/* Temperature: AL WL WH AH */}
                                                <NumCell
                                                    value={row.tempAlertLow}
                                                    level="alert"
                                                    tinted="temp"
                                                />
                                                <NumCell
                                                    value={row.tempWarningLow}
                                                    level="warning"
                                                    tinted="temp"
                                                />
                                                <NumCell
                                                    value={row.tempWarningHigh}
                                                    level="warning"
                                                    tinted="temp"
                                                />
                                                <TableCell className="text-center bg-orange-50/40 dark:bg-orange-950/10">
                                                    <span className="font-mono text-sm font-medium text-red-600 dark:text-red-400">
                                                        {row.tempAlertHigh}
                                                    </span>
                                                </TableCell>

                                                {/* Humidity: AL WL WH AH */}
                                                <NumCell
                                                    value={row.humidAlertLow}
                                                    level="alert"
                                                    tinted="humid"
                                                />
                                                <NumCell
                                                    value={row.humidWarningLow}
                                                    level="warning"
                                                    tinted="humid"
                                                />
                                                <NumCell
                                                    value={row.humidWarningHigh}
                                                    level="warning"
                                                    tinted="humid"
                                                />
                                                <TableCell className="text-center bg-blue-50/40 dark:bg-blue-950/10">
                                                    <span className="font-mono text-sm font-medium text-red-600 dark:text-red-400">
                                                        {row.humidAlertHigh}
                                                    </span>
                                                </TableCell>

                                                {/* Aksi */}
                                                <TableCell className="text-center pr-0">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger
                                                            asChild
                                                        >
                                                            <Button
                                                                variant="ghost"
                                                                className="data-[state=open]:bg-muted text-muted-foreground mx-auto flex size-8"
                                                                size="icon"
                                                            >
                                                                <IconDotsVertical />
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent
                                                            align="end"
                                                            className="w-32"
                                                        >
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div>
                                                                        <DropdownMenuItem
                                                                            disabled={
                                                                                !isAdmin
                                                                            }
                                                                            className={
                                                                                !isAdmin
                                                                                    ? "opacity-50 cursor-not-allowed"
                                                                                    : ""
                                                                            }
                                                                            onClick={() => {
                                                                                setEditDialog(
                                                                                    true,
                                                                                );
                                                                                setSelectedDevice(
                                                                                    buildSelectedDevice(
                                                                                        row,
                                                                                    ),
                                                                                );
                                                                            }}
                                                                        >
                                                                            Edit
                                                                        </DropdownMenuItem>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                {!isAdmin && (
                                                                    <TooltipContent side="left">
                                                                        <p>
                                                                            Only
                                                                            admin
                                                                            can
                                                                            edit
                                                                            device
                                                                        </p>
                                                                    </TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                            <DropdownMenuSeparator />
                                                            <Tooltip>
                                                                <TooltipTrigger
                                                                    asChild
                                                                >
                                                                    <div>
                                                                        <DropdownMenuItem
                                                                            disabled={
                                                                                !isAdmin
                                                                            }
                                                                            className={
                                                                                !isAdmin
                                                                                    ? "opacity-50 cursor-not-allowed"
                                                                                    : ""
                                                                            }
                                                                            onClick={() => {
                                                                                setOpenDialog(
                                                                                    true,
                                                                                );
                                                                                setSelectedDevice(
                                                                                    buildSelectedDevice(
                                                                                        row,
                                                                                    ),
                                                                                );
                                                                            }}
                                                                            variant="destructive"
                                                                        >
                                                                            Delete
                                                                        </DropdownMenuItem>
                                                                    </div>
                                                                </TooltipTrigger>
                                                                {!isAdmin && (
                                                                    <TooltipContent side="left">
                                                                        <p>
                                                                            Only
                                                                            admin
                                                                            can
                                                                            delete
                                                                            device
                                                                        </p>
                                                                    </TooltipContent>
                                                                )}
                                                            </Tooltip>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={13}
                                            className="text-center font-medium"
                                        >
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
                                disabled={loading || pagination.page === 1}
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page - 1)}
                                disabled={loading || pagination.page === 1}
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>

                            <div className="px-2 text-sm font-medium">
                                Page {pagination.page} of {pagination.pages}
                            </div>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.page + 1)}
                                disabled={
                                    loading ||
                                    pagination.page === pagination.pages
                                }
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>

                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(pagination.pages)}
                                disabled={
                                    loading ||
                                    pagination.page === pagination.pages
                                }
                            >
                                <IconChevronsRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </Card>
    );
}
