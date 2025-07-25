import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
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

import { CheckCircle, XCircle, ArrowUp, ArrowDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type DeviceData = {
    device_name: string;
    location: string;
    parameter: string;
    value: number;
    threshold: number;
    status: string;
    recorded_at: string;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export default function AlertsDataTable() {
    const [data, setData] = useState<DeviceData[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 5,
        total: 0,
        pages: 1,
    });
    const [loading, setLoading] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(
                import.meta.env.VITE_API_BASE_URL + "/devices/alerts",
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
                                <TableHead>Location</TableHead>
                                <TableHead>Parameter</TableHead>
                                <TableHead>Value</TableHead>
                                <TableHead>Threshold</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Recorded At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <TableRow key={row.device_name}>
                                        <TableCell>{row.device_name}</TableCell>
                                        <TableCell>{row.location}</TableCell>
                                        <TableCell>
                                            {" "}
                                            <Badge
                                                variant="outline"
                                                className={
                                                    row.parameter ===
                                                    "Temperature"
                                                        ? "border-green-300 text-green-500 dark:border-green-900 dark:text-green-400"
                                                        : "border-red-300 text-red-500 dark:border-red-900 dark:text-red-400"
                                                }>
                                                {row.status ===
                                                "Temperature" ? (
                                                    <>
                                                        <CheckCircle className="w-4 h-4" />
                                                        Temperature
                                                    </>
                                                ) : (
                                                    <>
                                                        <XCircle className="w-4 h-4" />
                                                        Humidity
                                                    </>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{row.value}</TableCell>
                                        <TableCell>{row.threshold}</TableCell>
                                        <TableCell>
                                            {" "}
                                            <Badge
                                                variant="outline"
                                                className={
                                                    row.status === "Exceed"
                                                        ? "border-green-300 text-green-500 dark:border-green-900 dark:text-green-400"
                                                        : "border-red-300 text-red-500 dark:border-red-900 dark:text-red-400"
                                                }>
                                                {row.status === "Exceed" ? (
                                                    <>
                                                        <ArrowUp className="w-4 h-4" />
                                                        Exceed
                                                    </>
                                                ) : (
                                                    <>
                                                        <ArrowDown className="w-4 h-4" />
                                                        Deceed
                                                    </>
                                                )}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{row.recorded_at}</TableCell>
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
