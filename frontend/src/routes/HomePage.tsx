import { Link } from "react-router-dom";

import { TerraBadge, TerraCard, TerraKPI, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";
import { useAuth } from "@/providers/AuthProvider";

function HomePage() {
  const { user, isAuthenticated } = useAuth();

  const quickLinks = [
    { label: "My Profile", to: "/profile" },
    { label: "Browse Content", to: "/content" },
    { label: "Settings", to: "/profile/settings" },
    { label: "Login", to: "/auth/login" },
    { label: "Register", to: "/auth/register" },
    { label: "Forgot Password", to: "/auth/forgot-password" },
    { label: "Verify Email", to: "/auth/verify-email" },
    { label: "Logout", to: "/auth/logout" }
  ];

  return (
    <div className="flex flex-col gap-10">
      <TerraCard
        eyebrow={<TerraBadge tone="success">Strategy Hub</TerraBadge>}
        title={isAuthenticated ? `Welcome back, ${user?.first_name}!` : "Community App"}
        action={!isAuthenticated ? <Link to="/auth/register" className={terraButtonClass("primary")}>Join the beta</Link> : null}
      >
        <div className="space-y-4 text-body-lg text-ink-700">
          <p>
            Share playbooks, inspect audit trails, and keep your enablement assets in one trusted workspace.
            Terra Trust delivers an enterprise-grade presentation with the agility your field teams expect.
          </p>
          <p className="text-body-sm text-ink-500">
            The content library features advanced filters, signed downloads, and audit-ready reporting so every
            interaction is accountable.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <TerraLedgerSection title="Engagement" description="Live insights from the closed beta">
            <div className="grid gap-6">
              <TerraKPI label="Active members" value={128} />
              <TerraKPI label="Downloads this week" value={342} />
            </div>
          </TerraLedgerSection>
          <TerraLedgerSection title="Content velocity" description="Most-utilised actions this quarter">
            <ul className="space-y-3 text-body-sm text-ink-600">
              <li className="flex items-center justify-between">
                <span>Sales playbooks uploaded</span>
                <span className="font-semibold text-ink-900">27</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Audit log entries</span>
                <span className="font-semibold text-ink-900">1,984</span>
              </li>
              <li className="flex items-center justify-between">
                <span>Notifications opted-in</span>
                <span className="font-semibold text-accent-verdant">86%</span>
              </li>
            </ul>
          </TerraLedgerSection>
          <TerraLedgerSection title="Admin focus" description="Stay ahead with quick actions">
            <div className="flex flex-col gap-3">
              <Link to="/admin/content" className={terraButtonClass("primary")}>
                Upload new content
              </Link>
              <Link to="/admin/audit" className={terraButtonClass("ghost")}>
                Review audit feed
              </Link>
            </div>
          </TerraLedgerSection>
        </div>
      </TerraCard>

      <TerraLedgerSection
        title="Navigate quickly"
        description="Key destinations across authentication, profiles, and content"
      >
        <div className="flex flex-wrap gap-3">
          {quickLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={terraButtonClass(link.label === "Login" ? "primary" : "ghost")}
            >
              {link.label}
            </Link>
          ))}
        </div>
      </TerraLedgerSection>
    </div>
  );
}

export default HomePage;
