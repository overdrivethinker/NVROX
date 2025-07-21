import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
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
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { toast } from "sonner";
import { CheckCircle, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DeleteDeviceDialog } from "@/app/configuration/delete-device-dialog";
import { EditDeviceDialog } from "@/app/configuration/edit-device-dialog";

type DeviceData = {
    device_name: string;
    mac_address: string;
    location: string;
    status: string;
    created_at: string;
    updated_at: string;
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
    }>({
        mac: "",
        name: "",
        location: "",
        status: "",
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
                import.meta.env.VITE_API_BASE_URL + "/devices",
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

    const formatDate = (dateStr: string) => {
        return format(parseISO(dateStr), "yyyy-MM-dd HH:mm:ss");
    };
    const [openDialog, setOpenDialog] = useState(false);
    const [editDialog, setEditDialog] = useState(false);
    const handleDelete = async (mac: string) => {
        try {
            await axios.delete(
                `${import.meta.env.VITE_API_BASE_URL}/devices/${mac}`
            );
            await fetchData();
            toast.success(`Device ${selectedDevice.name} deleted`);
        } catch (err) {
            console.error("Delete error:", err);
            toast.error("Delete Failed");
        }
    };

    return (
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
                                <TableHead>Created At</TableHead>
                                <TableHead>Updated At</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <TableRow key={row.device_name}>
                                        <TableCell>{row.device_name}</TableCell>
                                        <TableCell>{row.mac_address}</TableCell>
                                        <TableCell>{row.location}</TableCell>
                                        <TableCell>
                                            {" "}
                                            <Badge
                                                variant="outline"
                                                className={
                                                    row.status === "Active"
                                                        ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-400"
                                                        : "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-400"
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
                                            {formatDate(row.created_at)}
                                        </TableCell>
                                        <TableCell>
                                            {formatDate(row.updated_at)}
                                        </TableCell>
                                        <TableCell className="p-0 pr-2 text-right w-[40px]">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
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
                                                            setEditDialog(true);
                                                            setSelectedDevice({
                                                                mac: row.mac_address,
                                                                name: row.device_name,
                                                                location:
                                                                    row.location,
                                                                status: row.status,
                                                            });
                                                        }}>
                                                        Edit
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setOpenDialog(true);
                                                            setSelectedDevice({
                                                                mac: row.mac_address,
                                                                name: row.device_name,
                                                                location:
                                                                    row.location,
                                                                status: row.status,
                                                            });
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
                                        colSpan={6}
                                        className="text-center font-medium">
                                        {loading
                                            ? "Loading..."
                                            : "No records found."}
                                    </TableCell>
                                </TableRow>
                            )}
                            <DeleteDeviceDialog
                                open={openDialog}
                                onOpenChange={setOpenDialog}
                                onDelete={handleDelete}
                                device={selectedDevice}
                            />
                            <EditDeviceDialog
                                open={editDialog}
                                onOpenChange={setEditDialog}
                                device={selectedDevice}
                                setDevice={setSelectedDevice}
                                onSubmit={() => {
                                    setEditDialog(false);
                                    toast.success("Device updated");
                                }}
                            />
                        </TableBody>
                    </Table>
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
    );
}
