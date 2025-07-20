import { useEffect, useState } from "react"
import axios from "axios"
import { format, parseISO } from "date-fns"
import {
    IconChevronLeft,
    IconChevronRight,
    IconChevronsLeft,
    IconChevronsRight,
} from "@tabler/icons-react"
import { Button } from "@/components/ui/button"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Tabs, TabsContent } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover"
import { CalendarIcon, Search, Download } from "lucide-react"
import { DateRangePopover } from "./calendar"
import { type DateRange } from "react-day-picker"
import { DeviceSelector } from "./device-selector"

type SensorData = {
    id: number
    device_name: string
    location: string
    mac_address: string
    temperature: string
    humidity: string
    recorded_at: string
}


type PaginationInfo = {
    page: number
    limit: number
    total: number
    pages: number
}

export default function SensorDataTable() {
    const [data, setData] = useState<SensorData[]>([])
    const [pagination, setPagination] = useState<PaginationInfo>({
        page: 1,
        limit: 15,
        total: 0,
        pages: 1,
    })
    const [loading, setLoading] = useState(false)

    const fetchData = async () => {
        setLoading(true)
        try {
            const res = await axios.get("http://localhost:3000/api/sensor-data", {
                params: {
                    page: pagination.page,
                    limit: pagination.limit,
                },
            })

            setData(res.data.data)
            setPagination(res.data.pagination)
        } catch (err) {
            console.error("Fetch error:", err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [pagination.page, pagination.limit])

    const goToPage = (page: number) => {
        if (page >= 1 && page <= pagination.pages) {
            setPagination((prev) => ({ ...prev, page }))
        }
    }

    const formatDate = (dateStr: string) => {
        return format(parseISO(dateStr), "yyyy-MM-dd HH:mm:ss")
    }
    const [dateRange, setDateRange] = useState<DateRange | undefined>()
    const [selectedMac, setSelectedMac] = useState("")

    return (
        <Tabs defaultValue="outline" className="w-full flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2 lg:px-6 w-full">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex flex-col min-w-[150px]">
                        <Label htmlFor="device-selector" className="mb-2 text-sm font-medium">Select Device</Label>
                        <DeviceSelector value={selectedMac} onChange={setSelectedMac} />
                    </div>

                    <div className="flex flex-col min-w-[100px]">
                        <Label htmlFor="view-selector" className="mb-2 text-sm font-medium">Select Date Range</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-9 justify-start text-left font-normal"
                                    id="view-selector"
                                >
                                    {dateRange?.from ? (
                                        dateRange.to ? (
                                            `${format(dateRange.from, "PPP")} - ${format(dateRange.to, "PPP")}`
                                        ) : (
                                            format(dateRange.from, "PPP")
                                        )
                                    ) : (
                                        <span className="text-muted-foreground">Pick a date range</span>
                                    )}
                                    <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-2" align="start">
                                <DateRangePopover dateRange={dateRange} onDateChange={setDateRange} />
                            </PopoverContent>
                        </Popover>
                    </div>

                    <Button variant="outline" size="sm" className="h-9 mt-6">
                        <Search className="mr-2 h-4 w-4" /> Search
                    </Button>
                </div>

                <Button variant="outline" size="sm" className="h-9 w-fit mt-2 sm:mt-6">
                    <Download className="mr-2 h-4 w-4" /> Export
                </Button>
            </div>
            <TabsContent value="outline" className="relative flex flex-col gap-4 overflow-auto px-4 lg:px-6">
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
                                        <TableCell>{row.temperature}°C</TableCell>
                                        <TableCell>{row.humidity}%</TableCell>
                                        <TableCell>{formatDate(row.recorded_at)}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        {loading ? "Loading..." : "No data found."}
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
                            disabled={pagination.page === 1}
                        >
                            <IconChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => goToPage(pagination.page - 1)}
                            disabled={pagination.page === 1}
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
                            disabled={pagination.page === pagination.pages}
                        >
                            <IconChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8"
                            onClick={() => goToPage(pagination.pages)}
                            disabled={pagination.page === pagination.pages}
                        >
                            <IconChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </TabsContent>
        </Tabs >
    )
}
