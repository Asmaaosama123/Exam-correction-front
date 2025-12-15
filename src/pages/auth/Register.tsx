import { useState } from "react";
import { Link } from "react-router-dom";
import {
  UserPlus,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  Loader2,
  AlertCircle,
  Mail,
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
import { useRegister } from "@/hooks/use-auth";
import { getFieldErrors } from "@/lib/api";
import { transformFullNameToSplit } from "@/lib/name-utils";
import Logo from "@/components/ui/Logo";
import { cn } from "@/lib/utils";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [isEmailRegister, setIsEmailRegister] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    password: "",
  });

  const registerMutation = useRegister();
  const error = registerMutation.error;

  // Get field-specific errors (map firstName/lastName errors to fullName)
  const firstNameErrors = getFieldErrors(error, "firstName");
  const lastNameErrors = getFieldErrors(error, "lastName");
  const fullNameErrors = [...firstNameErrors, ...lastNameErrors];
  const phoneNumberErrors = getFieldErrors(error, "phoneNumber");
  const passwordErrors = getFieldErrors(error, "password");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const identifier = formData.phoneNumber.trim();

    if (!identifier) {
      return;
    }

    if (isEmailRegister) {
      const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(identifier);
      if (!isValidEmail) {
        return;
      }
    } else {
      const isValidPhone = /^0?\d{8,15}$/.test(identifier);
      if (!isValidPhone) {
        return;
      }
    }

    // Transform fullName to firstName/lastName before sending
    const transformedName = transformFullNameToSplit(formData);
    await registerMutation.mutateAsync({
      ...transformedName,
      // Backend currently expects phoneNumber; it can be either phone or email
      phoneNumber: identifier,
      password: formData.password,
    });
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
                {/* Register Mode Switch */}
                <div className="flex justify-center">
                  <div className="inline-flex items-center rounded-full bg-muted p-1 text-xs">
                    <button
                      type="button"
                      onClick={() => setIsEmailRegister(true)}
                      disabled={registerMutation.isPending}
                      className={cn(
                        "px-3 py-1 rounded-full transition-colors",
                        isEmailRegister
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      التسجيل بالبريد الإلكتروني
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEmailRegister(false)}
                      disabled={registerMutation.isPending}
                      className={cn(
                        "px-3 py-1 rounded-full transition-colors",
                        !isEmailRegister
                          ? "bg-background text-primary shadow-sm"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      التسجيل برقم الجوال
                    </button>
                  </div>
                </div>
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

                {/* Email or Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">
                    {isEmailRegister ? "البريد الإلكتروني" : "رقم الجوال"}
                  </Label>
                  <div className="relative">
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-muted-foreground">
                      {isEmailRegister ? (
                        <Mail className="h-4 w-4" />
                      ) : (
                        <Phone className="h-4 w-4" />
                      )}
                    </div>
                    <Input
                      id="phoneNumber"
                      type="text"
                      placeholder={
                        isEmailRegister ? "example@email.com" : "05XXXXXXXX"
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
                        phoneNumberErrors.length > 0 && "border-destructive"
                      )}
                      required
                      disabled={registerMutation.isPending}
                    />
                  </div>
                  {phoneNumberErrors.length > 0 && (
                    <div className="flex items-start gap-2 text-sm text-destructive">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <div className="flex flex-col gap-1">
                        {phoneNumberErrors.map((err, idx) => (
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
