import { Link, useParams } from "react-router-dom";

import { useProfileDetailQuery } from "@/hooks/useProfileQuery";
import { resolveAvatarUrl, type Profile } from "@/lib/api/profile";
import { toApiError } from "@/lib/api/client";

function ViewProfilePage() {
  const { userId } = useParams();
  const {
    data: profile,
    isLoading,
    error
  } = useProfileDetailQuery(userId);

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Loading profile…
      </section>
    );
  }

  if (error) {
    const apiError = toApiError(error);
    const status = apiError.status ?? 0;
    const message = apiError.message;
    const isUnauthorized = status === 401 || status === 403;
    const isNotFound = status === 404;

    return (
      <section className="flex flex-col gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        <h1 className="text-2xl font-semibold text-white">{isUnauthorized ? "Profile Hidden" : isNotFound ? "Profile Not Found" : "Unable to load profile"}</h1>
        <p className="text-sm text-slate-400">
          {isUnauthorized
            ? "This member has restricted their profile. Try connecting directly or request access from an admin."
            : isNotFound
            ? "We couldn’t find a profile for that member. Double-check the link or ask the member to share it again."
            : message}
        </p>
        <div className="flex justify-center gap-3">
          <Link to="/" className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white">
            Back to home
          </Link>
          <Link to="/profile" className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-brand-foreground shadow hover:bg-indigo-500">
            My profile
          </Link>
        </div>
      </section>
    );
  }

  if (!profile) {
    return null;
  }

  const currentProfile = profile as Profile;
  const avatarUrl = resolveAvatarUrl(currentProfile.avatar_path);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">
            {currentProfile.first_name} {currentProfile.last_name}
          </h1>
          <p className="mt-1 text-sm text-slate-400">Member profile visibility: {currentProfile.privacy_level ?? "private"}</p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
        >
          View my profile
        </Link>
      </header>

      <div className="grid gap-6 md:grid-cols-[240px_1fr]">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">
            {avatarUrl ? (
              <img src={avatarUrl} alt={`${currentProfile.first_name} avatar`} className="h-full w-full object-cover" />
            ) : (
              <span className="text-4xl font-semibold text-slate-500">
                {(currentProfile.first_name?.[0] ?? "") + (currentProfile.last_name?.[0] ?? "") || "?"}
              </span>
            )}
          </div>
          <p className="text-sm text-slate-400">{currentProfile.email}</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Bio</span>
            <span className="text-sm text-slate-100">{currentProfile.bio || "This member hasn’t added a bio yet."}</span>
          </div>
          <div className="flex flex-col gap-1 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Location</span>
            <span className="text-sm text-slate-100">{currentProfile.location || "—"}</span>
          </div>
          <div className="md:col-span-2 flex flex-col gap-2 rounded-xl border border-slate-800 bg-slate-900/60 p-4">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Interests</span>
            {currentProfile.interests && currentProfile.interests.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {currentProfile.interests.map((interest: string) => (
                  <span key={interest} className="rounded-full bg-slate-800 px-3 py-1 text-xs text-slate-200">
                    {interest}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-400">No interests shared yet.</span>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default ViewProfilePage;
