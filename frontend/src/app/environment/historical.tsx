import { useState } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import SensorDataTable from "@/components/sensor-table";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverTrigger,
    PopoverContent,
} from "@/components/ui/popover";
import { CalendarIcon, Search, Download } from "lucide-react";
import { DateRangePopover } from "@/components/calendar";
import { type DateRange } from "react-day-picker";
import { DeviceSelector } from "@/components/device-selector";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export default function Historical() {
    const [dateRange, setDateRange] = useState<DateRange | undefined>();
    const [selectedMac, setSelectedMac] = useState("");
    return (
        <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
                <header className="flex h-16 shrink-0 items-center justify-between px-4 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                    <div className="flex items-center gap-2">
                        <SidebarTrigger />
                        <Separator
                            orientation="vertical"
                            className="mr-2 data-[orientation=vertical]:h-4"
                        />
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    Environment
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Historical Logs
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <ModeToggle />
                </header>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2 lg:px-6 w-full">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col min-w-[150px]">
                            <Label
                                htmlFor="device-selector"
                                className="mb-2 text-sm font-medium">
                                Select Device
                            </Label>
                            <DeviceSelector
                                value={selectedMac}
                                onChange={setSelectedMac}
                            />
                        </div>

                        <div className="flex flex-col min-w-[100px]">
                            <Label
                                htmlFor="view-selector"
                                className="mb-2 text-sm font-medium">
                                Select Date Range
                            </Label>
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
                                                `${format(dateRange.from, "yyyy/MM/dd")} to ${format(dateRange.to, "yyyy/MM/dd")}`
                                            ) : (
                                                format(dateRange.from, "P")
                                            )
                                        ) : (
                                            <span className="text-muted-foreground">Pick a date range</span>
                                        )}
                                        <CalendarIcon className="ml-2 h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-2" align="start">
                                    <DateRangePopover
                                        dateRange={dateRange}
                                        onDateChange={setDateRange}
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setDateRange(undefined)}
                                            className="text-sm text-muted-foreground hover:text-foreground"
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </PopoverContent>
                            </Popover>

                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 mt-6">
                            <Search className="mr-2 h-4 w-4" /> Search
                        </Button>
                    </div>

                    <Button
                        variant="outline"
                        size="sm"
                        className="h-9 w-fit mt-2 sm:mt-6">
                        <Download className="mr-2 h-4 w-4" /> Export
                    </Button>
                </div>
                <div className="flex flex-1 flex-col gap-4 pt-0 mt-3">
                    <SensorDataTable />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
