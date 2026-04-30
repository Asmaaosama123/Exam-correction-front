import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem
} from "@/components/ui/sidebar";
import { Users, LayoutDashboard, LogOut, MessageSquare, Activity, Video, Package, ScrollText } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLogout } from "@/hooks/use-auth";

const adminItems = [
    {
        title: "لوحة التحكم",
        url: "/admin",
        icon: LayoutDashboard,
    },
    {
        title: "إدارة المستخدمين",
        url: "/admin/users",
        icon: Users,
    },
    {
        title: "باقات الاشتراك",
        url: "/admin/packages",
        icon: Package,
    },
    {
        title: "طلبات الاشتراك",
        url: "/admin/subscription-requests",
        icon: ScrollText,
    },
    {
        title: "شكاوى المعلمين",
        url: "/admin/complaints",
        icon: MessageSquare,
    },
    {
        title: "سجل الأخطاء",
        url: "/admin/system-logs",
        icon: Activity,
    },
    {
        title: "إدارة الفيديوهات",
        url: "/admin/tutorials",
        icon: Video,
    },
];

export function AdminSidebar() {
    const location = useLocation();
    const logout = useLogout();

    return (
        <Sidebar side="right" variant="sidebar">
            <SidebarHeader className="flex h-16 items-center justify-center border-b px-4">
                <div className="flex items-center gap-2 font-bold text-xl text-primary">
                    <span className="bg-primary text-primary-foreground rounded-md p-1">
                        <LayoutDashboard className="h-5 w-5" />
                    </span>
                    نظام التصحيح - الإدارة
                </div>
            </SidebarHeader>

            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>القائمة الرئيسية</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {adminItems.map((item) => {
                                const isActive = location.pathname === item.url;

                                return (
                                    <SidebarMenuItem key={item.title}>
                                        <SidebarMenuButton asChild isActive={isActive} tooltip={item.title}>
                                            <Link to={item.url}>
                                                <item.icon />
                                                <span>{item.title}</span>
                                            </Link>
                                        </SidebarMenuButton>
                                    </SidebarMenuItem>
                                );
                            })}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>

                <SidebarGroup className="mt-auto pt-4 border-t">
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <SidebarMenuItem>
                                <SidebarMenuButton
                                    onClick={() => logout()}
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/50"
                                >
                                    <LogOut />
                                    <span>تسجيل الخروج</span>
                                </SidebarMenuButton>
                            </SidebarMenuItem>
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
        </Sidebar>
    );
}
