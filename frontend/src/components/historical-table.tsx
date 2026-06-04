"use client";
import { useState, useEffect } from "react";
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
import {
    Card,
    CardDescription,
    CardHeader,
    CardTitle,
    CardAction,
} from "@/components/ui/card";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, FileSpreadsheet, Search, Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config/api";

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

export default function HistoricalTable() {
    const [allData, setAllData] = useState<SensorData[]>([]);
    const [displayData, setDisplayData] = useState<SensorData[]>([]);
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1,
    });
    const [loading, setLoading] = useState(false);
    const [exporting, setExporting] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(new Date());
    const [endDate, setEndDate] = useState<Date | null>(new Date());
    const [showData, setShowData] = useState(false);
    const [openDatePicker, setOpenDatePicker] = useState(false);
    const [appliedStartDate, setAppliedStartDate] = useState<Date | null>(null);
    const [appliedEndDate, setAppliedEndDate] = useState<Date | null>(null);

    useEffect(() => {
        const currentDate = new Date();
        setAppliedStartDate(currentDate);
        setAppliedEndDate(currentDate);
    }, []);

    useEffect(() => {
        if (appliedStartDate && appliedEndDate) {
            (async () => {
                await fetchData();
            })();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedStartDate, appliedEndDate]);

    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
    };

    const fetchData = async () => {
        if (!appliedStartDate || !appliedEndDate) return;

        setLoading(true);
        setShowData(false);

        const startTime = Date.now();
        const minLoadingDuration = 500;

        try {
            const params = {
                start_date: formatLocalDate(appliedStartDate),
                end_date: formatLocalDate(appliedEndDate),
            };

            const res = await axios.get(API_BASE_URL + "/sensor-data/export", {
                params,
            });

            const fetchedData = res.data.data;
            setAllData(fetchedData);

            const total = fetchedData.length;
            const pages = Math.ceil(total / pagination.limit);

            setPagination({
                page: 1,
                limit: pagination.limit,
                total,
                pages,
            });

            setDisplayData(fetchedData.slice(0, pagination.limit));

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);

            if (remainingTime > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, remainingTime),
                );
            }

            setShowData(true);
        } catch (error) {
            console.error("Error fetching data:", error);
            setAllData([]);
            setDisplayData([]);

            const elapsedTime = Date.now() - startTime;
            const remainingTime = Math.max(0, minLoadingDuration - elapsedTime);
            if (remainingTime > 0) {
                await new Promise((resolve) =>
                    setTimeout(resolve, remainingTime),
                );
            }
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page: number) => {
        if (page < 1 || page > pagination.pages) return;

        const startIndex = (page - 1) * pagination.limit;
        const endIndex = startIndex + pagination.limit;

        setDisplayData(allData.slice(startIndex, endIndex));
        setPagination((prev) => ({
            ...prev,
            page,
        }));
    };

    const handleSearch = () => {
        if (!startDate || !endDate) return;

        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);

        fetchData();
    };

    const formatDate = (dateString?: string) => {
        if (!dateString || typeof dateString !== "string") return "-";

        const normalized = dateString.replace("T", " ").replace("Z", "");
        const parts = normalized.split(" ");
        if (parts.length < 2) return normalized;

        const [datePart, timePart] = parts;

        const [year, month, day] = datePart.split("-");
        if (!year || !month || !day) return normalized;

        const time = timePart.split(".")[0];
        const [hour, minute, second] = time.split(":");

        if (!hour || !minute || !second) return normalized;

        return `${day} ${new Date(
            Number(year),
            Number(month) - 1,
        ).toLocaleString("en-US", {
            month: "short",
        })} ${year}, ${hour}:${minute}:${second}`;
    };

    const exportToExcel = async () => {
        if (!appliedStartDate || !appliedEndDate || allData.length === 0)
            return;

        setExporting(true);

        try {
            const headers = [
                "RECORDED AT",
                "DEVICE NAME",
                "LOCATION",
                "MAC ADDRESS",
                "TEMPERATURE",
                "HUMIDITY",
            ];

            const csvData = allData.map((row: SensorData) => [
                formatDate(row.recorded_at),
                row.device_name,
                row.location,
                row.mac_address,
                row.temperature,
                row.humidity,
            ]);

            const csvContent = [
                headers.join(","),
                ...csvData.map((row: (string | undefined)[]) =>
                    row
                        .map((cell: string | undefined) => {
                            const escaped = String(cell ?? "").replace(
                                /"/g,
                                '""',
                            );
                            return `"${escaped}"`;
                        })
                        .join(","),
                ),
            ].join("\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);

            const filename = `ENVIRONMENT_RECORDS_${formatLocalDate(
                appliedStartDate,
            )}_TO_${formatLocalDate(appliedEndDate)}.csv`;

            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = "hidden";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } catch (error) {
            console.error("Error exporting data:", error);
            alert("Failed to export data. Please try again.");
        } finally {
            setExporting(false);
        }
    };

    const hasAnyData = displayData && displayData.length > 0;

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Device Logs & Alerts</CardTitle>
                <CardDescription>
                    Track device alerts and historical logs
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
                        <div className="flex flex-col sm:flex-row gap-3 w-full">
                            <Popover
                                open={openDatePicker}
                                onOpenChange={setOpenDatePicker}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="justify-start text-left w-full sm:w-auto h-9"
                                        disabled={loading || exporting}
                                    >
                                        {startDate && endDate
                                            ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`
                                            : startDate
                                              ? startDate.toLocaleDateString()
                                              : "Select Date Range"}
                                        <CalendarIcon className="ml-2 h-4 w-4" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="w-auto p-0"
                                    align="end"
                                >
                                    <Calendar
                                        mode="range"
                                        selected={{
                                            from: startDate || undefined,
                                            to: endDate || undefined,
                                        }}
                                        onSelect={(range) => {
                                            if (range?.from) {
                                                setStartDate(range.from);
                                            }
                                            if (range?.to) {
                                                setEndDate(range.to);
                                            }
                                        }}
                                        numberOfMonths={2}
                                        initialFocus
                                    />
                                    <div className="flex justify-end gap-2 pb-5 px-5">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            className="h-9"
                                            onClick={() => {
                                                setStartDate(null);
                                                setEndDate(null);
                                                setAppliedStartDate(null);
                                                setAppliedEndDate(null);
                                                setShowData(false);
                                                setAllData([]);
                                                setDisplayData([]);
                                                setPagination({
                                                    page: 1,
                                                    limit: 10,
                                                    total: 0,
                                                    pages: 1,
                                                });
                                            }}
                                        >
                                            Reset
                                        </Button>

                                        <Button
                                            size="sm"
                                            onClick={handleSearch}
                                            disabled={
                                                !startDate ||
                                                !endDate ||
                                                loading ||
                                                exporting
                                            }
                                            className="h-9"
                                        >
                                            <Search className="h-4 w-4" />
                                            Search
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {!loading && showData && hasAnyData && (
                        <div className="flex w-full sm:w-auto">
                            <Button
                                size="sm"
                                onClick={exportToExcel}
                                disabled={exporting}
                                className="h-9"
                            >
                                {exporting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    <FileSpreadsheet className="h-4 w-4" />
                                )}
                                <span className="hidden sm:inline">
                                    {exporting ? "Exporting..." : "Export"}
                                </span>
                            </Button>
                        </div>
                    )}
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
                                <TableRow>
                                    <TableHead>Recorded At</TableHead>
                                    <TableHead>Device Name</TableHead>
                                    <TableHead>Location</TableHead>
                                    <TableHead>MAC Address</TableHead>
                                    <TableHead>Temperature</TableHead>
                                    <TableHead>Humidity</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {displayData.length > 0 ? (
                                    displayData.map((row) => (
                                        <TableRow key={row.id}>
                                            <TableCell>
                                                {formatDate(row.recorded_at)}
                                            </TableCell>
                                            <TableCell>
                                                {row.device_name}
                                            </TableCell>
                                            <TableCell>
                                                {row.location}
                                            </TableCell>
                                            <TableCell>
                                                {row.mac_address}
                                            </TableCell>
                                            <TableCell>
                                                {row.temperature}°C
                                            </TableCell>
                                            <TableCell>
                                                {row.humidity}%
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell
                                            colSpan={7}
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
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {pagination.total} record(s) found
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
