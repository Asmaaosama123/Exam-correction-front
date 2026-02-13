// src/pages/CameraScan.tsx
import { CameraScanner } from "@/components/grading/CameraScanner";
import { useSearchParams } from "react-router-dom";
// src/types/grading.ts

export interface GradingDetail {
    id: string;
    type: "mcq" | "true_false";
    gt: string;
    pred: string;
    conf: number;
    ok: boolean;
    method: string;
  }
  
  export interface ExamResult {
    filename: string;
    details: {
      score: number;
      total: number;
      details: GradingDetail[];
    };
    annotated_image_url: string;
  }
export default function CameraScan() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || crypto.randomUUID();

  const handleComplete = (results: ExamResult[]) => {
    localStorage.setItem(`camera-results-${sessionId}`, JSON.stringify(results));
    alert(`✅ تم تصحيح ${results.length} طالب بنجاح!`);
    setTimeout(() => window.close(), 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white p-4">
      <CameraScanner fullscreen onComplete={handleComplete} />
    </div>
  );
}