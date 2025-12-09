import {
  Shield,
  Database,
  Lock,
  Eye,
  FileDown,
  Mail,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MainLayout } from "@/components/layout/MainLayout";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

const sections = [
  {
    icon: Database,
    title: "البيانات التي نجمعها",
    content: [
      {
        subtitle: "بيانات الطلاب:",
        items: [
          "الاسم الكامل",
          "الرقم التعريفي",
          "الصف الدراسي",
          "الصورة الشخصية (اختياري)",
        ],
      },
      {
        subtitle: "بيانات المعلمين والإداريين:",
        items: ["الاسم الكامل", "البريد الإلكتروني", "رقم الجوال"],
      },
      {
        subtitle: "صور أوراق الإجابة:",
        items: [
          "صور أوراق الإجابة الممسوحة ضوئيًا",
          "تُحذف تلقائيًا بعد 30 يومًا من إعلان النتيجة النهائية",
        ],
      },
    ],
  },
  {
    icon: Eye,
    title: "كيفية استخدام البيانات",
    content: [
      {
        subtitle: "الاستخدامات الرئيسية:",
        items: [
          "توليد أوراق اختبار شخصية تحتوي على باركود فريد",
          "التصحيح الآلي باستخدام الذكاء الاصطناعي",
          "إصدار التقارير والإحصائيات التعليمية",
          "تحسين جودة التعليم وتقييم الأداء",
        ],
      },
    ],
  },
  {
    icon: Shield,
    title: "عدم مشاركة البيانات",
    content: [
      {
        subtitle: "التزامنا بحماية بياناتك:",
        items: [
          "لا نُشارك أي بيانات شخصية مع جهات خارجية إلا بأمر قضائي",
          "لا نُشارك البيانات إلا بموافقة خطية من ولي الأمر/الطالب البالغ",
          "نلتزم بجميع القوانين والأنظمة السعودية المتعلقة بحماية البيانات الشخصية",
        ],
      },
    ],
  },
  {
    icon: Lock,
    title: "أمان البيانات",
    content: [
      {
        subtitle: "إجراءات الأمان:",
        items: [
          "يتم تشفير جميع البيانات أثناء النقل والتخزين",
          "يتم استضافة النظام على خوادم داخل المملكة العربية السعودية",
          "نستخدم أحدث تقنيات الأمان لحماية بياناتك",
          "نقوم بعمليات نسخ احتياطي منتظمة لضمان عدم فقدان البيانات",
        ],
      },
    ],
  },
  {
    icon: FileDown,
    title: "حقوقك",
    content: [
      {
        subtitle: "حقوقك في بياناتك:",
        items: [
          "لك الحق في طلب حذف بياناتك الشخصية في أي وقت",
          "لك الحق في تصدير جميع بياناتك بصيغة Excel",
          "لك الحق في الاطلاع على جميع البيانات المحفوظة عنك",
          "لك الحق في تصحيح أي بيانات غير دقيقة",
        ],
      },
    ],
  },
];

export default function Privacy() {
  return (
    <MainLayout>
      <div className="flex flex-1 flex-col">
        <div className="bg-accent/50 border-b">
          <div className="mx-auto w-full max-w-4xl px-6 py-12">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-foreground">
                  سياسة الخصوصية
                </h1>
                <div className="mt-2 flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    <Calendar className="h-3 w-3 ml-1" />
                    آخر تحديث: 1 ديسمبر 2025
                  </Badge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto w-full max-w-4xl flex-1 px-6 py-8">
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>التزامنا بحماية خصوصيتك</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground leading-relaxed">
                  نحن ملتزمون بحماية خصوصية طلابنا ومعلمينا وفقًا لنظام حماية
                  البيانات الشخصية في المملكة العربية السعودية. نؤمن بأهمية
                  حماية معلوماتك الشخصية ونعمل بجد لضمان أمانها.
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
                    <div className="space-y-6">
                      {section.content.map((item, itemIndex) => (
                        <div key={itemIndex}>
                          <h4 className="mb-3 font-semibold text-foreground">
                            {item.subtitle}
                          </h4>
                          <ul className="space-y-2">
                            {item.items.map((listItem, listIndex) => (
                              <li
                                key={listIndex}
                                className="flex gap-3 text-muted-foreground leading-relaxed"
                              >
                                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                                <span>{listItem}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Separator className="my-8" />

          <Card className="bg-accent/50 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Mail className="h-5 w-5 mt-0.5 text-primary shrink-0" />
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    للتواصل بخصوص الخصوصية
                  </h3>
                  <p className="text-muted-foreground mb-3">
                    إذا كان لديك أي استفسار أو طلب بخصوص بياناتك الشخصية أو
                    سياسة الخصوصية، يرجى التواصل معنا عبر:
                  </p>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    href="https://api.whatsapp.com/send/?phone=966553576290&text&type=phone_number&app_absent=0"
                    className="inline-block font-medium text-primary hover:underline"
                  >
                    +966 55 357 6290
                  </a>
                  <p className="mt-4 text-sm text-muted-foreground italic">
                    جزاكم الله خيرًا على ثقتكم بنا.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
