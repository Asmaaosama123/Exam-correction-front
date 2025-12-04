import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Loader2, AlertCircle, Key } from "lucide-react";
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
import { useRegister } from "@/hooks/use-auth";
import { getFieldErrors } from "@/lib/api";
import { transformFullNameToSplit } from "@/lib/name-utils";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    secretKey: "",
  });

  const registerMutation = useRegister();
  const error = registerMutation.error;

  // Get field-specific errors (map firstName/lastName errors to fullName)
  const firstNameErrors = getFieldErrors(error, "firstName");
  const lastNameErrors = getFieldErrors(error, "lastName");
  const fullNameErrors = [...firstNameErrors, ...lastNameErrors];
  const emailErrors = getFieldErrors(error, "email");
  const passwordErrors = getFieldErrors(error, "password");
  const secretKeyErrors = getFieldErrors(error, "secretKey");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Transform fullName to firstName/lastName before sending
    const transformedData = transformFullNameToSplit(formData);
    await registerMutation.mutateAsync(transformedData);
  };

  return (
    <AuthLayout>
      <div className="flex flex-1 items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          {/* Logo and Header */}
          <div className="flex justify-center">
            <Logo size="3xl" />
          </div>

          {/* Register Form */}
          <Card>
            <CardHeader>
              <CardTitle>مرحباً بك</CardTitle>
              <CardDescription>
                أنشئ حسابك للبدء في استخدام النظام
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Full Name Field */}
                <div className="space-y-2">
                  <Label htmlFor="fullName">الاسم الكامل</Label>
                  <div className="relative">
                    <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="fullName"
                      type="text"
                      placeholder="أدخل اسمك الكامل"
                      value={formData.fullName}
                      onChange={(e) =>
                        setFormData({ ...formData, fullName: e.target.value })
                      }
                      className={cn(
                        "pr-10",
                        fullNameErrors.length > 0 && "border-destructive"
                      )}
                      required
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  {fullNameErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {fullNameErrors.map((err, idx) => (
                          <span key={idx}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <div className="relative">
                    <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
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
                      disabled={registerMutation.isPending}
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
                      disabled={registerMutation.isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      disabled={registerMutation.isPending}
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

                {/* Secret Key Field */}
                <div className="space-y-2">
                  <Label htmlFor="secretKey">المفتاح السري</Label>
                  <div className="relative">
                    <Key className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      id="secretKey"
                      type="text"
                      placeholder="أدخل المفتاح السري"
                      value={formData.secretKey}
                      onChange={(e) =>
                        setFormData({ ...formData, secretKey: e.target.value })
                      }
                      className={cn(
                        "pr-10",
                        secretKeyErrors.length > 0 && "border-destructive"
                      )}
                      required
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  {secretKeyErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {secretKeyErrors.map((err, idx) => (
                          <span key={idx}>{err}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Terms Agreement */}
                <div className="flex items-start gap-2">
                  <input
                    id="terms"
                    type="checkbox"
                    className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                    required
                    disabled={registerMutation.isPending}
                  />
                  <Label htmlFor="terms" className="text-sm font-normal">
                    أوافق على{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      الشروط والأحكام
                    </Link>{" "}
                    و{" "}
                    <Link
                      to="/privacy"
                      className="text-primary hover:underline"
                    >
                      سياسة الخصوصية
                    </Link>
                  </Label>
                </div>

                {/* Submit Button */}
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={registerMutation.isPending}
                >
                  {registerMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 ml-2 animate-spin" />
                      جاري إنشاء الحساب...
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4 ml-2" />
                      إنشاء الحساب
                    </>
                  )}
                </Button>
              </form>

              {/* Login Link */}
              <div className="mt-6 text-center text-sm">
                <span className="text-muted-foreground">
                  لديك حساب بالفعل؟{" "}
                </span>
                <Link
                  to="/login"
                  className="font-medium text-primary hover:underline"
                >
                  تسجيل الدخول
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthLayout>
  );
}
