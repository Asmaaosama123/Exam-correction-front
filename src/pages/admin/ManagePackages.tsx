import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import type { SubscriptionPlan } from "@/lib/adminApi";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Plus, Edit2, Trash2, Package } from "lucide-react";
import { toast } from "sonner";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export default function ManagePackages() {
    const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        price: 0,
        maxAllowedPages: 0,
        durationValue: 1,
        durationUnit: "Month",
        isActive: true,
    });

    useEffect(() => {
        fetchPlans();
    }, []);

    const fetchPlans = async () => {
        try {
            const data = await adminApi.getPlans();
            setPlans(data);
        } catch (error) {
            toast.error("فشل في جلب الباقات");
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = (plan?: SubscriptionPlan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                description: plan.description || "",
                price: plan.price,
                maxAllowedPages: plan.maxAllowedPages,
                durationValue: plan.durationValue,
                durationUnit: plan.durationUnit,
                isActive: plan.isActive,
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                description: "",
                price: 0,
                maxAllowedPages: 0,
                durationValue: 1,
                durationUnit: "Month",
                isActive: true,
            });
        }
        setDialogOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (editingPlan) {
                await adminApi.updatePlan(editingPlan.id, formData);
                toast.success("تم تحديث الباقة بنجاح");
            } else {
                await adminApi.createPlan(formData);
                toast.success("تم إنشاء الباقة بنجاح");
            }
            setDialogOpen(false);
            fetchPlans();
        } catch (error) {
            toast.error("فشل حفظ الباقة");
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm("هل أنت متأكد من حذف هذه الباقة؟")) return;
        try {
            await adminApi.deletePlan(id);
            toast.success("تم حذف الباقة");
            fetchPlans();
        } catch (error) {
            toast.error("فشل حذف الباقة");
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة باقات الاشتراك</h1>
                        <p className="text-muted-foreground">إنشاء وتحرير باقات الاشتراك المتاحة للمعلمين.</p>
                    </div>
                    <Button onClick={() => handleOpenDialog()}>
                        <Plus className="ml-2 h-4 w-4" /> إضافة باقة جديدة
                    </Button>
                </div>

                <div className="rounded-md border bg-card">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="text-right">اسم الباقة</TableHead>
                                <TableHead className="text-right">السعر</TableHead>
                                <TableHead className="text-center">الصفحات</TableHead>
                                <TableHead className="text-center">المدة</TableHead>
                                <TableHead className="text-center">الحالة</TableHead>
                                <TableHead className="text-center">الإجراءات</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">جاري التحميل...</TableCell>
                                </TableRow>
                            ) : plans.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8">لا توجد باقات حالياً</TableCell>
                                </TableRow>
                            ) : (
                                plans.map((plan) => (
                                    <TableRow key={plan.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-primary" />
                                                {plan.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{plan.price} ج.م</TableCell>
                                        <TableCell className="text-center">{plan.maxAllowedPages}</TableCell>
                                        <TableCell className="text-center">
                                            {plan.durationValue} {plan.durationUnit === "Month" ? "شهر" : plan.durationUnit === "Term" ? "ترم" : "سنة"}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <span className={`px-2 py-1 rounded-full text-xs ${plan.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                                                {plan.isActive ? "نشط" : "معطل"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex justify-center gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(plan)}>
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(plan.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
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
                        <DialogTitle>{editingPlan ? "تعديل باقة" : "إضافة باقة جديدة"}</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleSubmit} className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>اسم الباقة</Label>
                            <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                        </div>
                        <div className="space-y-2">
                            <Label>الوصف</Label>
                            <Textarea value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>السعر (ج.م)</Label>
                                <Input type="number" value={formData.price} onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>عدد الصفحات</Label>
                                <Input type="number" value={formData.maxAllowedPages} onChange={(e) => setFormData({ ...formData, maxAllowedPages: Number(e.target.value) })} required />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>قيمة المدة</Label>
                                <Input type="number" value={formData.durationValue} onChange={(e) => setFormData({ ...formData, durationValue: Number(e.target.value) })} required />
                            </div>
                            <div className="space-y-2">
                                <Label>وحدة المدة</Label>
                                <Select value={formData.durationUnit} onValueChange={(val) => setFormData({ ...formData, durationUnit: val })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Month">شهر</SelectItem>
                                        <SelectItem value="Term">ترم</SelectItem>
                                        <SelectItem value="Year">سنة</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
                            <Button type="submit">حفظ</Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>
        </AdminLayout>
    );
}
