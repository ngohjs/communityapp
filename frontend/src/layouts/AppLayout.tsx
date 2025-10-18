import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/providers/AuthProvider";

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-md px-3 py-2 text-sm font-semibold transition-colors",
    isActive ? "bg-brand text-brand-foreground shadow" : "text-slate-300 hover:text-white"
  ].join(" ");

function AppLayout() {
  const { user, isAuthenticated } = useAuth();
  const primaryLinks = [
    { to: "/", label: "Home" },
    { to: "/content", label: "Content" },
    { to: "/profile", label: "My Profile" },
    { to: "/admin/content", label: "Admin" },
    ...(isAuthenticated
      ? [{ to: "/profile/settings", label: "Settings" }]
      : []),
    ...(!isAuthenticated
      ? [
          { to: "/auth/login", label: "Login" },
          { to: "/auth/register", label: "Register" }
        ]
      : [])
  ];
  const secondaryLinks = [
    { to: "/auth/verify-email", label: "Verify Email" },
    { to: "/auth/forgot-password", label: "Forgot Password" },
    { to: "/auth/reset-password", label: "Reset Password" },
    ...(isAuthenticated ? [{ to: "/auth/logout", label: "Logout" }] : [])
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <header className="border-b border-slate-800 bg-slate-950/70 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
          <NavLink to="/" className="inline-flex items-center gap-2">
            <span className="h-3 w-3 rounded-full bg-brand shadow shadow-brand/50" />
            <span className="text-lg font-semibold tracking-tight text-white">Community App</span>
          </NavLink>

          <nav className="hidden items-center gap-2 md:flex">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClassName}>
                {link.label}
              </NavLink>
            ))}

            <div className="ml-6 flex items-center gap-2 text-sm text-slate-300">
              {isAuthenticated ? (
                <>
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-brand/20 text-brand">
                    {user?.first_name?.[0] ?? "U"}
                  </span>
                  <span className="font-medium text-white">
                    {user?.first_name} {user?.last_name}
                  </span>
                </>
              ) : (
                <span className="text-slate-500">Guest</span>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-6 px-6 py-10">
        <Outlet />
      </main>

      <footer className="border-t border-slate-800 bg-slate-950/70">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-6 py-4 text-sm text-slate-400">
          <p>&copy; {new Date().getFullYear()} Community App. All rights reserved.</p>
          <div className="flex flex-wrap gap-2">
            {secondaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="text-slate-400 hover:text-slate-200">
                {link.label}
              </NavLink>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default AppLayout;
