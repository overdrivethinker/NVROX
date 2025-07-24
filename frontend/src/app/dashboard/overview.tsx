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
import SensorCardGrid from "@/components/cards";
import { useEffect, useState } from "react";
import axios from "axios";

type Device = {
    mac_address: string;
    device_name: string;
    location: string;
};

type Limits = {
    mac_address: string;
    tempMin: number;
    tempMax: number;
    humidMin: number;
    humidMax: number;
};

export default function Overview() {
    const [deviceListFromDB, setDeviceListFromDB] = useState<Device[]>([]);
    const [limitsMap, setLimitsMap] = useState<Record<string, Limits>>({});

    useEffect(() => {
        axios
            .get(import.meta.env.VITE_API_BASE_URL + "/devices/list")
            .then((res) => setDeviceListFromDB(res.data))
            .catch((err) => console.error("Failed to fetch devices", err));

        axios
            .get(import.meta.env.VITE_API_BASE_URL + "/devices/threshold/all")
            .then((res) => {
                const map: Record<string, Limits> = {};
                res.data.forEach((item: Limits) => {
                    map[item.mac_address] = item;
                });
                setLimitsMap(map);
            })
            .catch((err) => console.error("Failed to fetch limits", err));
    }, []);

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
                                    Dashboard
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>Overview</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <ModeToggle />
                </header>
                <div className="flex flex-1 justify-center flex-col">
                    <SensorCardGrid
                        devices={deviceListFromDB}
                        limitsMap={limitsMap}
                    />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
