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
import DeviceDataTable from "@/components/device-table";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AddDeviceDialog } from "./dialog/add-device-dialog";

export default function DeviceSetup() {
    const [addDialogOpen, setAddDialogOpen] = useState(false);
    const [newDevice, setNewDevice] = useState({
        mac: "",
        name: "",
        location: "",
        status: "Active", // default
    });

    const handleAddSubmit = async () => {
        console.log("Adding device:", newDevice);
        // TODO: Panggil API di sini untuk simpan data
        setAddDialogOpen(false);
        // Clear form jika mau:
        setNewDevice({ mac: "", name: "", location: "", status: "Active" });
    };

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
                                    Configuration
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>
                                        Device Setup
                                    </BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </div>
                    <ModeToggle />
                </header>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between px-2 lg:px-6 w-full">
                    <div className="flex flex-wrap gap-4 items-end">
                        <div className="flex flex-col min-w-[200px]">
                            <Label
                                htmlFor="device-selector"
                                className="mb-2 text-sm font-medium">
                                Search Device
                            </Label>
                            <Input
                                id="device-selector"
                                type="text"
                                placeholder="Enter device name or MAC"
                                className="text-sm"
                            />
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
                        className="h-9 w-fit mt-2 sm:mt-6"
                        onClick={() => setAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Device
                    </Button>
                </div>
                <AddDeviceDialog
                    open={addDialogOpen}
                    onOpenChange={setAddDialogOpen}
                    device={newDevice}
                    setDevice={setNewDevice}
                    onSubmit={handleAddSubmit}
                />
                <div className="flex flex-1 flex-col gap-4 pt-0 mt-3">
                    <DeviceDataTable />
                </div>
            </SidebarInset>
        </SidebarProvider>
    );
}
