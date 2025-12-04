import { useState, useEffect, useRef, startTransition } from "react";
import { User, Mail, Phone, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useAddStudent,
  useUpdateStudent,
  useGetStudent,
} from "@/hooks/use-students";
import { useGetClasses } from "@/hooks/use-classes";
import { getFieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AddStudentRequest } from "@/types/students";

interface StudentFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultClassId?: string;
  studentId?: string;
  onSuccess?: () => void;
}

export function StudentFormDialog({
  open,
  onOpenChange,
  defaultClassId,
  studentId,
  onSuccess,
}: StudentFormDialogProps) {
  const isEditMode = !!studentId;
  const [selectedClassId, setSelectedClassId] = useState<string>(
    defaultClassId || ""
  );
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    mobileNumber: string;
  }>({
    fullName: "",
    email: "",
    mobileNumber: "",
  });
  const hasInitializedClass = useRef(false);
  const hasInitializedForm = useRef(false);

  const { data: classesData, isLoading: isLoadingClasses } = useGetClasses();
  const addMutation = useAddStudent();
  const updateMutation = useUpdateStudent();
  const { data: studentData, isLoading: isLoadingStudent } = useGetStudent({
    studentId: studentId || "",
    classId: selectedClassId || defaultClassId || "",
  });

  // Set default class when classes load or dialog opens
  useEffect(() => {
    if (
      classesData &&
      classesData.length > 0 &&
      open &&
      !hasInitializedClass.current
    ) {
      hasInitializedClass.current = true;
      startTransition(() => {
        if (isEditMode && studentData?.className) {
          // Find classId from className when editing
          const foundClass = classesData.find(
            (c) => c.name === studentData.className
          );
          if (foundClass) {
            setSelectedClassId(foundClass.id);
          } else if (
            defaultClassId &&
            classesData.some((c) => c.id === defaultClassId)
          ) {
            setSelectedClassId(defaultClassId);
          } else {
            setSelectedClassId(classesData[0].id);
          }
        } else if (
          defaultClassId &&
          classesData.some((c) => c.id === defaultClassId)
        ) {
          setSelectedClassId(defaultClassId);
        } else {
          setSelectedClassId(classesData[0].id);
        }
      });
    }
    if (!open) {
      hasInitializedClass.current = false;
    }
  }, [classesData, defaultClassId, open, isEditMode, studentData]);

  useEffect(() => {
    if (open && !hasInitializedForm.current) {
      startTransition(() => {
        if (isEditMode && studentData) {
          hasInitializedForm.current = true;
          setFormData({
            fullName: studentData.fullName,
            email: studentData.email || "",
            mobileNumber: studentData.mobileNumber || "",
          });
        } else if (!isEditMode) {
          hasInitializedForm.current = true;
          setFormData({
            fullName: "",
            email: "",
            mobileNumber: "",
          });
        }
      });
    }
    if (!open) {
      hasInitializedForm.current = false;
    }
  }, [isEditMode, studentData, open]);

  const error = isEditMode ? updateMutation.error : addMutation.error;
  const isPending = isEditMode
    ? updateMutation.isPending
    : addMutation.isPending;

  // Get field-specific errors
  const fullNameErrors = getFieldErrors(error, "fullName");
  const emailErrors = getFieldErrors(error, "email");
  const mobileNumberErrors = getFieldErrors(error, "mobileNumber");
  const classIdErrors = getFieldErrors(error, "classId");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedClassId) {
      return; // Don't submit if no class selected
    }

    // Prepare data with null values for empty optional fields
    const submitData: AddStudentRequest = {
      fullName: formData.fullName,
      email: formData.email && formData.email.trim() !== "" ? formData.email.trim() : null,
      mobileNumber: formData.mobileNumber && formData.mobileNumber.trim() !== "" ? formData.mobileNumber.trim() : null,
    };

    if (isEditMode && studentId) {
      await updateMutation.mutateAsync(
        { studentId, classId: selectedClassId, data: submitData },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
          },
        }
      );
    } else {
      await addMutation.mutateAsync(
        { data: submitData, classId: selectedClassId },
        {
          onSuccess: () => {
            onSuccess?.();
            onOpenChange(false);
          },
        }
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "تعديل بيانات الطالب" : "إضافة طالب جديد"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "قم بتعديل بيانات الطالب أدناه"
              : "أدخل بيانات الطالب الجديد أدناه"}
          </DialogDescription>
        </DialogHeader>

        {isEditMode && isLoadingStudent ? (
          <div className="py-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <p className="mt-2 text-sm text-muted-foreground">
              جاري تحميل بيانات الطالب...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Class Selection Field */}
            <div className="space-y-2">
              <Label htmlFor="class">الفصل</Label>
              <Select
                value={selectedClassId}
                onValueChange={setSelectedClassId}
                disabled={isPending || isLoadingClasses}
              >
                <SelectTrigger id="class" className="w-full">
                  <SelectValue placeholder="اختر الفصل" />
                </SelectTrigger>
                <SelectContent>
                  {isLoadingClasses ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      جاري التحميل...
                    </div>
                  ) : classesData && classesData.length > 0 ? (
                    classesData.map((classItem) => (
                      <SelectItem key={classItem.id} value={classItem.id}>
                        {classItem.name} ({classItem.numberOfStudents} طالب)
                      </SelectItem>
                    ))
                  ) : (
                    <div className="p-2 text-sm text-muted-foreground">
                      لا توجد فصول متاحة
                    </div>
                  )}
                </SelectContent>
              </Select>
              {classIdErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    {classIdErrors.map((err, idx) => (
                      <span key={idx}>{err}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Full Name Field */}
            <div className="space-y-2">
              <Label htmlFor="fullName">الاسم الكامل</Label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="fullName"
                  type="text"
                  placeholder="أدخل الاسم الكامل"
                  value={formData.fullName}
                  onChange={(e) =>
                    setFormData({ ...formData, fullName: e.target.value })
                  }
                  className={cn(
                    "pr-10",
                    fullNameErrors.length > 0 && "border-destructive"
                  )}
                  required
                  disabled={isPending}
                />
              </div>
              {fullNameErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    {fullNameErrors.map((err, idx) => (
                      <span key={idx}>{err}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email">البريد الإلكتروني (اختياري)</Label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="example@email.com"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value || null })
                  }
                  className={cn(
                    "pr-10",
                    emailErrors.length > 0 && "border-destructive"
                  )}
                  dir="ltr"
                  disabled={isPending}
                />
              </div>
              {emailErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    {emailErrors.map((err, idx) => (
                      <span key={idx}>{err}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Number Field */}
            <div className="space-y-2">
              <Label htmlFor="mobileNumber">رقم الهاتف (اختياري)</Label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="mobileNumber"
                  type="tel"
                  placeholder="966532410939"
                  value={formData.mobileNumber || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, mobileNumber: e.target.value || null })
                  }
                  className={cn(
                    "pr-10",
                    mobileNumberErrors.length > 0 && "border-destructive"
                  )}
                  dir="ltr"
                  disabled={isPending}
                />
              </div>
              {mobileNumberErrors.length > 0 && (
                <div className="flex items-start gap-2 text-sm text-destructive">
                  <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  <div className="flex flex-col gap-1">
                    {mobileNumberErrors.map((err, idx) => (
                      <span key={idx}>{err}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isPending || !selectedClassId}>
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    {isEditMode ? "جاري التحديث..." : "جاري الإضافة..."}
                  </>
                ) : isEditMode ? (
                  "تحديث"
                ) : (
                  "إضافة"
                )}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
