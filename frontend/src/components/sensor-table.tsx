import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import { format, parseISO } from "date-fns";
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

type SensorData = {
    id: number;
    device_name: string;
    location: string;
    mac_address: string;
    temperature: string;
    humidity: string;
    recorded_at: string;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

export default function SensorDataTable() {
    const [data, setData] = useState<SensorData[]>([]);
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
                import.meta.env.VITE_API_BASE_URL + "/sensor-data",
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

    return (
        <Tabs defaultValue="outline" className="w-full flex-col gap-4">
            <TabsContent
                value="outline"
                className="relative flex flex-col gap-4 overflow-auto">
                <div className="overflow-x-auto rounded-lg border">
                    <Table className="min-w-[600px]">
                        <TableHeader className="bg-muted sticky top-0 z-10">
                            <TableRow>
                                <TableHead>ID</TableHead>
                                <TableHead>Device Name</TableHead>
                                <TableHead>Location</TableHead>
                                <TableHead>MAC Address</TableHead>
                                <TableHead>Temperature</TableHead>
                                <TableHead>Humidity</TableHead>
                                <TableHead>Recorded At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.length > 0 ? (
                                data.map((row) => (
                                    <TableRow key={row.id}>
                                        <TableCell>{row.id}</TableCell>
                                        <TableCell>{row.device_name}</TableCell>
                                        <TableCell>{row.location}</TableCell>
                                        <TableCell>{row.mac_address}</TableCell>
                                        <TableCell>
                                            {row.temperature}°C
                                        </TableCell>
                                        <TableCell>{row.humidity}%</TableCell>
                                        <TableCell>
                                            {formatDate(row.recorded_at)}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
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
