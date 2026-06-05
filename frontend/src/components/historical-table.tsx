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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
    CalendarIcon,
    FileSpreadsheet,
    Search,
    Loader2,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

type AlertData = {
    id: number;
    device_name: string;
    location: string;
    mac_address: string;
    parameter: string;
    value: string;
    threshold: string;
    status: string;
    recorded_at: string;
};

type PaginationInfo = {
    page: number;
    limit: number;
    total: number;
    pages: number;
};

type ActiveTab = "history" | "alerts";

export default function HistoricalTable() {
    const [activeTab, setActiveTab] = useState<ActiveTab>("history");

    const [allData, setAllData] = useState<SensorData[]>([]);
    const [allAlertData, setAllAlertData] = useState<AlertData[]>([]);

    const [displayData, setDisplayData] = useState<SensorData[]>([]);
    const [displayAlertData, setDisplayAlertData] = useState<AlertData[]>([]);

    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 12,
        total: 0,
        pages: 1,
    });
    const [alertPagination, setAlertPagination] = useState<PaginationInfo>({
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
            fetchData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedStartDate, appliedEndDate, activeTab]);

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

            if (activeTab === "history") {
                const res = await axios.get(
                    API_BASE_URL + "/sensor-data/export",
                    { params },
                );
                const fetchedData: SensorData[] = res.data.data;
                setAllData(fetchedData);

                const total = fetchedData.length;
                const limit = pagination.limit;
                setPagination({
                    page: 1,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                });
                setDisplayData(fetchedData.slice(0, limit));
            } else {
                const res = await axios.get(
                    API_BASE_URL + "/sensor-data/alerts/export",
                    { params },
                );
                const fetchedData: AlertData[] = res.data.data;
                setAllAlertData(fetchedData);

                const total = fetchedData.length;
                const limit = alertPagination.limit;
                setAlertPagination({
                    page: 1,
                    limit,
                    total,
                    pages: Math.ceil(total / limit),
                });
                setDisplayAlertData(fetchedData.slice(0, limit));
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadingDuration - elapsed);
            if (remaining > 0)
                await new Promise((r) => setTimeout(r, remaining));

            setShowData(true);
        } catch (error) {
            console.error("Error fetching data:", error);
            if (activeTab === "history") {
                setAllData([]);
                setDisplayData([]);
            } else {
                setAllAlertData([]);
                setDisplayAlertData([]);
            }

            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, minLoadingDuration - elapsed);
            if (remaining > 0)
                await new Promise((r) => setTimeout(r, remaining));
        } finally {
            setLoading(false);
        }
    };

    const goToPage = (page: number) => {
        if (activeTab === "history") {
            if (page < 1 || page > pagination.pages) return;
            const start = (page - 1) * pagination.limit;
            setDisplayData(allData.slice(start, start + pagination.limit));
            setPagination((prev) => ({ ...prev, page }));
        } else {
            if (page < 1 || page > alertPagination.pages) return;
            const start = (page - 1) * alertPagination.limit;
            setDisplayAlertData(
                allAlertData.slice(start, start + alertPagination.limit),
            );
            setAlertPagination((prev) => ({ ...prev, page }));
        }
    };

    const handleSearch = () => {
        if (!startDate || !endDate) return;
        setAppliedStartDate(startDate);
        setAppliedEndDate(endDate);
    };

    const handleReset = () => {
        setStartDate(null);
        setEndDate(null);
        setAppliedStartDate(null);
        setAppliedEndDate(null);
        setShowData(false);
        setAllData([]);
        setAllAlertData([]);
        setDisplayData([]);
        setDisplayAlertData([]);
        setPagination({ page: 1, limit: 12, total: 0, pages: 1 });
        setAlertPagination({ page: 1, limit: 12, total: 0, pages: 1 });
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
        return `${day} ${new Date(Number(year), Number(month) - 1).toLocaleString("en-US", { month: "short" })} ${year}, ${hour}:${minute}:${second}`;
    };

    const exportToCSV = async () => {
        if (!appliedStartDate || !appliedEndDate) return;

        const isHistory = activeTab === "history";
        const sourceData = isHistory ? allData : allAlertData;
        if (sourceData.length === 0) return;

        setExporting(true);
        try {
            const headers = isHistory
                ? [
                      "RECORDED AT",
                      "DEVICE NAME",
                      "LOCATION",
                      "MAC ADDRESS",
                      "TEMPERATURE",
                      "HUMIDITY",
                  ]
                : [
                      "RECORDED AT",
                      "DEVICE NAME",
                      "LOCATION",
                      "MAC ADDRESS",
                      "PARAMETER",
                      "VALUE",
                      "THRESHOLD",
                      "STATUS",
                  ];

            const csvData = isHistory
                ? (allData as SensorData[]).map((row) => [
                      formatDate(row.recorded_at),
                      row.device_name,
                      row.location,
                      row.mac_address,
                      row.temperature,
                      row.humidity,
                  ])
                : (allAlertData as AlertData[]).map((row) => [
                      formatDate(row.recorded_at),
                      row.device_name,
                      row.location,
                      row.mac_address,
                      row.parameter,
                      row.value,
                      row.threshold,
                      row.status,
                  ]);

            const csvContent = [
                headers.join(","),
                ...csvData.map((row) =>
                    row
                        .map(
                            (cell) =>
                                `"${String(cell ?? "").replace(/"/g, '""')}"`,
                        )
                        .join(","),
                ),
            ].join("\n");

            const blob = new Blob([csvContent], {
                type: "text/csv;charset=utf-8;",
            });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            const prefix = isHistory ? "ENVIRONMENT_RECORDS" : "ALERT_RECORDS";
            const filename = `${prefix}_${formatLocalDate(appliedStartDate)}_TO_${formatLocalDate(appliedEndDate)}.csv`;

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

    const currentPagination =
        activeTab === "history" ? pagination : alertPagination;
    const hasAnyData =
        activeTab === "history"
            ? displayData.length > 0
            : displayAlertData.length > 0;

    return (
        <Card className="@container/card flex-1 min-h-[600px] overflow-hidden bg-transparent border-0 shadow-none">
            <CardHeader>
                <CardTitle>Device Logs & Alerts</CardTitle>
                <CardDescription>
                    Track historical device and alerts logs
                </CardDescription>

                <CardAction className="flex flex-col sm:flex-row sm:items-center gap-2">
                    {/* Toggle Switch */}
                    <ToggleGroup
                        type="single"
                        value={activeTab}
                        onValueChange={(value) => {
                            if (value && value !== activeTab) {
                                setActiveTab(value as ActiveTab);
                            }
                        }}
                        variant="outline"
                        disabled={loading || exporting}
                        className="hidden @[767px]/card:flex *:data-[slot=toggle-group-item]:!px-4"
                    >
                        <ToggleGroupItem value="history">
                            Device Logs
                        </ToggleGroupItem>
                        <ToggleGroupItem value="alerts">
                            Alerts Logs
                        </ToggleGroupItem>
                    </ToggleGroup>
                    <Select
                        value={activeTab}
                        onValueChange={(value) => {
                            if (value && value !== activeTab) {
                                setActiveTab(value as ActiveTab);
                            }
                        }}
                    >
                        <SelectTrigger
                            className="flex w-40 @[767px]/card:hidden"
                            size="sm"
                        >
                            <SelectValue placeholder="Select Logs" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                            <SelectItem value="history" className="rounded-lg">
                                History Logs
                            </SelectItem>
                            <SelectItem value="alerts" className="rounded-lg">
                                Alerts Logs
                            </SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Date Picker */}
                    <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center w-full sm:w-auto">
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
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    mode="range"
                                    selected={{
                                        from: startDate || undefined,
                                        to: endDate || undefined,
                                    }}
                                    onSelect={(range) => {
                                        if (range?.from)
                                            setStartDate(range.from);
                                        if (range?.to) setEndDate(range.to);
                                    }}
                                    numberOfMonths={2}
                                    initialFocus
                                />
                                <div className="flex justify-end gap-2 pb-5 px-5">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-9"
                                        onClick={handleReset}
                                    >
                                        Reset
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => {
                                            handleSearch();
                                            setOpenDatePicker(false);
                                        }}
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

                    {/* Export Button */}
                    {!loading && showData && hasAnyData && (
                        <div className="flex w-full sm:w-auto">
                            <Button
                                size="sm"
                                onClick={exportToCSV}
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
                        {/* History Table */}
                        {activeTab === "history" && (
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
                                                    {formatDate(
                                                        row.recorded_at,
                                                    )}
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
                                                colSpan={6}
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
                        )}

                        {/* Alerts Table */}
                        {activeTab === "alerts" && (
                            <Table className="min-w-[1100px]">
                                <TableHeader className="bg-muted sticky top-0 z-10">
                                    <TableRow>
                                        <TableHead>Recorded At</TableHead>
                                        <TableHead>Device Name</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead>MAC Address</TableHead>
                                        <TableHead>Parameter</TableHead>
                                        <TableHead>Threshold</TableHead>
                                        <TableHead>Value</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {displayAlertData.length > 0 ? (
                                        displayAlertData.map((row) => (
                                            <TableRow key={row.id}>
                                                <TableCell>
                                                    {formatDate(
                                                        row.recorded_at,
                                                    )}
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
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            row.parameter ===
                                                            "Humidity"
                                                                ? "border-blue-300 text-blue-500 dark:border-blue-900 dark:text-blue-400"
                                                                : "border-orange-300 text-orange-500 dark:border-orange-900 dark:text-orange-400"
                                                        }
                                                    >
                                                        {row.parameter ===
                                                        "Humidity"
                                                            ? "Humidity"
                                                            : "Temperature"}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>
                                                    {row.parameter ===
                                                    "Humidity"
                                                        ? `${row.threshold}%`
                                                        : row.parameter ===
                                                            "Temperature"
                                                          ? `${row.threshold}°C`
                                                          : row.threshold}
                                                </TableCell>
                                                <TableCell>
                                                    {row.parameter ===
                                                    "Humidity"
                                                        ? `${row.value}%`
                                                        : row.parameter ===
                                                            "Temperature"
                                                          ? `${row.value}°C`
                                                          : row.value}
                                                </TableCell>
                                                <TableCell>
                                                    {row.status ===
                                                    "Over Limit" ? (
                                                        <div className="flex items-center gap-1">
                                                            <ArrowUpRight className="w-4 h-4 text-red-500" />
                                                            <span>
                                                                Over Limit
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-1">
                                                            <ArrowDownRight className="w-4 h-4 text-red-500" />
                                                            <span>
                                                                Under Limit
                                                            </span>
                                                        </div>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell
                                                colSpan={8}
                                                className="text-center font-medium"
                                            >
                                                {loading
                                                    ? "Loading..."
                                                    : "No alerts found."}
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        )}
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between">
                        <div className="text-muted-foreground text-sm">
                            {currentPagination.total} record(s) found
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() => goToPage(1)}
                                disabled={
                                    loading || currentPagination.page === 1
                                }
                            >
                                <IconChevronsLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() =>
                                    goToPage(currentPagination.page - 1)
                                }
                                disabled={
                                    loading || currentPagination.page === 1
                                }
                            >
                                <IconChevronLeft className="h-4 w-4" />
                            </Button>
                            <div className="px-2 text-sm font-medium">
                                Page {currentPagination.page} of{" "}
                                {currentPagination.pages}
                            </div>
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() =>
                                    goToPage(currentPagination.page + 1)
                                }
                                disabled={
                                    loading ||
                                    currentPagination.page ===
                                        currentPagination.pages
                                }
                            >
                                <IconChevronRight className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                className="h-8 w-8"
                                onClick={() =>
                                    goToPage(currentPagination.pages)
                                }
                                disabled={
                                    loading ||
                                    currentPagination.page ===
                                        currentPagination.pages
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
