import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import type { SubscriptionRequest } from "@/lib/adminApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, X, Clock, User, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SubscriptionRequests() {
    const [requests, setRequests] = useState<SubscriptionRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [processingRequest, setProcessingRequest] = useState<SubscriptionRequest | null>(null);
    const [processingStatus, setProcessingStatus] = useState<"Approved" | "Rejected">("Approved");
    const [adminNotes, setAdminNotes] = useState("");

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const data = await adminApi.getSubscriptionRequests();
            setRequests(data);
        } catch (error) {
            toast.error("فشل في جلب طلبات الاشتراك");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenProcessDialog = (request: SubscriptionRequest, status: "Approved" | "Rejected") => {
        setProcessingRequest(request);
        setProcessingStatus(status);
        setAdminNotes("");
        setDialogOpen(true);
    };

    const handleProcessRequest = async () => {
        if (!processingRequest) return;
        try {
            await adminApi.processSubscriptionRequest(processingRequest.id, {
                status: processingStatus,
                adminNotes: adminNotes,
            });
            toast.success(processingStatus === "Approved" ? "تمت الموافقة على الطلب" : "تم رفض الطلب");
            setDialogOpen(false);
            fetchRequests();
        } catch (error) {
            toast.error("فشل معالجة الطلب");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">طلبات الاشتراك</h1>
                    <p className="text-muted-foreground">مراجعة ومعالجة طلبات تفعيل الباقات من المعلمين.</p>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">المعلم</TableHead>
                                <TableHead className="text-right">الباقة المطلوبة</TableHead>
                                <TableHead className="text-center">تاريخ الطلب</TableHead>
                                <TableHead className="text-center">الحالة</TableHead>
                                <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">جاري التحميل...</TableCell>
                                </TableRow>
                            ) : requests.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">لا توجد طلبات اشتراك حالياً</TableCell>
                                </TableRow>
                            ) : (
                                requests.map((req) => (
                                    <TableRow key={req.id}>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="h-4 w-4 text-muted-foreground" />
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{req.userFullName}</span>
                                                    <span className="text-xs text-muted-foreground">{req.userId}</span>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium text-primary">{req.planName}</TableCell>
                                        <TableCell className="text-center text-sm">
                                            <div className="flex items-center justify-center gap-1">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                {new Date(req.requestedAt).toLocaleDateString('ar-EG')}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${
                                                req.status === "Pending" ? "bg-yellow-100 text-yellow-700" :
                                                req.status === "Approved" ? "bg-green-100 text-green-700" :
                                                "bg-red-100 text-red-700"
                                            }`}>
                                                {req.status === "Pending" ? "قيد الانتظار" : 
                                                 req.status === "Approved" ? "مقبول" : "مرفوض"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {req.status === "Pending" && (
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="outline" size="sm" className="text-green-600 hover:text-green-700" onClick={() => handleOpenProcessDialog(req, "Approved")}>
                                                        <Check className="ml-1 h-4 w-4" /> قبول
                                                    </Button>
                                                    <Button variant="outline" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleOpenProcessDialog(req, "Rejected")}>
                                                        <X className="ml-1 h-4 w-4" /> رفض
                                                    </Button>
                                                </div>
                                            )}
                                            {req.status !== "Pending" && (
                                                <span className="text-xs text-muted-foreground italic">
                                                    {req.processedAt ? new Date(req.processedAt).toLocaleDateString('ar-EG') : "-"}
                                                </span>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </div>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {processingStatus === "Approved" ? "الموافقة على الطلب" : "رفض الطلب"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border border-muted">
                            <AlertCircle className={`h-5 w-5 mt-0.5 ${processingStatus === "Approved" ? "text-primary" : "text-destructive"}`} />
                            <div className="flex flex-col gap-1">
                                <span className="font-semibold">{processingRequest?.userFullName}</span>
                                <span className="text-sm">طلب باقة: <span className="text-primary font-bold">{processingRequest?.planName}</span></span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>ملاحظات (اختياري)</Label>
                            <Textarea 
                                placeholder={processingStatus === "Approved" ? "سيتم تفعيل الباقة فوراً..." : "لماذا تم رفض الطلب؟"} 
                                value={adminNotes} 
                                onChange={(e) => setAdminNotes(e.target.value)} 
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                        <Button variant={processingStatus === "Approved" ? "default" : "destructive"} onClick={handleProcessRequest}>
                            {processingStatus === "Approved" ? "تفعيل الاشتراك" : "تأكيد الرفض"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
