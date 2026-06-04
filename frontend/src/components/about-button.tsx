import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { AboutDialog } from "@/components/about";

export function AboutButton() {
    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                    <Info className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <AboutDialog />
        </Dialog>
    );
}
