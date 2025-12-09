import { AlertCircle, Mail, Sparkles } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TrialStatusProps {
  remainingPapers: number;
  totalPapers: number;
}

export function TrialStatus({
  remainingPapers,
  totalPapers,
}: TrialStatusProps) {
  const isTrialActive = remainingPapers > 0;
  const papersUsed = totalPapers - remainingPapers;

  if (!isTrialActive) {
    // Trial expired - show contact admin message
    return (
      <Card className="border-2 border-destructive/50 bg-destructive/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-lg font-semibold text-destructive">
              انتهت الأوراق المجانية
            </CardTitle>
          </div>
          <CardDescription className="text-base">
            لقد استخدمت جميع الأوراق المجانية ({totalPapers} ورقة). للاستمرار في
            استخدام خدمة التصحيح، يرجى التواصل مع المسؤول للاشتراك.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            size="sm"
            className="w-full sm:w-auto"
            onClick={() => {
              // This will be handled by logic later
              window.location.href =
                "mailto:admin@example.com?subject=طلب اشتراك - خدمة التصحيح";
            }}
          >
            <Mail className="h-4 w-4 ml-2" />
            التواصل مع المسؤول
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Trial active - show remaining papers
  return (
    <Card className="border-2 border-primary/30 bg-primary/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg font-semibold">تجربة مجانية</CardTitle>
        </div>
        <CardDescription className="text-base">
          <div className="mt-2 space-y-1">
            <p>
              لديك{" "}
              <span className="font-bold text-primary text-lg">
                {remainingPapers}
              </span>{" "}
              من أصل <span className="font-semibold">{totalPapers}</span> ورقة
              مجانية متبقية
            </p>
            {papersUsed > 0 && (
              <p className="text-sm text-muted-foreground">
                تم استخدام {papersUsed} ورقة حتى الآن
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-2">
              بعد انتهاء الأوراق المجانية، ستحتاج للتواصل مع المسؤول للاشتراك
            </p>
          </div>
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
