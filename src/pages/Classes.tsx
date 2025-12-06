import { useState, useEffect } from "react";
import {
  GraduationCap,
  Plus,
  Edit,
  Trash2,
  Users,
  Search,
  LayoutGrid,
  Table as TableIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { useGetClasses, useDeleteClass } from "@/hooks/use-classes";
import { ClassFormDialog } from "@/components/classes/ClassFormDialog";
import { DeleteClassDialog } from "@/components/classes/DeleteClassDialog";
import { Skeleton } from "@/components/ui/skeleton";

export default function Classes() {
  const [searchValue, setSearchValue] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingClassId, setEditingClassId] = useState<string | null>(null);
  const [deletingClassId, setDeletingClassId] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchValue);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const { data: classesData, isLoading, error } = useGetClasses();
  const deleteMutation = useDeleteClass();

  const filteredClasses =
    classesData?.filter((classItem) =>
      classItem.name.toLowerCase().includes(debouncedSearch.toLowerCase())
    ) || [];

  const handleEdit = (classId: string) => {
    setEditingClassId(classId);
  };

  const handleDelete = (classId: string) => {
    setDeletingClassId(classId);
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
  };

  const handleEditSuccess = () => {
    setEditingClassId(null);
  };

  const handleDeleteSuccess = () => {
    setDeletingClassId(null);
  };

  const totalClasses = classesData?.length || 0;
  const totalStudents =
    classesData?.reduce((sum, c) => sum + c.numberOfStudents, 0) || 0;

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">الفصول</h1>
            <p className="text-muted-foreground mt-2">
              إدارة الفصول الدراسية في النظام
            </p>
          </div>
          <Button onClick={() => setIsAddDialogOpen(true)}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة فصل جديد
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الفصول
              </CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalClasses}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    فصل دراسي
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                إجمالي الطلاب
              </CardTitle>
              <Users className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">{totalStudents}</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    طالب في جميع الفصول
                  </p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                متوسط الطلاب لكل فصل
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <>
                  <div className="text-2xl font-bold">
                    {totalClasses > 0
                      ? Math.round(totalStudents / totalClasses)
                      : 0}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    طالب لكل فصل
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>قائمة الفصول</CardTitle>
                <CardDescription>
                  عرض وإدارة جميع الفصول الدراسية
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "table" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("table")}
                >
                  <TableIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="ابحث عن فصل بالاسم..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="pr-10"
                />
              </div>
            </div>

            {isLoading ? (
              viewMode === "grid" ? (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-32" />
                        <Skeleton className="h-4 w-24 mt-2" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-8 w-16" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              )
            ) : error ? (
              <div className="py-12 text-center">
                <p className="text-sm text-destructive">
                  حدث خطأ أثناء تحميل الفصول. يرجى المحاولة مرة أخرى.
                </p>
              </div>
            ) : (
              <>
                {viewMode === "grid" ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredClasses.map((classItem) => (
                      <Card
                        key={classItem.id}
                        className="transition-all hover:shadow-md"
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <CardTitle className="text-lg">
                                {classItem.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {classItem.numberOfStudents} طالب
                              </CardDescription>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEdit(classItem.id)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(classItem.id)}
                                disabled={deleteMutation.isPending}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Users className="h-4 w-4" />
                            <span>
                              معرف الفصل: {String(classItem.id).slice(0, 8)}...
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b">
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                            اسم الفصل
                          </th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                            عدد الطلاب
                          </th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                            معرف الفصل
                          </th>
                          <th className="text-right p-4 text-sm font-medium text-muted-foreground">
                            الإجراءات
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredClasses.map((classItem) => (
                          <tr
                            key={classItem.id}
                            className="border-b transition-colors hover:bg-accent/50"
                          >
                            <td className="p-4">
                              <div className="font-medium">
                                {classItem.name}
                              </div>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-muted-foreground" />
                                <span>{classItem.numberOfStudents} طالب</span>
                              </div>
                            </td>
                            <td className="p-4">
                              <code className="text-xs text-muted-foreground">
                                {String(classItem.id).slice(0, 8)}...
                              </code>
                            </td>
                            <td className="p-4">
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleEdit(classItem.id)}
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => handleDelete(classItem.id)}
                                  disabled={deleteMutation.isPending}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredClasses.length === 0 && (
                  <div className="py-12 text-center">
                    <GraduationCap className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">
                      {debouncedSearch
                        ? "لم يتم العثور على فصول بهذا البحث"
                        : "لا توجد فصول مسجلة"}
                    </p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ClassFormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onSuccess={handleAddSuccess}
      />

      {editingClassId && (
        <ClassFormDialog
          open={!!editingClassId}
          onOpenChange={(open) => !open && setEditingClassId(null)}
          classId={editingClassId}
          onSuccess={handleEditSuccess}
        />
      )}

      {deletingClassId && (
        <DeleteClassDialog
          open={!!deletingClassId}
          onOpenChange={(open) => !open && setDeletingClassId(null)}
          classId={deletingClassId}
          onSuccess={handleDeleteSuccess}
        />
      )}
    </MainLayout>
  );
}
