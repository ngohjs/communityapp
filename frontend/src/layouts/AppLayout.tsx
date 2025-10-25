import { NavLink, Outlet } from "react-router-dom";

import { useAuth } from "@/providers/AuthProvider";

const linkClassName = ({ isActive }: { isActive: boolean }) =>
  [
    "rounded-full px-4 py-2 text-sm font-medium transition duration-200 ease-terra",
    isActive
      ? "bg-brand text-brand-foreground shadow-ledger"
      : "text-ink-500 hover:text-ink-900 hover:bg-surface-subtle"
  ].join(" ");

function AppLayout() {
  const { user, isAuthenticated } = useAuth();
  const primaryLinks = [
    { to: "/", label: "Home" },
    { to: "/content", label: "Content" },
    { to: "/profile", label: "My Profile" },
    { to: "/admin/content", label: "Admin Content" },
    { to: "/admin/audit", label: "Audit Logs" },
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
    <div className="min-h-screen bg-surface-canvas text-ink-900">
      <header className="sticky top-0 z-40 border-b border-[rgba(46,59,69,0.12)] bg-surface-raised/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-5">
          <NavLink to="/" className="inline-flex items-center gap-3">
            <span className="h-3 w-12 rounded-full bg-gradient-to-r from-accent-verdant/80 to-brand" />
            <span className="text-xl font-heading text-ink-900 tracking-tight">Community App</span>
          </NavLink>

          <nav className="hidden items-center gap-3 md:flex">
            {primaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className={linkClassName}>
                {link.label}
              </NavLink>
            ))}

            <div className="ml-6 flex items-center gap-2 text-sm text-ink-500">
              {isAuthenticated ? (
                <>
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[rgba(106,169,127,0.18)] font-heading text-accent-verdant">
                    {user?.first_name?.[0] ?? "U"}
                  </span>
                  <span className="font-medium text-ink-900">
                    {user?.first_name} {user?.last_name}
                  </span>
                </>
              ) : (
                <span className="text-ink-300">Guest</span>
              )}
            </div>
          </nav>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-8 py-14">
        <Outlet />
      </main>

      <footer className="border-t border-[rgba(46,59,69,0.12)] bg-surface-raised/90">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-8 py-6 text-sm text-ink-500">
          <p className="font-medium">&copy; {new Date().getFullYear()} Community App. Built for trusted enablement.</p>
          <div className="flex flex-wrap gap-3">
            {secondaryLinks.map((link) => (
              <NavLink key={link.to} to={link.to} className="text-ink-500 transition hover:text-ink-900">
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
