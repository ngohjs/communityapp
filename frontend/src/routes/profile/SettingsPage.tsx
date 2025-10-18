import { FormEvent } from "react";

import {
  useProfileQuery,
  useUpdatePreferencesMutation,
  useUpdatePrivacyMutation
} from "@/hooks/useProfileQuery";
import { PrivacyLevel } from "@/lib/api/profile";
import { toApiError } from "@/lib/api/client";

const PRIVACY_OPTIONS: Array<{
  value: PrivacyLevel;
  label: string;
  description: string;
}> = [
  {
    value: "private",
    label: "Private",
    description: "Only you and admins can view your profile information."
  },
  {
    value: "community",
    label: "Community",
    description: "Verified members can see your profile while non-members cannot."
  },
  {
    value: "admin",
    label: "Admin-only",
    description: "Only administrators can view your profile details."
  }
];

type PreferenceKey = "notify_content" | "notify_community" | "notify_account";

const PREFERENCE_LABELS: Record<PreferenceKey, { title: string; description: string }> = {
  notify_content: {
    title: "Content Updates",
    description: "Get notified when new content or resources are published."
  },
  notify_community: {
    title: "Community Activity",
    description: "Receive updates about comments, likes, and community events."
  },
  notify_account: {
    title: "Account & Security",
    description: "Be alerted about logins, password changes, and security notices."
  }
};

function SettingsPage() {
  const { profile, isLoading, errorMessage } = useProfileQuery();
  const privacyMutation = useUpdatePrivacyMutation();
  const preferencesMutation = useUpdatePreferencesMutation();

  const currentPrivacy = (profile?.privacy_level as PrivacyLevel | null) ?? "private";
  const rawMutationError = privacyMutation.error ?? preferencesMutation.error;
  const mutationError = rawMutationError ? toApiError(rawMutationError).message : null;

  const handlePrivacyChange = (event: FormEvent<HTMLInputElement>) => {
    const nextValue = event.currentTarget.value as PrivacyLevel;
    if (profile && nextValue !== profile.privacy_level) {
      privacyMutation.mutate({ privacy_level: nextValue });
    }
  };

  const handleToggle = (key: PreferenceKey) => {
    if (!profile) {
      return;
    }
    const current = profile[key] ?? true;
    preferencesMutation.mutate({ [key]: !current });
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Loading settings…
      </section>
    );
  }

  if (errorMessage || !profile) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-sm text-red-200">
        {errorMessage ?? "Unable to load profile settings."}
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-8">
      <header>
        <h1 className="text-3xl font-semibold text-white">Privacy & Notifications</h1>
        <p className="mt-2 text-sm text-slate-400">
          Control who can view your profile and manage how the Community App reaches out to you.
        </p>
      </header>

      {mutationError ? (
        <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {mutationError}
        </p>
      ) : null}

      <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header>
          <h2 className="text-xl font-semibold text-white">Profile Visibility</h2>
          <p className="mt-1 text-sm text-slate-400">
            Choose who can see your profile details. Changes apply immediately.
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          {PRIVACY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex cursor-pointer flex-col gap-2 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-600 focus-within:border-brand"
            >
              <div className="flex items-start gap-3">
                <input
                  type="radio"
                  name="privacy-level"
                  value={option.value}
                  checked={currentPrivacy === option.value}
                  onChange={handlePrivacyChange}
                  className="mt-1 h-4 w-4 cursor-pointer accent-brand"
                />
                <div>
                  <p className="text-sm font-semibold text-white">{option.label}</p>
                  <p className="mt-1 text-xs text-slate-400">{option.description}</p>
                </div>
              </div>
            </label>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
        <header>
          <h2 className="text-xl font-semibold text-white">Notification Preferences</h2>
          <p className="mt-1 text-sm text-slate-400">
            Toggle the types of updates you want to receive from the Community App.
          </p>
        </header>

        <div className="space-y-4">
          {(Object.keys(PREFERENCE_LABELS) as PreferenceKey[]).map((key) => {
            const { title, description } = PREFERENCE_LABELS[key];
            const enabled = profile[key] ?? true;
            const pendingVariables = preferencesMutation.variables ?? null;
            const isToggling =
              preferencesMutation.isPending && !!pendingVariables && pendingVariables[key] !== undefined;
            return (
              <div
                key={key}
                className="flex flex-col gap-3 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-slate-600 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-400">{description}</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleToggle(key)}
                  disabled={isToggling}
                  className={[
                    "relative inline-flex h-8 w-16 items-center rounded-full border transition",
                    enabled
                      ? "border-brand bg-brand/80"
                      : "border-slate-700 bg-slate-800",
                    isToggling ? "opacity-70" : ""
                  ].join(" ")}
                  aria-pressed={enabled}
                >
                  <span
                    className={[
                      "mx-1 inline-block h-6 w-6 transform rounded-full bg-white transition",
                      enabled ? "translate-x-8" : "translate-x-0"
                    ].join(" ")}
                  />
                  <span className="sr-only">{enabled ? "Disable" : "Enable"} {title}</span>
                </button>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}

export default SettingsPage;
