import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";
import { ReactNode, useState } from "react";

interface HelpFabProps {
    title: string;
    description?: string;
    children: ReactNode;
    tooltip?: string;
}

export function HelpFab({ title, description, children, tooltip = "دليل الاستخدام" }: HelpFabProps) {
    const [open, setOpen] = useState(false);

    return (
        <TooltipProvider>
            <Dialog open={open} onOpenChange={setOpen}>
                <Tooltip>
                    <TooltipTrigger asChild>
                        <DialogTrigger asChild>
                            <Button
                                variant="default"
                                size="icon"
                                className="fixed bottom-6 left-6 h-14 w-14 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105 z-40"
                                aria-label={tooltip}
                            >
                                <Info className="h-6 w-6 text-white" />
                            </Button>
                        </DialogTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="text-sm">
                        <p>{tooltip}</p>
                    </TooltipContent>
                </Tooltip>

                <DialogContent className="sm:max-w-2xl" dir="rtl">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                            <span className="text-3xl">📘</span> {title}
                        </DialogTitle>
                        {description && (
                            <DialogDescription className="text-base">
                                {description}
                            </DialogDescription>
                        )}
                    </DialogHeader>

                    <div className="py-4">
                        {children}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            إغلاق
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </TooltipProvider>
    );
}
