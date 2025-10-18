import { createBrowserRouter } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import HomePage from "./routes/HomePage";
import NotFoundPage from "./routes/NotFoundPage";
import ForgotPasswordPage from "./routes/auth/ForgotPasswordPage";
import LoginPage from "./routes/auth/LoginPage";
import LogoutPage from "./routes/auth/LogoutPage";
import RegisterPage from "./routes/auth/RegisterPage";
import ResetPasswordPage from "./routes/auth/ResetPasswordPage";
import VerifyEmailPage from "./routes/auth/VerifyEmailPage";
import ProfilePage from "./routes/profile/ProfilePage";
import EditProfilePage from "./routes/profile/EditProfilePage";
import SettingsPage from "./routes/profile/SettingsPage";
import ViewProfilePage from "./routes/profile/ViewProfilePage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <HomePage />
      },
      {
        path: "auth/login",
        element: <LoginPage />
      },
      {
        path: "auth/register",
        element: <RegisterPage />
      },
      {
        path: "auth/verify-email",
        element: <VerifyEmailPage />
      },
      {
        path: "auth/forgot-password",
        element: <ForgotPasswordPage />
      },
      {
        path: "auth/reset-password",
        element: <ResetPasswordPage />
      },
      {
        path: "auth/logout",
        element: <LogoutPage />
      },
      {
        path: "profile",
        element: <ProfilePage />
      },
      {
        path: "profile/edit",
        element: <EditProfilePage />
      },
      {
        path: "profile/settings",
        element: <SettingsPage />
      },
      {
        path: "profile/:userId",
        element: <ViewProfilePage />
      },
      {
        path: "*",
        element: <NotFoundPage />
      }
    ]
  }
]);
