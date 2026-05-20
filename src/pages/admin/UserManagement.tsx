import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { authManager } from "@/lib/auth-manager";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { adminApi } from "@/lib/adminApi";
import type { UserDto } from "@/lib/adminApi";
import { cn } from "@/lib/utils";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlusCircle, Edit, Trash2, FileDown, ChevronLeft, ChevronRight, Search, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { UserDialog } from "@/components/admin/UserDialog";
import { TeacherDownloadModal } from "@/components/admin/TeacherDownloadModal";

export default function UserManagement() {
    const [users, setUsers] = useState<UserDto[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [downloadModalOpen, setDownloadModalOpen] = useState(false);
    const [selectedUser, setSelectedUser] = useState<UserDto | null>(null);

    const navigate = useNavigate();
    const queryClient = useQueryClient();

    // Search and Pagination state
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const data = await adminApi.getUsers();
            setUsers(data);
        } catch (error) {
            console.error("Failed to fetch users:", error);
            toast.error("فشل في جلب قائمة المستخدمين");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleAddClick = () => {
        setSelectedUser(null);
        setDialogOpen(true);
    };

    const handleEditClick = (user: UserDto) => {
        setSelectedUser(user);
        setDialogOpen(true);
    };

    const handleDownloadClick = (user: UserDto) => {
        setSelectedUser(user);
        setDownloadModalOpen(true);
    };

    const handleDeleteUser = async (user: UserDto) => {
        if (!confirm(`هل أنت متأكد من حذف المستخدم ${user.firstName} ${user.lastName}؟`)) return;

        try {
            await adminApi.deleteUser(user.id);
            toast.success("تم حذف المستخدم بنجاح");
            fetchUsers();
        } catch (error) {
            console.error("Failed to delete user:", error);
            toast.error("فشل في حذف المستخدم");
        }
    };

    const handleLoginAsUser = async (user: UserDto) => {
        try {
            const response = await adminApi.loginAsUser(user.id);
            authManager.setTokens(response.token, response.refreshToken);
            queryClient.invalidateQueries({ queryKey: ["auth"] });
            queryClient.clear();
            toast.success(`تم تسجيل الدخول كـ ${user.firstName} ${user.lastName}`);
            navigate("/");
        } catch (error: any) {
            console.error("Failed to login as user. Full Error Details:", {
                message: error?.message,
                status: error?.response?.status,
                data: error?.response?.data,
                url: error?.config?.url,
                fullError: error
            });
            toast.error("فشل تسجيل الدخول كالمستخدم");
        }
    };

    // Filter users based on search term
    const filteredUsers = users.filter((user) => {
        const searchLower = searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = (user.email || "").toLowerCase();
        const phone = (user.phoneNumber || "").toLowerCase();

        return (
            fullName.includes(searchLower) ||
            email.includes(searchLower) ||
            phone.includes(searchLower)
        );
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Reset to first page when search term changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <AdminLayout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">إدارة المستخدمين</h1>
                        <p className="text-muted-foreground mt-2">
                            إضافة، تعديل، وحذف مستخدمي النظام.
                        </p>
                    </div>
                    <Button onClick={handleAddClick} className="flex gap-2">
                        <PlusCircle className="h-4 w-4" />
                        إضافة مستخدم
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>قائمة المستخدمين</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-6">
                            <div className="relative">
                                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    placeholder="ابحث بالاسم، البريد الإلكتروني، أو رقم الهاتف..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pr-10"
                                />
                            </div>
                        </div>

                        {loading ? (
                            <div className="flex justify-center py-8">جاري التحميل...</div>
                        ) : (
                            <div className="space-y-4">
                                <div className="rounded-md border overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-right text-xs p-2">الاسم</TableHead>
                                                <TableHead className="text-right text-xs p-2">البريد الإلكتروني</TableHead>
                                                <TableHead className="text-right text-xs p-2">رقم الهاتف</TableHead>
                                                <TableHead className="text-center text-xs p-2">الحالة</TableHead>
                                                <TableHead className="text-center text-xs p-2">الاشتراك</TableHead>
                                                <TableHead className="text-center text-xs p-2">الصفحات (مستخدم/مسموح)</TableHead>
                                                <TableHead className="text-center text-xs p-2">الصفحات المجانية</TableHead>
                                                <TableHead className="text-center text-xs p-2">تاريخ الانتهاء</TableHead>
                                                <TableHead className="text-center text-xs p-2">إجمالي التصحيح</TableHead>
                                                <TableHead className="text-center text-xs p-2">الإجراءات</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredUsers.length === 0 ? (
                                                <TableRow>
                                                    <TableCell colSpan={6} className="text-center py-8">
                                                        {searchTerm ? "لا توجد نتائج تطابق بحثك" : "لا يوجد مستخدمين"}
                                                    </TableCell>
                                                </TableRow>
                                            ) : (
                                                paginatedUsers.map((user) => (
                                                    <TableRow key={user.id}>
                                                        <TableCell className="font-medium text-xs p-2">
                                                            {user.firstName} {user.lastName}
                                                        </TableCell>
                                                        <TableCell className="text-xs p-2">{user.email}</TableCell>
                                                        <TableCell dir="ltr" className="text-right text-xs p-2">{user.phoneNumber}</TableCell>
                                                        <TableCell className="text-center p-2">
                                                            {user.isDisabled ? (
                                                                <span className="text-red-500 bg-red-100 px-2 py-0.5 rounded-full text-[10px]">معطل</span>
                                                            ) : (
                                                                <span className="text-green-500 bg-green-100 px-2 py-0.5 rounded-full text-[10px]">نشط</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            {user.isSubscribed ? (
                                                                <span className="text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[10px] border border-primary/20">مشترك</span>
                                                            ) : (
                                                                <span className="text-muted-foreground bg-muted px-2 py-0.5 rounded-full text-[10px]">لا يوجد</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <div className="flex flex-col gap-1 items-center">
                                                                <span className={cn(
                                                                    "font-bold px-2 py-1 rounded-lg text-xs",
                                                                    user.usedPages >= user.maxAllowedPages && user.maxAllowedPages > 0 ? "text-red-600 bg-red-100" : "text-primary bg-primary/10"
                                                                )}>
                                                                    {user.usedPages || 0} / {user.maxAllowedPages || 0}
                                                                </span>
                                                            </div>
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <span className="font-bold px-2 py-1 rounded-lg text-xs text-green-600 bg-green-50 border border-green-100">
                                                                {user.freePagesCount || 0}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center text-xs p-2">
                                                            {user.subscriptionExpiryUtc ? (
                                                                <span className={cn(
                                                                    new Date(user.subscriptionExpiryUtc) < new Date() ? "text-red-500" : ""
                                                                )}>
                                                                    {new Date(user.subscriptionExpiryUtc).toLocaleDateString('ar-EG')}
                                                                </span>
                                                            ) : (
                                                                <span className="text-muted-foreground">-</span>
                                                            )}
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <span className="font-bold text-base text-primary">
                                                                {user.totalCorrectedCount || 0}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="text-center p-2">
                                                            <div className="flex justify-center gap-1">
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    title="الدخول كالمستخدم"
                                                                    onClick={() => handleLoginAsUser(user)}
                                                                >
                                                                    <LogIn className="h-3.5 w-3.5 text-orange-500" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    title="تحميل الأوراق المصححة"
                                                                    onClick={() => handleDownloadClick(user)}
                                                                >
                                                                    <FileDown className="h-3.5 w-3.5 text-green-600" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => handleEditClick(user)}
                                                                >
                                                                    <Edit className="h-3.5 w-3.5 text-blue-500" />
                                                                </Button>
                                                                <Button
                                                                    variant="outline"
                                                                    size="icon"
                                                                    className="h-7 w-7"
                                                                    onClick={() => handleDeleteUser(user)}
                                                                >
                                                                    <Trash2 className="h-3.5 w-3.5 text-red-500" />
                                                                </Button>
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))
                                            )}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="flex flex-col items-center justify-between gap-4 sm:flex-row mt-4">
                                        <div className="text-sm text-muted-foreground">
                                            الصفحة {currentPage} من {totalPages} (
                                            {filteredUsers.length} مستخدم)
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage((p) => Math.max(1, p - 1))
                                                }
                                                disabled={currentPage === 1 || loading}
                                            >
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                                السابق
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                                                }
                                                disabled={
                                                    currentPage === totalPages || loading
                                                }
                                            >
                                                التالي
                                                <ChevronLeft className="h-4 w-4 mr-2" />
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            <UserDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSuccess={fetchUsers}
            />

            {selectedUser && (
                <TeacherDownloadModal
                    open={downloadModalOpen}
                    onOpenChange={setDownloadModalOpen}
                    teacherId={selectedUser.id}
                    teacherName={`${selectedUser.firstName} ${selectedUser.lastName}`}
                />
            )}
        </AdminLayout>
    );
}
