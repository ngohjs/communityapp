import { Link } from "react-router-dom";

import { TerraAlert, TerraCard, TerraLedgerSection, terraButtonClass } from "@/components/ui/terra";
import { useProfileQuery } from "@/hooks/useProfileQuery";
import { resolveAvatarUrl } from "@/lib/api/profile";

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="rounded-2xl border border-[rgba(46,59,69,0.12)] bg-surface-raised p-5 shadow-sm">
      <span className="terra-field-label">{label}</span>
      <p className="mt-2 text-body-sm text-ink-700">{value || "—"}</p>
    </div>
  );
}

function ProfilePage() {
  const { profile, isLoading, errorMessage } = useProfileQuery();

  if (isLoading) {
    return <TerraCard title="Loading">Loading your profile…</TerraCard>;
  }

  if (errorMessage) {
    return (
      <TerraAlert tone="danger" title="Unable to fetch profile">
        {errorMessage}
      </TerraAlert>
    );
  }

  if (!profile) {
    return <TerraAlert tone="warning">Profile data is not available.</TerraAlert>;
  }

  const avatarUrl = resolveAvatarUrl(profile.avatar_path);
  const notifyContent = profile.notify_content ?? true;
  const notifyCommunity = profile.notify_community ?? true;
  const notifyAccount = profile.notify_account ?? true;

  return (
    <section className="flex flex-col gap-10">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-heading text-display-xl text-ink-900">My Profile</h1>
          <p className="mt-2 text-body-lg text-ink-600">Review your details and ensure everything is up to date.</p>
        </div>
        <Link to="/profile/edit" className={terraButtonClass("primary")}>
          Edit profile
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-[280px_1fr]">
        <TerraCard title={`${profile.first_name} ${profile.last_name}`}>
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-[rgba(46,59,69,0.16)] bg-[rgba(46,59,69,0.08)]">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${profile.first_name} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-heading text-ink-500">
                  {(profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "") || "?"}
                </span>
              )}
            </div>
            <p className="text-body-sm text-ink-500">{profile.email}</p>
            <Link to="/profile/edit" className={terraButtonClass("ghost") + " text-xs px-4 py-2"}>
              Update avatar
            </Link>
          </div>
        </TerraCard>

        <div className="flex flex-col gap-6">
          <TerraCard
            title="Visibility"
            eyebrow={<span className="terra-badge">Access control</span>}
            action={<Link to="/profile/settings" className={terraButtonClass("ghost") + " text-xs px-4 py-2"}>Manage</Link>}
          >
            <p className="text-body-sm text-ink-600">
              {profile.privacy_level ? profile.privacy_level.replace(/^\w/, (c) => c.toUpperCase()) : "Private"}
            </p>
            <p className="text-body-sm text-ink-500">
              Adjust who can view your profile and update notification preferences from the settings page.
            </p>
          </TerraCard>

          <TerraLedgerSection title="Notification status">
            <div className="grid gap-3 sm:grid-cols-3">
              <StatusPill label="Content" enabled={notifyContent} />
              <StatusPill label="Community" enabled={notifyCommunity} />
              <StatusPill label="Account" enabled={notifyAccount} />
            </div>
          </TerraLedgerSection>
        </div>
      </div>

      <TerraLedgerSection title="Profile details">
        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="First name" value={profile.first_name} />
          <DetailRow label="Last name" value={profile.last_name} />
          <DetailRow label="Phone" value={profile.phone} />
          <DetailRow label="Location" value={profile.location} />
          <div className="md:col-span-2 space-y-2">
            <span className="terra-field-label">Bio</span>
            <TerraCard title="">
              <p className="text-body-sm text-ink-700">{profile.bio || "Introduce yourself."}</p>
            </TerraCard>
          </div>
          <div className="md:col-span-2 space-y-2">
            <span className="terra-field-label">Interests</span>
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full border border-[rgba(46,59,69,0.14)] bg-[rgba(46,59,69,0.1)] px-3 py-1 text-xs font-semibold text-ink-600"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-body-sm text-ink-600">Add topics you care about to help tailor recommendations.</p>
            )}
          </div>
        </div>
      </TerraLedgerSection>
    </section>
  );
}

function StatusPill({ label, enabled }: { label: string; enabled: boolean }) {
  return (
    <span
      className={[
        "inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold",
        enabled ? "bg-[rgba(106,169,127,0.15)] text-accent-verdant" : "bg-[rgba(46,59,69,0.08)] text-ink-400"
      ].join(" ")}
    >
      {label}: {enabled ? "On" : "Off"}
    </span>
  );
}

export default ProfilePage;
