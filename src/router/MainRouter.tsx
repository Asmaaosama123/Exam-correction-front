import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword from "@/pages/auth/ResetPassword";
import VerifyEmail from "@/pages/auth/VerifyEmail";
// import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Classes from "@/pages/Classes";
import Reports from "@/pages/Reports";
import { Routes, Route } from "react-router-dom";
import Privacy from "@/pages/terms/Privacy";
import Terms from "@/pages/terms/Terms";
import { AuthGuard } from "@/components/auth/AuthGuard";
import UnderConstructions from "@/components/layout/UnderConstructions";

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
    path: "/forgot-password",
    element: <ForgotPassword />,
  },
  {
    path: "/reset-password",
    element: <ResetPassword />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmail />,
  },
  {
    path: "/dashboard",
    element: (
      <AuthGuard>
        {/* <Dashboard /> */}
        <UnderConstructions />
      </AuthGuard>
    ),
  },
  {
    path: "/exams",
    element: (
      <AuthGuard>
        {/* <Dashboard /> */}
        <UnderConstructions />
      </AuthGuard>
    ),
  },
  {
    path: "/submissions",
    element: (
      <AuthGuard>
        {/* <Dashboard /> */}
        <UnderConstructions />
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
    path: "*",
    element: <NotFound />,
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
