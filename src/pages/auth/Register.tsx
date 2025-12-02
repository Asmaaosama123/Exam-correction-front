import { useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus, Mail, Lock, Eye, EyeOff, User, Loader2 } from "lucide-react";
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
import { useRegister } from "@/hooks/use-auth";
import Logo from "@/components/ui/Logo";

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const registerMutation = useRegister();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await registerMutation.mutateAsync(formData);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
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
              {/* First Name Field */}
              <div className="space-y-2">
                <Label htmlFor="firstName">الاسم الأول</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="firstName"
                    type="text"
                    placeholder="أدخل اسمك الأول"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    className="pr-10"
                    required
                    disabled={registerMutation.isPending}
                  />
                </div>
              </div>

              {/* Last Name Field */}
              <div className="space-y-2">
                <Label htmlFor="lastName">اسم العائلة</Label>
                <div className="relative">
                  <User className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="lastName"
                    type="text"
                    placeholder="أدخل اسم العائلة"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    className="pr-10"
                    required
                    disabled={registerMutation.isPending}
                  />
                </div>
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
                    className="pr-10"
                    required
                    dir="ltr"
                    disabled={registerMutation.isPending}
                  />
                </div>
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
                    className="pr-10"
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
                  <Link to="/privacy" className="text-primary hover:underline">
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
              <span className="text-muted-foreground">لديك حساب بالفعل؟ </span>
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
  );
}
