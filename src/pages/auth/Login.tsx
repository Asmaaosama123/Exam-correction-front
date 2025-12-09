import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LogIn,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
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
import { useLogin } from "@/hooks/use-auth";
import { getFieldErrors } from "@/lib/api";
import { cn } from "@/lib/utils";
import Logo from "@/components/ui/Logo";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const loginMutation = useLogin();
  const error = loginMutation.error;

  // Check for unauthorized redirect and show toast
  useEffect(() => {
    const showUnauthorizedToast = sessionStorage.getItem(
      "showUnauthorizedToast"
    );
    if (showUnauthorizedToast === "true") {
      sessionStorage.removeItem("showUnauthorizedToast");
      toast.error("انتهت صلاحية الجلسة", {
        description: "يرجى تسجيل الدخول مرة أخرى للمتابعة",
      });
    }
  }, []);

  // Get field-specific errors
  const emailErrors = getFieldErrors(error, "email");
  const passwordErrors = getFieldErrors(error, "password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await loginMutation.mutateAsync(formData);
    } catch {
      // Error is handled by the mutation's onError callback
      // This catch prevents the form from submitting and causing a page reload
    }
  };

  return (
    <AuthLayout>
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="flex justify-center">
            <Logo size="3xl" />
          </div>

          {/* Login Form */}
          <Card>
            <CardHeader>
              <CardTitle>مرحباً بعودتك</CardTitle>
              <CardDescription>
                أدخل بريدك الإلكتروني وكلمة المرور للمتابعة
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
                      autoComplete="email"
                      id="email"
                      type="email"
                      placeholder="example@email.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={cn(
                        "pr-10",
                        emailErrors.length > 0 && "border-destructive"
                      )}
                      required
                      dir="ltr"
                      disabled={loginMutation.isPending}
                    />
                  </div>
                  {emailErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {emailErrors.map((err, idx) => (
                          <span key={idx}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <div className="relative">
                    <Lock className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="password"
                      autoComplete="current-password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) =>
                        setFormData({ ...formData, password: e.target.value })
                      }
                      className={cn(
                        "pr-10",
                        passwordErrors.length > 0 && "border-destructive"
                      )}
                      required
                      disabled={loginMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={loginMutation.isPending}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {passwordErrors.map((err, idx) => (
                          <span key={idx}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center gap-2">
                  <input
                    id="remember"
                    type="checkbox"
                    className="h-4 w-4 rounded cursor-pointer border-input text-primary focus:ring-primary"
                    disabled={loginMutation.isPending}
                  />
                  <Label
                    htmlFor="remember"
                    className="text-sm font-normal cursor-pointer"
                  >
                    تذكرني
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري تسجيل الدخول...
                    </>
                  ) : (
                    <>
                      <LogIn className="h-4 w-4 ml-2" />
                      تسجيل الدخول
                    </>
                  )}
                </Button>
              </form>

              {/* Register Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">ليس لديك حساب؟ </span>
                <Link
                  to="/register"
                  className="font-medium text-primary hover:underline"
                >
                  إنشاء حساب جديد
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
