import { Link } from "react-router-dom";

import { useProfileQuery } from "@/hooks/useProfileQuery";
import { resolveAvatarUrl } from "@/lib/api/profile";

function DetailRow({
  label,
  value
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</span>
      <span className="text-sm text-slate-100">{value || "—"}</span>
    </div>
  );
}

function ProfilePage() {
  const { profile, isLoading, errorMessage } = useProfileQuery();

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Loading your profile…
      </section>
    );
  }

  if (errorMessage) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-sm text-red-200">
        {errorMessage}
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Profile data is not available.
      </section>
    );
  }

  const avatarUrl = resolveAvatarUrl(profile.avatar_path);
  const notifyContent = profile.notify_content ?? true;
  const notifyCommunity = profile.notify_community ?? true;
  const notifyAccount = profile.notify_account ?? true;

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">My Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            Review your details and ensure everything is up to date.
          </p>
        </div>
        <Link
          to="/profile/edit"
          className="inline-flex items-center rounded-lg bg-brand px-5 py-2 text-sm font-semibold text-brand-foreground shadow hover:bg-indigo-500"
        >
          Edit profile
        </Link>
      </header>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Visibility</span>
            <Link to="/profile/settings" className="text-xs font-semibold text-brand hover:text-indigo-300">
              Manage
            </Link>
          </div>
          <p className="text-sm font-semibold text-white">
            {profile.privacy_level ? profile.privacy_level.replace(/^\w/, (c) => c.toUpperCase()) : "Private"}
          </p>
          <p className="text-xs text-slate-400">
            Adjust who can view your profile and update notification preferences from the settings page.
          </p>
        </div>

        <div className="flex flex-col gap-2 rounded-3xl border border-slate-800 bg-slate-900/60 p-5">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Notifications</span>
          <div className="grid grid-cols-3 gap-2 text-xs text-slate-300">
            <span className={notifyContent ? "text-emerald-300" : "text-slate-500"}>
              Content: {notifyContent ? "On" : "Off"}
            </span>
            <span className={notifyCommunity ? "text-emerald-300" : "text-slate-500"}>
              Community: {notifyCommunity ? "On" : "Off"}
            </span>
            <span className={notifyAccount ? "text-emerald-300" : "text-slate-500"}>
              Account: {notifyAccount ? "On" : "Off"}
            </span>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${profile.first_name} avatar`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold text-slate-500">
                {(profile.first_name?.[0] ?? "") + (profile.last_name?.[0] ?? "") || "?"}
              </span>
            )}
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-white">
              {profile.first_name} {profile.last_name}
            </p>
            <p className="text-sm text-slate-400">{profile.email}</p>
          </div>
          <Link
            to="/profile/edit"
            className="rounded-md border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-slate-300 hover:border-slate-500 hover:text-white"
          >
            Update avatar
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <DetailRow label="First name" value={profile.first_name} />
          <DetailRow label="Last name" value={profile.last_name} />
          <DetailRow label="Phone" value={profile.phone} />
          <DetailRow label="Location" value={profile.location} />

          <div className="md:col-span-2 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bio</span>
            <p className="text-sm leading-relaxed text-slate-100">{profile.bio || "Introduce yourself."}</p>
          </div>

          <div className="md:col-span-2 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-5">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interests</span>
            {profile.interests && profile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {profile.interests.map((interest) => (
                  <span key={interest} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Add topics you care about to help tailor recommendations.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ProfilePage;
