"use client";

import * as React from "react";
import { useLocation, Link } from "react-router-dom";

import { IconBackground } from "@tabler/icons-react";
import { Radio, Gauge, Settings2 } from "lucide-react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
    SidebarMenu,
    SidebarMenuItem,
    SidebarMenuButton,
} from "@/components/ui/sidebar";

const navData = [
    {
        title: "Dashboard",
        url: "#",
        icon: Gauge,
        items: [
            { title: "Overview", url: "/overview" },
            { title: "Alerts", url: "/alerts" },
        ],
    },
    {
        title: "Environment",
        url: "#",
        icon: Radio,
        items: [
            { title: "Live Monitoring", url: "/live-monitoring" },
            { title: "Recent Condition", url: "/recent-condition" },
            { title: "Historical Logs", url: "/historical-logs" },
        ],
    },
    {
        title: "Configuration",
        url: "#",
        icon: Settings2,
        items: [
            { title: "Device Setup", url: "/device-setup" },
            { title: "User Access", url: "/user-access" },
        ],
    },
];

const userData = {
    name: "Gilang Fauzi",
    email: "gilangfauzi@example.com",
    avatar: "",
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const location = useLocation();
    const navWithActive = navData.map((section) => {
        const items = section.items.map((item) => ({
            ...item,
            isActive: location.pathname === item.url,
        }));

        const isActive = items.some((item) => item.isActive);

        return {
            ...section,
            isActive,
            items,
        };
    });

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton
                            asChild
                            className="data-[slot=sidebar-menu-button]:!p-1.5">
                            <Link to={"/overview"}>
                                <IconBackground className="!size-5" />
                                <span className="text-base font-bold">
                                    NVROX
                                </span>
                                <span className="text-xs text-muted-foreground">
                                    /ˈɛn.vaɪ.rɒks/
                                </span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={navWithActive} />
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={userData} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    );
}
