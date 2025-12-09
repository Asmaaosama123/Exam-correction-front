import { MainLayout } from "@/components/layout/MainLayout";
import { TrialStatus } from "@/components/grading/TrialStatus";
import { GradePaperUpload } from "@/components/grading/GradePaperUpload";

export default function Dashboard() {
  // TODO: These values will come from API/context later
  const totalPapers = 3;
  const remainingPapers = 3; // This will be fetched from backend

  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
          <p className="text-muted-foreground mt-2">
            جرب خدمة التصحيح بالذكاء الاصطناعي مجاناً
          </p>
        </div>

        {/* Trial Status */}
        <TrialStatus
          remainingPapers={remainingPapers}
          totalPapers={totalPapers}
        />

        <GradePaperUpload />
      </div>
    </MainLayout>
  );
}
