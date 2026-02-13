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

// ✅ استيراد صفحة الكاميرا باستخدام Lazy Loading
const CameraScan = lazy(() => import("@/pages/grading/CameraScan"));

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
    path: "/privacy",
    element: <Privacy />,
  },
  {
    path: "/terms",
    element: <Terms />,
  },
  {
    path: "/camera-scan",
    element: <CameraScan />, // ✅ مسار الكاميرا
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