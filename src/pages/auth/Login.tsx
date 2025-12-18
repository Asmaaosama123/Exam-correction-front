import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  LogIn,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Mail,
  Phone,
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
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [formData, setFormData] = useState({
    phoneNumber: "",
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
  const identifierErrors = getFieldErrors(error, "identifier");
  const passwordErrors = getFieldErrors(error, "password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifier = formData.phoneNumber.trim();

    if (!identifier) {
      toast.error("بيانات الدخول غير صحيحة", {
        description: "يرجى إدخال بيانات الدخول",
      });
      return;
    }

    if (isEmailLogin) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      if (!isValidEmail) {
        toast.error("بريد إلكتروني غير صحيح", {
          description: "يرجى إدخال بريد إلكتروني صحيح",
        });
        return;
      }
    } else {
      const isValidPhone = /^0?\d{8,15}$/.test(identifier);
      if (!isValidPhone) {
        toast.error("رقم جوال غير صحيح", {
          description: "يرجى إدخال رقم جوال صحيح",
        });
        return;
      }
    }

    try {
      await loginMutation.mutateAsync({
        identifier,
        password: formData.password,
        isEmail: isEmailLogin,
      });
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
                أدخل بيانات الدخول وكلمة المرور للمتابعة
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Login Mode Switch */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center rounded-full bg-muted p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsEmailLogin(true)}
                      disabled={loginMutation.isPending}
                      className={cn(
                        "px-3 py-1 rounded-full transition-colors",
                        isEmailLogin
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      تسجيل باستخدام البريد الإلكتروني
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEmailLogin(false)}
                      disabled={loginMutation.isPending}
                      className={cn(
                        "px-3 py-1 rounded-full transition-colors",
                        !isEmailLogin
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      تسجيل باستخدام رقم الجوال
                    </button>
                  </div>
                </div>
                {/* Email or Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    {isEmailLogin ? "البريد الإلكتروني" : "رقم الجوال"}
                  </Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                      {isEmailLogin ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </div>
                    <Input
                      autoComplete="tel"
                      id="phoneNumber"
                      type="text"
                      placeholder={
                        isEmailLogin ? "example@email.com" : "05XXXXXXXX"
                      }
                      value={formData.phoneNumber}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          phoneNumber: e.target.value,
                        })
                      }
                      className={cn(
                        "pr-10",
                        identifierErrors.length > 0 && "border-destructive"
                      )}
                      required
                      disabled={loginMutation.isPending}
                    />
                  </div>
                  {identifierErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {identifierErrors.map((err, idx) => (
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
