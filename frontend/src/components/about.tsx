"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { IconInfoCircle, IconBackground } from "@tabler/icons-react";

export function AboutDialog() {
    const [open, setOpen] = useState(false);

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <DropdownMenuItem
                    onSelect={(e) => e.preventDefault()}
                    onClick={() => setOpen(true)}
                    className="cursor-pointer"
                >
                    <IconInfoCircle className="mr-2 h-4 w-4" />
                    About
                </DropdownMenuItem>
            </DialogTrigger>
            <DialogContent className="max-w-lg p-6 rounded-lg shadow-lg">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
                        <IconBackground className="!size-5 text-primary" />
                        <span className="text-base font-bold">NVROX</span>
                        <span className="text-xs text-muted-foreground">/ˈɛn.vaɪ.rɒks/</span>
                    </DialogTitle>
                    <DialogDescription className="text-base text-muted-foreground mt-4">
                        <div className="space-y-4">
                            <p>
                                <strong>Version:</strong> 1.0.0
                            </p>
                            <p>
                                NVROX is a state of the art platform designed to deliver real-time insights and management for temperature and humidity IoT devices. Leveraging modern web technologies, it ensures a seamless and intuitive experience for monitoring and controlling environmental conditions in connected systems.
                            </p>
                            <p>
                                <strong>Developed by:</strong> Gilang Fauzi
                            </p>
                            <p>
                                <strong>Contact:</strong>{" "}
                                <a
                                    href="mailto:support@nvrox.com"
                                    className="text-primary hover:underline"
                                >
                                    support@nvrox.com
                                </a>
                            </p>
                            <p className="text-sm text-muted-foreground">
                                © {new Date().getFullYear()} NVROX. All rights reserved.
                            </p>
                        </div>
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
    );
}