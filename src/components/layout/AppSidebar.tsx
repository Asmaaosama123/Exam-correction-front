import * as React from "react";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  FileCheck,
  FileText,
  // CheckSquare,
  BarChart3,
  CheckSquare,
  Play,
  PieChart,
  Target,
  Shield,
  MessageSquare,
  Activity,
  CreditCard,
  ScrollText,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import ControleTheme from "@/components/ui/ControleTheme";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { ComplaintFloatingButton } from "../teacher/ComplaintFloatingButton";

const menuItems = [
  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "الفصول",
    icon: GraduationCap,
    href: "/classes",
  },
  {
    title: "الطلاب",
    icon: Users,
    href: "/students",
  },
  {
    title: "توليد الباركود",
    icon: FileCheck,
    href: "/exams",
  },
  {
    title: "إعداد نموذج الاجابة",
    icon: FileText,
    href: "/exam-template",
  },
  {
    title: "التصحيح والنتائج",
    icon: CheckSquare,
    href: "/grading",
  },
  {
    title: "التقارير",
    icon: BarChart3,
    href: "/reports",
  },
  {
    title: "الأهداف",
    icon: Target,
    href: "/goals",
  },
  {
    title: "تحليل نتائج الاختبارات",
    icon: PieChart,
    href: "/analysis",
  },
  {
    title: "فيديوهات توضيحيه",
    icon: Play,
    href: "/tutorial",
  },
  {
    title: "باقات الاشتراك",
    icon: CreditCard,
    href: "/subscriptions",
  },
  {
    title: "شكاوى وملاحظات",
    icon: MessageSquare,
    href: "#complaint", // Special case
  },
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState("");
  const navigate = useNavigate();
  const location = useLocation();
  const { data: user } = useAuth();

  React.useEffect(() => {
    if (location.pathname.includes(activeItem)) {
      setActiveItem(location.pathname);
    }
  }, [location.pathname, activeItem]);

  const handleClick = (href: string) => {
    // Check if it's an external URL
    if (href.startsWith("http://") || href.startsWith("https://")) {
      window.open(href, "_blank", "noopener,noreferrer");
      return;
    }
    setActiveItem(href);
    navigate(href);
  };

  return (
    <Sidebar
      side="right"
      variant="sidebar"
      collapsible="icon"
      className={cn("border-l", className)}
    >
      <SidebarContent>
        <SidebarGroup className="md:pt-18">
          <SidebarGroupLabel className="px-2 ">
            القائمة الرئيسية
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems
                .filter((item) => {
                  const isSpecialRole = user?.roles?.some(role => ["admin", "aitrainer"].includes(role.toLowerCase()));

                  if (item.href === "/subscriptions" && user?.isSubscriptionModeEnabled === false) {
                    return false;
                  }

                  return !isSpecialRole;
                }) // Filter out regular items for Admins and AI Trainers
                .map((item) => {
                  const Icon = item.icon;
                  const isActive = activeItem === item.href;

                  return (
                    <SidebarMenuItem key={item.href}>
                      {item.href === "#complaint" ? (
                        <ComplaintFloatingButton />
                      ) : (
                        <SidebarMenuButton
                          onClick={() => {
                            handleClick(item.href);
                          }}
                          asChild
                          isActive={isActive}
                          tooltip={item.title}
                          className="w-full cursor-pointer justify-start gap-3"
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="h-5 w-5 ml-2" />
                            <span className="group-data-[collapsible=icon]:hidden">
                              {item.title}
                            </span>
                          </div>
                        </SidebarMenuButton>
                      )}
                    </SidebarMenuItem>
                  );
                })}

              {/* AI Trainer specific items */}
              {user?.roles?.some(role => role.toLowerCase() === "aitrainer") && (
                <SidebarMenuItem>
                  <SidebarMenuButton
                    onClick={() => {
                      handleClick('/ai-dashboard');
                    }}
                    asChild
                    isActive={activeItem === '/ai-dashboard'}
                    tooltip="لوحة تحكم الذكاء الاصطناعي"
                    className="w-full cursor-pointer justify-start gap-3 text-purple-600 dark:text-purple-400 font-bold bg-purple-50 dark:bg-purple-950/20"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutDashboard className="h-5 w-5 ml-2" />
                      <span className="group-data-[collapsible=icon]:hidden">
                        لوحة الذكاء الاصطناعي
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {/* Check if user is an admin by roles or email fallback */}
              {(user?.roles?.some(role => role.toLowerCase() === "admin") || user?.email === 'superadmin@wsyli.com' || user?.email === 'admin@exam-correction.com') && (
                <>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick('/admin');
                      }}
                      asChild
                      isActive={activeItem === '/admin'}
                      tooltip="إدارة النظام"
                      className="w-full cursor-pointer justify-start gap-3 text-red-600 dark:text-red-400 font-bold bg-red-50 dark:bg-red-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <Shield className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          إدارة النظام
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick('/admin/complaints');
                      }}
                      asChild
                      isActive={activeItem === '/admin/complaints'}
                      tooltip="شكاوى المعلمين"
                      className="w-full cursor-pointer justify-start gap-3 text-amber-600 dark:text-amber-400 font-bold bg-amber-50 dark:bg-amber-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <MessageSquare className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          شكاوى المعلمين
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick('/admin/packages');
                      }}
                      asChild
                      isActive={activeItem === '/admin/packages'}
                      tooltip="باقات الاشتراك"
                      className="w-full cursor-pointer justify-start gap-3 text-indigo-600 dark:text-indigo-400 font-bold bg-indigo-50 dark:bg-indigo-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          باقات الاشتراك
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick('/admin/subscription-requests');
                      }}
                      asChild
                      isActive={activeItem === '/admin/subscription-requests'}
                      tooltip="طلبات الاشتراك"
                      className="w-full cursor-pointer justify-start gap-3 text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <ScrollText className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          طلبات الاشتراك
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick('/admin/system-logs');
                      }}
                      asChild
                      isActive={activeItem === '/admin/system-logs'}
                      tooltip="سجل النظام والأخطاء"
                      className="w-full cursor-pointer justify-start gap-3 text-cyan-600 dark:text-cyan-400 font-bold bg-cyan-50 dark:bg-cyan-950/20"
                    >
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          سجل الأخطاء
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </>
              )}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="flex items-center justify-center">
          <ControleTheme />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}