import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Mail,
  GraduationCap,
  Loader2,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { AuthLayout } from "@/components/layout/AuthLayout";
import { useVerifyEmail } from "@/hooks/use-auth";

export default function VerifyEmail() {
  const location = useLocation();
  const state = location.state as { userId?: string; email?: string } | null;

  const [code, setCode] = useState("");
  const userId = state?.userId || "";
  const email = state?.email || "";

  const verifyEmailMutation = useVerifyEmail();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) {
      return;
    }
    await verifyEmailMutation.mutateAsync({ userId, code });
  };

  if (!userId) {
    return (
      <AuthLayout>
        <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <CheckCircle2 className="mx-auto h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">خطأ</h2>
                <p className="text-muted-foreground">
                  لم يتم العثور على معرف المستخدم
                </p>
                <Button asChild className="w-full">
                  <Link to="/register">العودة إلى التسجيل</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary">
              <GraduationCap className="h-8 w-8 text-primary-foreground" />
            </div>
            <h2 className="mt-6 text-3xl font-bold text-foreground">
              التحقق من البريد الإلكتروني
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدخل رمز التحقق الذي تم إرساله إلى{" "}
              <span className="font-semibold">{email}</span>
            </p>
          </div>

          {/* Verify Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>رمز التحقق</CardTitle>
              <CardDescription>
                تحقق من بريدك الإلكتروني وأدخل رمز التحقق
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Code Field */}
                <div className="space-y-2">
                  <Label htmlFor="code">رمز التحقق</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="code"
                      type="text"
                      placeholder="أدخل رمز التحقق"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="pr-10"
                      required
                      disabled={verifyEmailMutation.isPending}
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={verifyEmailMutation.isPending || !userId}
                >
                  {verifyEmailMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري التحقق...
                    </>
                  ) : (
                    <>
                      التحقق من البريد الإلكتروني
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Resend Code & Back Links */}
              <div className="mt-6 space-y-2 text-center text-sm">
                <p className="text-muted-foreground">
                  لم تستلم الرمز؟{" "}
                  <button
                    type="button"
                    className="font-medium text-primary hover:underline"
                    onClick={() => {
                      // TODO: Implement resend code functionality
                    }}
                  >
                    إعادة الإرسال
                  </button>
                </p>
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline flex items-center justify-center gap-2"
                >
                  <ArrowRight className="h-4 w-4" />
                  العودة إلى تسجيل الدخول
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
