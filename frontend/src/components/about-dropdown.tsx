"use client";

import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Info } from "lucide-react";
import { AboutDialog } from "@/components/about";

export function AboutMenuItem() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                    <Info className="mr-2 h-4 w-4" />
                    About
                </DropdownMenuItem>
            </DialogTrigger>
            <AboutDialog />
        </Dialog>
    );
}
