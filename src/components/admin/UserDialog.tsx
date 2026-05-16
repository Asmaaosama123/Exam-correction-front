import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { adminApi } from "@/lib/adminApi";
import type { UserDto } from "@/lib/adminApi";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

interface UserDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    user: UserDto | null;
    onSuccess: () => void;
}

export function UserDialog({ open, onOpenChange, user, onSuccess }: UserDialogProps) {
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phoneNumber: "",
        password: "",
        isDisabled: false,
        maxAllowedPages: 0,
        subscriptionExpiryUtc: "",
        isSubscribed: false,
    });

    const isEditing = !!user;

    useEffect(() => {
        if (user && open) {
            setFormData({
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phoneNumber: user.phoneNumber,
                password: user.plainPassword || "",
                isDisabled: user.isDisabled,
                maxAllowedPages: user.maxAllowedPages || 0,
                subscriptionExpiryUtc: user.subscriptionExpiryUtc ? user.subscriptionExpiryUtc.split('T')[0] : "",
                isSubscribed: user.isSubscribed || false,
            });
        } else if (open) {
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phoneNumber: "",
                password: "",
                isDisabled: false,
                maxAllowedPages: 0,
                subscriptionExpiryUtc: "",
                isSubscribed: false,
            });
        }
    }, [user, open]);

    const addDuration = (months: number) => {
        const date = new Date();
        date.setMonth(date.getMonth() + months);
        setFormData({ ...formData, subscriptionExpiryUtc: date.toISOString().split('T')[0], isSubscribed: true });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckboxChange = (name: string, checked: boolean) => {
        setFormData({ ...formData, [name]: checked });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.email && !formData.phoneNumber) {
            toast.error("يجب إدخال البريد الإلكتروني أو رقم الهاتف");
            return;
        }

        setLoading(true);

        try {
            if (isEditing) {
                // Update user
                await adminApi.updateUser(user.id, {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phoneNumber: formData.phoneNumber,
                    email: formData.email,
                    password: formData.password,
                    isDisabled: formData.isDisabled,
                    maxAllowedPages: Number(formData.maxAllowedPages),
                    subscriptionExpiryUtc: formData.subscriptionExpiryUtc || null,
                    isSubscribed: formData.isSubscribed,
                });
                toast.success("تم تعديل المستخدم بنجاح");
            } else {
                // Add user
                await adminApi.createUser({
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    email: formData.email,
                    phoneNumber: formData.phoneNumber,
                    password: formData.password,
                    isDisabled: formData.isDisabled,
                    maxAllowedPages: Number(formData.maxAllowedPages),
                    subscriptionExpiryUtc: formData.subscriptionExpiryUtc || null,
                    isSubscribed: formData.isSubscribed,
                    usedPages: 0,
                });
                toast.success("تم إضافة المستخدم بنجاح");
            }
            onSuccess();
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to save user:", error);
            toast.error(isEditing ? "فشل في تعديل المستخدم" : "فشل في إضافة المستخدم");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{isEditing ? "تعديل مستخدم" : "إضافة مستخدم جديد"}</DialogTitle>
                    <DialogDescription>
                        {isEditing ? "تعديل بيانات المستخدم الحالي في النظام." : "أدخل بيانات المستخدم الجديد لإضافته للنظام."}
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="firstName">الاسم الأول</Label>
                            <Input
                                id="firstName"
                                name="firstName"
                                value={formData.firstName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="lastName">الاسم العائلة</Label>
                            <Input
                                id="lastName"
                                name="lastName"
                                value={formData.lastName}
                                onChange={handleChange}
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">البريد الإلكتروني</Label>
                        <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleChange}
                            className="text-right"
                            dir="ltr"
                            placeholder="example@email.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phoneNumber">رقم الهاتف</Label>
                        <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleChange}
                            className="text-right"
                            dir="ltr"
                            placeholder="XXXXXXXX"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">كلمة المرور</Label>
                        <div className="relative">
                            <Input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                value={formData.password}
                                onChange={handleChange}
                                required
                                className="text-right font-mono pr-10"
                                dir="ltr"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                            >
                                {showPassword ? (
                                    <EyeOff className="h-4 w-4" />
                                ) : (
                                    <Eye className="h-4 w-4" />
                                )}
                            </button>
                        </div>
                        <p className="text-[10px] text-muted-foreground">تغيير كلمة المرور هنا سيؤدي لتغييرها فوراً للمستخدم.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2 space-x-reverse pt-2">
                            <Checkbox
                                id="isSubscribed"
                                checked={formData.isSubscribed}
                                onCheckedChange={(checked) => handleCheckboxChange("isSubscribed", checked as boolean)}
                            />
                            <Label htmlFor="isSubscribed" className="cursor-pointer">
                                مشترك مفعل
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2 space-x-reverse pt-2">
                            <Checkbox
                                id="isDisabled"
                                checked={formData.isDisabled}
                                onCheckedChange={(checked) => handleCheckboxChange("isDisabled", checked as boolean)}
                            />
                            <Label htmlFor="isDisabled" className="cursor-pointer">
                                تعطيل الحساب
                            </Label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="maxAllowedPages">إجمالي الصفحات المسموحة</Label>
                            <Input
                                id="maxAllowedPages"
                                name="maxAllowedPages"
                                type="number"
                                value={formData.maxAllowedPages}
                                onChange={handleChange}
                                className="text-right"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="subscriptionExpiryUtc">تاريخ انتهاء الاشتراك</Label>
                            <Input
                                id="subscriptionExpiryUtc"
                                name="subscriptionExpiryUtc"
                                type="date"
                                value={formData.subscriptionExpiryUtc}
                                onChange={handleChange}
                                className="text-right"
                            />
                            <div className="flex flex-wrap gap-1 mt-1">
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-7 px-2"
                                    onClick={() => addDuration(1)}
                                >
                                    + شهر
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-7 px-2"
                                    onClick={() => addDuration(4)}
                                >
                                    + ترم
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="text-[10px] h-7 px-2"
                                    onClick={() => addDuration(12)}
                                >
                                    + سنة
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                        >
                            إلغاء
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? "جاري الحفظ..." : "حفظ"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
