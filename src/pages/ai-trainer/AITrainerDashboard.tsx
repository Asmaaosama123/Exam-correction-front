import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { aiTrainerApi } from "@/lib/ai-trainer-api";
import type { DatasetFile } from "@/types/ai-trainer";
import { Card, CardFooter } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Download, CheckSquare, Square, Search, RefreshCw, Eye } from "lucide-react";
import { format } from "date-fns";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function AITrainerDashboard() {
  const [files, setFiles] = useState<DatasetFile[]>([]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [previewFile, setPreviewFile] = useState<DatasetFile | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    let url: string | null = null;
    if (previewFile) {
      aiTrainerApi.getFileBlob(previewFile.fileName).then(blobUrl => {
        setPreviewUrl(blobUrl);
      }).catch(err => {
        console.error("Preview fetch failed", err);
        toast.error("فشل تحميل المعاينة");
      });
    }

    return () => {
      if (previewUrl) {
        window.URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
    };
  }, [previewFile]);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const data = await aiTrainerApi.getDatasetFiles();
      setFiles(data);
    } catch (error) {
      toast.error("حدث خطأ أثناء تحميل الملفات");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSelectAll = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(filteredFiles.map((f) => f.fileName)));
    }
  };

  const toggleSelection = (fileName: string) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileName)) {
      newSelection.delete(fileName);
    } else {
      newSelection.add(fileName);
    }
    setSelectedFiles(newSelection);
  };

  const handleDownload = async () => {
    if (selectedFiles.size === 0) return;
    setDownloading(true);
    try {
      await aiTrainerApi.downloadDatasetZip(Array.from(selectedFiles));
      toast.success("تم تحميل الملفات بنجاح");
      setSelectedFiles(new Set()); // Reset selection after download
    } catch (error) {
      toast.error("فشل تحميل الملفات");
    } finally {
      setDownloading(false);
    }
  };

  const filteredFiles = files.filter(f => 
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MainLayout>
      <div className="container mx-auto p-6 space-y-6" dir="rtl">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">لوحة تحكم الذكاء الاصطناعي</h1>
            <p className="text-muted-foreground mt-2">
              استعرض وقم بتحميل صور أوراق الامتحانات قبل عملية التصحيح لتدريب النماذج.
            </p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border shadow-sm">
          <div className="relative w-full sm:w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="ابحث باسم الملف..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-3 pr-9"
            />
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={fetchFiles} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ml-2 ${loading ? 'animate-spin' : ''}`} />
              تحديث
            </Button>
            <Button 
              variant="secondary" 
              onClick={handleSelectAll}
              disabled={filteredFiles.length === 0}
            >
              {selectedFiles.size === filteredFiles.length && filteredFiles.length > 0 ? (
                <><Square className="h-4 w-4 ml-2" /> إلغاء تحديد الكل</>
              ) : (
                <><CheckSquare className="h-4 w-4 ml-2" /> تحديد الكل ({filteredFiles.length})</>
              )}
            </Button>
            <Button 
              onClick={handleDownload} 
              disabled={selectedFiles.size === 0 || downloading}
              className="bg-primary hover:bg-primary/90"
            >
              <Download className="h-4 w-4 ml-2" />
              {downloading ? 'جاري التحميل...' : `تحميل المحدد (${selectedFiles.size})`}
            </Button>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {[...Array(10)].map((_, i) => (
              <div key={i} className="h-64 rounded-xl bg-muted animate-pulse"></div>
            ))}
          </div>
        ) : filteredFiles.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-12 text-center border rounded-lg bg-card border-dashed">
            <div className="rounded-full bg-muted p-4 mb-4">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">لا توجد ملفات</h3>
            <p className="text-muted-foreground">لم يتم العثور على أوراق امتحانات مطابقة لبحثك.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredFiles.map((file) => {
              const isSelected = selectedFiles.has(file.fileName);
              const isPdf = file.fileName.toLowerCase().endsWith('.pdf');
              
              return (
                <Card 
                  key={file.fileName} 
                  className={`overflow-hidden transition-all duration-200 border-2 ${
                    isSelected ? 'border-primary shadow-md' : 'border-transparent hover:border-muted-foreground/30'
                  }`}
                  onClick={() => toggleSelection(file.fileName)}
                >
                  <div className="relative group cursor-pointer aspect-[3/4] bg-muted flex items-center justify-center overflow-hidden">
                    {isPdf ? (
                      <div className="flex flex-col items-center justify-center text-muted-foreground">
                          <div className="text-4xl font-bold mb-2">PDF</div>
                          <span className="text-xs">اضغط للمعاينة إذا كان مدعوماً</span>
                      </div>
                    ) : (
                      <img 
                        src={file.fileUrl} 
                        alt={file.fileName} 
                        className="object-cover w-full h-full transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                    )}
                    
                    <div 
                      className="absolute top-2 right-2 z-10 bg-background/80 backdrop-blur-sm rounded-sm"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox 
                        checked={isSelected}
                        onCheckedChange={() => toggleSelection(file.fileName)}
                        className={isSelected ? 'bg-primary border-primary' : ''}
                      />
                    </div>

                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                              size="icon" 
                              variant="secondary" 
                              className="rounded-full w-10 h-10 shadow-lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPreviewFile(file);
                              }}
                          >
                            <Eye className="h-5 w-5" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] p-1 bg-black/95">
                            <div className="w-full h-[85vh] flex items-center justify-center relative">
                              {!previewUrl ? (
                                <div className="flex flex-col items-center gap-3 text-white">
                                  <RefreshCw className="h-8 w-8 animate-spin opacity-50" />
                                  <p className="text-sm">جاري تحميل المعاينة...</p>
                                </div>
                              ) : isPdf ? (
                                <iframe src={previewUrl} className="w-full h-full rounded-md bg-white" title={file.fileName} />
                              ) : (
                                <img 
                                  src={previewUrl} 
                                  alt={file.fileName} 
                                  className="max-w-full max-h-full object-contain rounded-md" 
                                />
                              )}
                            </div>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </div>
                  <CardFooter className="p-3 bg-card flex flex-col items-start gap-1">
                    <p className="text-sm font-semibold truncate w-full" title={file.fileName}>
                      {file.fileName}
                    </p>
                    <p className="text-xs text-muted-foreground w-full flex justify-between">
                      <span>{format(new Date(file.creationTime), "dd MMM yyyy, HH:mm")}</span>
                    </p>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
