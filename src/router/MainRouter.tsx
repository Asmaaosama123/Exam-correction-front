import { lazy } from "react"; // ✅ استيراد lazy
import { Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Classes from "@/pages/Classes";
import Reports from "@/pages/Reports";
import Exams from "@/pages/Exams";
import NewExam from "@/pages/exams/NewExam";
import Privacy from "@/pages/terms/Privacy";
import Terms from "@/pages/terms/Terms";
import { AuthGuard } from "@/components/auth/AuthGuard";
import Grading from "@/pages/grading/Grading";
import ExamTemplateSetup from "@/pages/ExamTemplateSetup";
import Tutorial from "@/pages/Tutorial";
import Analysis from "@/pages/Analysis";
import Goals from "@/pages/Goals";
import StudentReport from "@/pages/StudentReport";

import AdminDashboard from "@/pages/admin/AdminDashboard";
import UserManagement from "@/pages/admin/UserManagement";
import ComplaintsList from "@/pages/admin/ComplaintsList";
import SystemLogs from "@/pages/admin/SystemLogs";
import ManageTutorials from "@/pages/admin/ManageTutorials";
import ManagePackages from "@/pages/admin/ManagePackages";
import SubscriptionRequests from "@/pages/admin/SubscriptionRequests";
import PlanSelector from "@/pages/teacher/PlanSelector";
import { RoleGuard } from "@/components/auth/RoleGuard";
import PaymentSuccess from "@/pages/payment/PaymentSuccess";

// ... [existing code for lazy import]
const CameraScan = lazy(() => import("@/pages/grading/CameraScan"));
const AITrainerDashboard = lazy(() => import("@/pages/ai-trainer/AITrainerDashboard"));

const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/admin",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <AdminDashboard />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/users",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <UserManagement />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/complaints",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <ComplaintsList />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/system-logs",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <SystemLogs />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/tutorials",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <ManageTutorials />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/packages",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <ManagePackages />
      </RoleGuard>
    ),
  },
  {
    path: "/admin/subscription-requests",
    element: (
      <RoleGuard allowedRoles={["Admin"]}>
        <SubscriptionRequests />
      </RoleGuard>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        <Dashboard />
      </AuthGuard>
    ),
  },
  {
    path: "/exams",
    element: (
      <AuthGuard>
        <Exams />
      </AuthGuard>
    ),
  },
  {
    path: "/exams/new",
    element: (
      <AuthGuard>
        <NewExam />
      </AuthGuard>
    ),
  },
  {
    path: "/grading",
    element: (
      <AuthGuard>
        <Grading />
      </AuthGuard>
    ),
  },
  {
    path: "/exam-template",
    element: (
      <AuthGuard>
        <ExamTemplateSetup />
      </AuthGuard>
    ),
  },
  {
    path: "/students",
    element: (
      <AuthGuard>
        <Students />
      </AuthGuard>
    ),
  },
  {
    path: "/classes",
    element: (
      <AuthGuard>
        <Classes />
      </AuthGuard>
    ),
  },
  {
    path: "/reports",
    element: (
      <AuthGuard>
        <Reports />
      </AuthGuard>
    ),
  },
  {
    path: "/reports/student-report",
    element: (
      <AuthGuard>
        <StudentReport />
      </AuthGuard>
    ),
  },
  {
    path: "/analysis",
    element: (
      <AuthGuard>
        <Analysis />
      </AuthGuard>
    ),
  },
  {
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/tutorial",
    element: (
      <AuthGuard>
        <Tutorial />
      </AuthGuard>
    ),
  },
  {
    path: "/subscriptions",
    element: (
      <AuthGuard>
        <PlanSelector />
      </AuthGuard>
    ),
  },
  {
    path: "/goals",
    element: <Goals />,
  },
  {
    path: "/camera-scan",
    element: <CameraScan />, // ✅ مسار الكاميرا
  },
  {
    path: "/payment-success",
    element: (
      <AuthGuard>
        <PaymentSuccess />
      </AuthGuard>
    ),
  },
  {
    path: "/ai-dashboard",
    element: (
      <RoleGuard allowedRoles={["AITrainer", "Admin"]}>
        <AITrainerDashboard />
      </RoleGuard>
    ),
  },
  {
    path: "*",
    element: <NotFound />, // ✅ مسار 404 واحد فقط
  },
];

export default function MainRouter() {
  return (
    <Routes>
      {routes.map((route) => (
        <Route key={route.path} path={route.path} element={route.element} />
      ))}
    </Routes>
  );
}