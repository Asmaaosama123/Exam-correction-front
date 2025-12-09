import { MainLayout } from "@/components/layout/MainLayout";
import { GradePaperUpload } from "@/components/grading/GradePaperUpload";
import { GradingResultsTable } from "@/components/grading/GradingResultsTable";

const Grading = () => {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col gap-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">
              التصحيح والنتائج
            </h1>
            <p className="text-muted-foreground mt-2">
              تصحيح أوراق الامتحانات باستخدام الذكاء الاصطناعي وعرض النتائج
            </p>
          </div>
        </div>

        {/* Upload Section */}
        <GradePaperUpload />

        {/* Results Table */}
        <GradingResultsTable />
      </div>
    </MainLayout>
  );
};

export default Grading;
