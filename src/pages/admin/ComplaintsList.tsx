import * as React from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useComplaints } from "@/hooks/use-complaints";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Loader2, MessageSquare, AlertCircle, Calendar, User as UserIcon } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { useResolveComplaint } from "@/hooks/use-complaints";
import { toast } from "sonner";

export default function ComplaintsList() {
  const { data: complaints, isLoading, error } = useComplaints();
  const { mutate: resolve, isPending: resolving } = useResolveComplaint();
  const [replyMessage, setReplyMessage] = React.useState("");
  const [selectedComplaintId, setSelectedComplaintId] = React.useState<number | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleResolve = () => {
    if (!selectedComplaintId || !replyMessage.trim()) return;

    resolve(
      { id: selectedComplaintId, adminResponse: replyMessage.trim() },
      {
        onSuccess: () => {
          toast.success("تم إرسال الرد وحل الشكوى بنجاح");
          setOpen(false);
          setReplyMessage("");
          setSelectedComplaintId(null);
        },
        onError: () => {
          toast.error("حدث خطأ أثناء إرسال الرد");
        },
      }
    );
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (error) {
      return (
        <Alert variant="destructive" className="mx-auto max-w-2xl">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            حدث خطأ أثناء تحميل الشكاوى. يرجى المحاولة مرة أخرى لاحقاً.
          </AlertDescription>
        </Alert>
      );
    }

    if (!complaints || complaints.length === 0) {
      return (
        <div className="flex h-[400px] flex-col items-center justify-center rounded-xl border-2 border-dashed bg-slate-50/50">
          <div className="rounded-full bg-slate-100 p-4">
            <MessageSquare className="h-10 w-10 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900">لا توجد شكاوى حالياً</h3>
          <p className="mt-2 text-sm text-slate-500">سيتم عرض شكاوى وملاحظات المعلمين هنا عند إرسالها.</p>
        </div>
      );
    }

    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {complaints.map((complaint) => (
          <Card key={complaint.id} className="group relative flex flex-col overflow-hidden border-slate-200 transition-all hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5">
            <div className="absolute top-0 right-0 h-1.5 w-full bg-slate-100 group-hover:bg-primary/20 transition-colors" />
            
            <CardHeader className="p-5 pb-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="rounded-xl bg-slate-100 p-2.5 text-slate-600 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-slate-900 leading-none mb-1">
                      {complaint.teacherName || "معلم غير معروف"}
                    </h3>
                  </div>
                </div>
                <Badge variant="outline" className="bg-slate-50/50 text-[10px] font-medium border-slate-200 shrink-0">
                  #{complaint.id}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="flex-1 p-5 space-y-4">
              <div className="rounded-2xl bg-slate-50/80 p-4 border border-slate-100/50 group-hover:bg-white group-hover:border-slate-200 transition-all min-h-[120px]">
                <p className="text-sm leading-relaxed text-slate-700 whitespace-pre-wrap break-words">
                  {complaint.message}
                </p>
              </div>

              {complaint.isResolved && (
                <div className="rounded-2xl bg-green-50/50 p-4 border border-green-100 mt-2">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span className="text-[10px] font-bold text-green-700 uppercase tracking-wider">الرد على الشكوى:</span>
                  </div>
                  <p className="text-sm italic text-slate-600">
                    {complaint.adminResponse}
                  </p>
                </div>
              )}

              <Separator className="bg-slate-100/50" />

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2 text-slate-500">
                  <Calendar className="h-4 w-4" />
                  <span className="text-xs font-medium">
                    {format(new Date(complaint.createdAt), "d MMMM yyyy", { locale: ar })}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {!complaint.isResolved && (
                    <Dialog open={open && selectedComplaintId === complaint.id} onOpenChange={(val) => {
                       if (!val) {
                         setOpen(false);
                         setSelectedComplaintId(null);
                         setReplyMessage("");
                       } else {
                         setSelectedComplaintId(complaint.id);
                         setOpen(true);
                       }
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 text-[11px] font-bold border-primary/20 text-primary hover:bg-primary/5 transition-all">
                          رد وحل الشكوى
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                          <DialogTitle className="text-right">الرد على شكوى #{complaint.id}</DialogTitle>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                          <Textarea
                            placeholder="اكتب رد القائم بالحل هنا..."
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            className="min-h-[150px] text-right"
                          />
                        </div>
                        <DialogFooter>
                          <Button 
                            onClick={handleResolve} 
                            disabled={resolving || !replyMessage.trim()}
                            className="w-full"
                          >
                            {resolving && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                            إرسال الرد وإغلاق الشكوى
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                  <Badge className={complaint.isResolved 
                    ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-200" 
                    : "bg-primary/5 text-primary border-primary/10 hover:bg-primary/10"}>
                    {complaint.isResolved ? "تم الحل" : "قيد المراجعة"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <AdminLayout>
      <div className="container mx-auto space-y-8 p-6 lg:p-10 max-w-[1600px]">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-primary/10 p-3 text-primary">
              <MessageSquare className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 lg:text-4xl">
              إدارة الشكاوى والملاحظات
            </h1>
          </div>
          <p className="text-lg text-slate-500 font-medium">
            استعرض وتابع ملاحظات وشكاوى المعلمين لتحسين تجربة النظام.
          </p>
        </div>

        <Separator className="bg-slate-200/60" />

        {renderContent()}
      </div>
    </AdminLayout>
  );
}
