"use client";

import { useState } from "react";
import { ChevronRight, type LucideIcon } from "lucide-react";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    SidebarGroup,
    SidebarGroupLabel,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarMenuSub,
    SidebarMenuSubButton,
    SidebarMenuSubItem,
} from "@/components/ui/sidebar";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";

export function NavMain({
    items,
}: {
    items: {
        title: string;
        url: string;
        icon?: LucideIcon;
        isActive?: boolean;
        items?: {
            title: string;
            url: string;
        }[];
    }[];
}) {
    const { pathname } = useLocation();

    const [openMenu, setOpenMenu] = useState<string | null>(() => {
        const activeItem = items.find((item) =>
            item.items?.some((sub) => sub.url === pathname),
        );
        return activeItem?.title ?? null;
    });

    const handleToggle = (title: string) => {
        setOpenMenu((prev) => (prev === title ? null : title));
    };

    return (
        <SidebarGroup>
            <SidebarGroupLabel>Menu</SidebarGroupLabel>
            <SidebarMenu>
                {items.map((item) => {
                    const isOpen = openMenu === item.title;
                    const hasActiveChild = item.items?.some(
                        (sub) => sub.url === pathname,
                    );

                    return (
                        <Collapsible
                            key={item.title}
                            asChild
                            open={isOpen}
                            onOpenChange={() => handleToggle(item.title)}
                            className="group/collapsible"
                        >
                            <SidebarMenuItem>
                                <CollapsibleTrigger asChild>
                                    <SidebarMenuButton
                                        tooltip={item.title}
                                        className={cn(
                                            hasActiveChild && "text-primary",
                                        )}
                                    >
                                        {item.icon && <item.icon />}
                                        <span>{item.title}</span>

                                        {hasActiveChild && !isOpen && (
                                            <span className="w-2 h-2 ml-2 rounded-full bg-primary shrink-0" />
                                        )}

                                        <ChevronRight
                                            className={cn(
                                                "ml-auto transition-transform duration-200",
                                                isOpen && "rotate-90",
                                            )}
                                        />
                                    </SidebarMenuButton>
                                </CollapsibleTrigger>

                                <CollapsibleContent>
                                    <SidebarMenuSub>
                                        {item.items?.map((subItem) => {
                                            const isActive =
                                                pathname === subItem.url;
                                            return (
                                                <SidebarMenuSubItem
                                                    key={subItem.title}
                                                >
                                                    <SidebarMenuSubButton
                                                        asChild
                                                        isActive={isActive}
                                                        className={cn(
                                                            isActive &&
                                                                "bg-primary/10 text-primary font-medium",
                                                        )}
                                                    >
                                                        <Link to={subItem.url}>
                                                            <span
                                                                className={cn(
                                                                    "w-0.5 h-3.5 rounded-full shrink-0",
                                                                    isActive
                                                                        ? "bg-primary"
                                                                        : "opacity-0",
                                                                )}
                                                            />
                                                            <span>
                                                                {subItem.title}
                                                            </span>
                                                        </Link>
                                                    </SidebarMenuSubButton>
                                                </SidebarMenuSubItem>
                                            );
                                        })}
                                    </SidebarMenuSub>
                                </CollapsibleContent>
                            </SidebarMenuItem>
                        </Collapsible>
                    );
                })}
            </SidebarMenu>
        </SidebarGroup>
    );
}
