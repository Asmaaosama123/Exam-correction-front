import * as React from "react";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  FileText,
  CheckSquare,
  BarChart3,
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

const menuItems = [
  {
    title: "لوحة التحكم",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "الطلاب",
    icon: Users,
    href: "/students",
  },
  {
    title: "الاختبارات",
    icon: FileCheck,
    href: "/exams",
  },
  {
    title: "تسليم الأوراق",
    icon: FileText,
    href: "/submissions",
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
];

interface AppSidebarProps {
  className?: string;
}

export function AppSidebar({ className }: AppSidebarProps) {
  const [activeItem, setActiveItem] = React.useState("");
  const navigate = useNavigate();
  const location = useLocation();

  React.useEffect(() => {
    if (location.pathname.includes(activeItem)) {
      setActiveItem(location.pathname);
    }
  }, [location.pathname, activeItem]);

  const handleClick = (href: string) => {
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
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeItem === item.href;

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      onClick={() => {
                        handleClick(item.href);
                      }}
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className="w-full justify-start gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="h-5 w-5 ml-2" />
                        <span className="group-data-[collapsible=icon]:hidden">
                          {item.title}
                        </span>
                      </div>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
