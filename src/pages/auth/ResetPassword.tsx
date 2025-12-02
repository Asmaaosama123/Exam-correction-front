import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Lock, Loader2, Eye, EyeOff, ArrowRight } from "lucide-react";
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
import { useResetPassword } from "@/hooks/use-auth";
import Logo from "@/components/ui/Logo";

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    newpassword: "",
  });

  const resetPasswordMutation = useResetPassword();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await resetPasswordMutation.mutateAsync({
      email,
      newpassword: formData.newpassword,
      code,
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="flex justify-center">
          <Logo size="3xl" />
        </div>

        {/* Reset Password Form */}
        <Card>
          <CardHeader>
            <CardTitle>كلمة مرور جديدة</CardTitle>
            <CardDescription>
              أدخل رمز التحقق الذي تم إرساله إلى{" "}
              <span className="font-semibold text-primary">{email}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* New Password Field */}
              <div className="space-y-2">
                <Label htmlFor="newpassword">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="newpassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.newpassword}
                    onChange={(e) =>
                      setFormData({ ...formData, newpassword: e.target.value })
                    }
                    className="pr-10"
                    required
                    disabled={resetPasswordMutation.isPending}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    disabled={resetPasswordMutation.isPending}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={resetPasswordMutation.isPending}
              >
                {resetPasswordMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                    جاري إعادة التعيين...
                  </>
                ) : (
                  <>
                    إعادة تعيين كلمة المرور
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
  );
}
