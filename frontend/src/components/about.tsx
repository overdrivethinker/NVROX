"use client";

import {
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { IconBackground } from "@tabler/icons-react";

export function AboutDialog() {
    const subject = encodeURIComponent("NVROX Feedback");
    const body = encodeURIComponent(
        "Hello Gilang,\n\nI would like to share some feedback regarding the NVROX application.\n\nThank you.",
    );
    return (
        <DialogContent className="max-w-lg p-6 rounded-lg">
            <DialogHeader>
                <DialogTitle className="font-semibold flex items-center gap-2">
                    <IconBackground className="!size-6" />
                    <span className="text-md font-bold">NVROX</span>
                    <span className="text-xs text-muted-foreground">
                        /ˈɛn.vaɪ.rɒks/
                    </span>
                </DialogTitle>

                <DialogDescription className="text-sm text-muted-foreground mt-6 space-y-6">
                    <p>
                        NVROX is a state of the art platform designed to deliver
                        real-time insights and management for temperature and
                        humidity IoT devices. Leveraging modern web
                        technologies, it ensures a seamless and intuitive
                        experience for monitoring and controlling environmental
                        conditions in connected systems.
                    </p>

                    <div className="space-y-1">
                        <p>
                            <strong>Built with care by</strong> Gilang Fauzi
                        </p>
                        <p>
                            <strong>Reach out at</strong>{" "}
                            <a
                                href={`mailto:gilang.fauzi@smt.co.id?subject=${subject}&body=${body}`}
                                className="text-primary hover:underline"
                            >
                                gilang.fauzi@smt.co.id
                            </a>
                        </p>
                    </div>
                </DialogDescription>
            </DialogHeader>

            <footer className="mt-4 text-sm text-muted-foreground">
                © {new Date().getFullYear()} PT. SMT Indonesia | All rights
                reserved
                <p>
                    <strong>Version</strong> 1.0.0
                </p>
                <div className="pt-4 text-xs">
                    Avatar illustrations by Lisa Wischofsky, licensed under CC
                    BY 4.0
                </div>
            </footer>
        </DialogContent>
    );
}
