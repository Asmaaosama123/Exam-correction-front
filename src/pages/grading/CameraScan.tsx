import { useNavigate, useSearchParams } from "react-router-dom";
import { CameraScanner } from "@/components/grading/CameraScanner";
import type { ExamResult } from "@/types/grading";

export default function CameraScan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session") || crypto.randomUUID();

  const handleComplete = (results: ExamResult[]) => {
    localStorage.setItem(`camera-results-${sessionId}`, JSON.stringify(results));
    alert(`✅ تم تصحيح ${results.length} طالب بنجاح!`);
    setTimeout(() => navigate(-1), 3000);
  };
  const handleBack = () => {
    navigate(-1);
  };

  return (
    <CameraScanner
      fullscreen
      onComplete={handleComplete}
      onBack={handleBack}
    />
  );
}