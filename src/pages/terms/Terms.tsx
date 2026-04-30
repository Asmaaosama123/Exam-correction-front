import { FileText, Shield, Users, AlertTriangle, Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { Separator } from "@/components/ui/separator";

const sections = [
  {
    icon: Users,
    title: "الاستخدام المسموح",
    content: [
      "يُسمح باستخدام النظام فقط لأغراض تعليمية وإدارية داخل المؤسسة التعليمية.",
      "يُحظر تمامًا استخدام النظام في أي أنشطة غير قانونية أو تخالف الأنظمة السعودية.",
    ],
  },
  {
    icon: Shield,
    title: "حساب المستخدم",
    content: [
      "يتحمل كل مستخدم مسؤولية الحفاظ على سرية كلمة المرور الخاصة به.",
      "يُحظر مشاركة الحساب مع الآخرين.",
      "يجب إبلاغ إدارة النظام فورًا في حالة اكتشاف أي استخدام غير مصرح به.",
    ],
  },
  {
    icon: FileText,
    title: "إنشاء الاختبارات وتصحيحها",
    content: [
      "جميع الأسئلة والإجابات التي تُدخلها تظل ملكًا لك أو لمؤسستك التعليمية.",
      "يحق للنظام حفظ نسخة مؤقتة من أوراق الإجابات الممسوحة ضوئيًا لأغراض التصحيح الآلي فقط.",
      "يتم حذف الصور تلقائيًا بعد انتهاء عملية التصحيح وفقًا لسياسة الخصوصية.",
    ],
  },
  {
    icon: Shield,
    title: "التصحيح الآلي بالذكاء الاصطناعي",
    content: [
      "يتم معالجة صور أوراق الإجابة باستخدام تقنيات الرؤية الحاسوبية والتعرف الضوئي على الحروف.",
      "لا يتم تخزين الصور بعد انتهاء عملية التصحيح إلا بموافقة صريحة من إدارة المدرسة.",
      "نضمن دقة التصحيح الآلي ولكن يحق للمستخدم مراجعة النتائج والاعتراض عليها.",
    ],
  },
  {
    icon: AlertTriangle,
    title: "حظر إساءة الاستخدام",
    content: [
      "يحق لإدارة النظام إيقاف أي حساب يثبت تورطه في التلاعب بالنتائج أو محاولة اختراق النظام.",
      "يُحظر استخدام النظام لأغراض تجارية أو غير مصرح بها.",
      "يُحظر محاولة الوصول غير المصرح به إلى بيانات المستخدمين الآخرين.",
    ],
  },
  {
    icon: FileText,
    title: "التعديل على الشروط",
    content: [
      "تحتفظ إدارة النظام بالحق في تعديل هذه الشروط في أي وقت.",
      "يُعتبر استمرارك في استخدام النظام موافقة ضمنية على التعديلات.",
      "سيتم إشعار المستخدمين بأي تغييرات جوهرية في الشروط عبر البريد الإلكتروني.",
    ],
  },
];

export default function Terms() {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col">
        <div className="bg-accent/50 border-b">
          <div className="mx-auto w-full max-w-4xl px-6 py-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  شروط الاستخدام
                </h1>
                <p className="mt-1 text-muted-foreground">
                  آخر تحديث: 1 ديسمبر 2025
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>
                  مرحبًا بكم في نظام إدارة الاختبارات الإلكتروني
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  باستخدامك لهذا النظام، فإنك توافق على الالتزام بالشروط
                  والأحكام التالية. يرجى قراءة هذه الشروط بعناية قبل استخدام
                  النظام.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            {sections.map((section, index) => {
              const Icon = section.icon;
              return (
                <Card key={index}>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{section.title}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {section.content.map((item, itemIndex) => (
                        <li
                          key={itemIndex}
                          className="flex gap-3 text-muted-foreground leading-relaxed"
                        >
                          <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator className="my-8" />

          <Card className="bg-accent/50">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    للاستفسار أو الدعم
                  </h3>
                  <p className="text-muted-foreground">
                    لأي استفسار بخصوص شروط الاستخدام، يرجى التواصل معنا عبر:
                  </p>
                  <a
                    href="https://api.whatsapp.com/send/?phone=966553576290&text&type=phone_number&app_absent=0"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-medium text-primary hover:underline"
                  >
                    +966 55 357 6290
                  </a>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
