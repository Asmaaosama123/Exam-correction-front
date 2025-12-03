import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, GraduationCap, Loader2, ArrowRight, AlertCircle } from "lucide-react";
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
import { useForgetPassword } from "@/hooks/use-auth";
import { getFieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const forgetPasswordMutation = useForgetPassword();
  const error = forgetPasswordMutation.error;

  // Get field-specific errors
  const emailErrors = getFieldErrors(error, "email");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await forgetPasswordMutation.mutateAsync({ email });
  };

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
              نسيت كلمة المرور؟
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              أدخل بريدك الإلكتروني وسنرسل لك رابط إعادة تعيين كلمة المرور
            </p>
          </div>

          {/* Forgot Password Form */}
          <Card>
            <CardHeader>
              <CardTitle>إعادة تعيين كلمة المرور</CardTitle>
              <CardDescription>
                سنرسل لك رمز التحقق إلى بريدك الإلكتروني
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={cn(
                        "pr-10",
                        emailErrors.length > 0 && "border-destructive"
                      )}
                      required
                      dir="ltr"
                      disabled={forgetPasswordMutation.isPending}
                    />
                  </div>
                  {emailErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <div className="flex flex-col gap-1">
                        {emailErrors.map((err, idx) => (
                          <span key={idx}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={forgetPasswordMutation.isPending}
                >
                  {forgetPasswordMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري الإرسال...
                    </>
                  ) : (
                    <>
                      إرسال رابط إعادة التعيين
                      <ArrowRight className="h-4 w-4 mr-2" />
                    </>
                  )}
                </Button>
              </form>

              {/* Back to Login Link */}
              <div className="mt-6 text-center text-sm">
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
