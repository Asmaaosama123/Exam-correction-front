import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCreateComplaint, useMyComplaints } from "@/hooks/use-complaints";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  MessageSquare, 
  MessageSquarePlus, 
  Send, 
  Loader2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export function ComplaintFloatingButton() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const { mutate: submitComplaint, isPending } = useCreateComplaint();
  const { data: myComplaints, isLoading: loadingHistory } = useMyComplaints();
  const [activeTab, setActiveTab] = useState("new");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) {
      toast.error("يرجى كتابة الشكوى أو الملاحظة أولاً.");
      return;
    }

    submitComplaint(
      { message: message.trim() },
      {
        onSuccess: () => {
          toast.success("تم إرسال الشكوى/الملاحظة بنجاح، شكراً لتواصلك معنا.");
          setOpen(false);
          setMessage("");
        },
        onError: () => {
          toast.error("حدث خطأ أثناء الإرسال، يرجى المحاولة مرة أخرى.");
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <SidebarMenuButton
          tooltip="شكاوى وملاحظات"
          className="w-full cursor-pointer justify-start gap-3 text-slate-600 hover:text-primary transition-colors"
        >
          <div className="flex items-center gap-3">
            <MessageSquare className="h-5 w-5 ml-2" />
            <span className="group-data-[collapsible=icon]:hidden">
              شكاوى وملاحظات
            </span>
          </div>
        </SidebarMenuButton>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-[600px] gap-0 p-0 overflow-hidden border-none shadow-2xl rounded-xl">
        <DialogHeader className="p-4 sm:p-6 bg-primary text-primary-foreground min-h-[80px] sm:min-h-[100px] flex flex-col justify-center">
          <DialogTitle className="text-right flex items-center gap-3 text-2xl font-bold">
            <div className="bg-white/20 p-2 rounded-lg">
              <MessageSquarePlus className="h-6 w-6 text-white" />
            </div>
            الشكاوى والملاحظات
          </DialogTitle>
          <DialogDescription className="text-right text-primary-foreground/80 text-sm mt-1">
            نحن نستمع إليك لمساعدتنا على تحسين النظام باستمرار.
          </DialogDescription>
        </DialogHeader>
        <div className="bg-background">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" dir="rtl">
            <TabsList className="w-full rounded-none border-b h-12 bg-muted/30">
              <TabsTrigger value="new" className="flex-1 text-base data-[state=active]:bg-background">إرسال شكوى جديدة</TabsTrigger>
              <TabsTrigger value="history" className="flex-1 text-base data-[state=active]:bg-background">سجل الشكاوى</TabsTrigger>
            </TabsList>
            
            <TabsContent value="new" className="p-6 m-0">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-muted-foreground block px-1">رسالتك:</label>
                  <Textarea
                    placeholder="اكتب رسالتك أو مشكلتك هنا بوضوح وسنقوم بمراجعتها بأقرب وقت..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="h-[200px] sm:h-[250px] resize-none focus-visible:ring-primary border-muted-foreground/20 text-base sm:text-lg leading-relaxed p-4 whitespace-pre-wrap overflow-y-auto break-words"
                    disabled={isPending}
                  />
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setOpen(false)}
                    disabled={isPending}
                  >
                    إلغاء
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isPending || !message.trim()} 
                    className="gap-2 px-8"
                  >
                    {isPending ? (
                      <Loader2 className="h-5 w-5 animate-spin" />
                    ) : (
                      <Send className="h-5 w-5" />
                    )}
                    إرسال الآن
                  </Button>
                </div>
              </form>
            </TabsContent>

            <TabsContent value="history" className="p-0 m-0">
              <ScrollArea className="h-[400px] sm:h-[450px] p-6">
                <div className="space-y-6">
                  {loadingHistory ? (
                    <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" /></div>
                  ) : !myComplaints || myComplaints.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">لايوجد شكاوى سابقة</div>
                  ) : (
                    myComplaints.map((complaint) => (
                      <div key={complaint.id} className="border rounded-xl p-4 bg-muted/10 space-y-3 relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 h-full w-1 ${complaint.isResolved ? 'bg-green-500' : 'bg-primary/40'}`} />
                        <div className="flex justify-between items-start">
                          <span className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                            <MessageSquare className="h-3 w-3" />
                            #{complaint.id} • {format(new Date(complaint.createdAt), 'yyyy/MM/dd', { locale: ar })}
                          </span>
                          <Badge variant={complaint.isResolved ? "default" : "outline"} className={complaint.isResolved ? "bg-green-500 hover:bg-green-600 text-white" : ""}>
                            {complaint.isResolved ? "تم الحل" : "قيد المراجعة"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-700 leading-relaxed break-words">{complaint.message}</p>
                        
                        {complaint.isResolved && complaint.adminResponse && (
                          <>
                            <Separator className="bg-slate-100" />
                            <div className="bg-green-50/50 rounded-lg p-3 border border-green-100/50">
                              <p className="text-[11px] font-bold text-green-700 mb-1">رد الإدارة:</p>
                              <p className="text-sm text-slate-600 italic leading-relaxed">{complaint.adminResponse}</p>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

