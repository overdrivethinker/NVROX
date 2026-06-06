"use client";

import { ChevronsUpDown, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

import {
    Avatar,
    AvatarFallback,
    AvatarBadge,
    AvatarImage,
} from "@/components/ui/avatar";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from "@/components/ui/sidebar";
import { AboutMenuItem } from "@/components/about-dropdown";
import { createAvatar } from "@dicebear/core";
import * as funEmoji from "@dicebear/fun-emoji";

function stringToColor(str: string) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 30%, 40%)`;
    return color;
}

export function NavUser() {
    const { isMobile } = useSidebar();
    const navigate = useNavigate();

    const storedUser = sessionStorage.getItem("user");
    const user = storedUser ? JSON.parse(storedUser) : null;

    const handleLogout = () => {
        sessionStorage.removeItem("user");
        sessionStorage.removeItem("isLoggedIn");
        navigate("/login", { replace: true });
    };

    if (!user) return null;

    return (
        <SidebarMenu>
            <SidebarMenuItem>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                            size="lg"
                            className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                        >
                            <Avatar className="h-8 w-8 rounded-md">
                                <AvatarImage
                                    src={createAvatar(funEmoji, {
                                        seed: (
                                            user.username || "default"
                                        ).toLowerCase(),
                                        size: 64,
                                    }).toDataUri()}
                                    alt={user.username ?? "avatar"}
                                />
                                <AvatarFallback
                                    className="rounded-lg flex items-center justify-center text-white font-semibold"
                                    style={{
                                        backgroundColor: stringToColor(
                                            user.username || "default",
                                        ),
                                    }}
                                >
                                    {user.username
                                        ?.split(" ")
                                        .filter(Boolean)
                                        .map((word: string) =>
                                            word[0].toUpperCase(),
                                        )
                                        .join("")
                                        .slice(0, 2) || "U"}
                                </AvatarFallback>
                                <AvatarBadge className="bg-green-600 dark:bg-green-600" />
                            </Avatar>
                            <div className="grid flex-1 text-left text-sm leading-tight">
                                <span className="truncate font-medium">
                                    {user.username}
                                </span>
                                <span className="truncate text-xs text-muted-foreground">
                                    {user.role}
                                </span>
                            </div>
                            <ChevronsUpDown className="ml-auto size-4" />
                        </SidebarMenuButton>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
                        side={isMobile ? "bottom" : "right"}
                        align="end"
                        sideOffset={4}
                    >
                        <DropdownMenuLabel className="p-0 font-normal">
                            <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                                <Avatar className="h-8 w-8 rounded-md">
                                    <AvatarImage
                                        src={createAvatar(funEmoji, {
                                            seed: (
                                                user.username || "default"
                                            ).toLowerCase(),
                                            size: 64,
                                        }).toDataUri()}
                                        alt={user.username ?? "avatar"}
                                    />
                                </Avatar>
                                <div className="grid flex-1 text-left text-sm leading-tight">
                                    <span className="truncate font-medium">
                                        {user.username}
                                    </span>
                                    <span className="truncate text-xs text-muted-foreground">
                                        {user.email}
                                    </span>
                                </div>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <AboutMenuItem />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Log out
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </SidebarMenuItem>
        </SidebarMenu>
    );
}
