import { FormEvent } from "react";

import {
  useProfileQuery,
  useUpdatePreferencesMutation,
  useUpdatePrivacyMutation
} from "@/hooks/useProfileQuery";
import { TerraAlert, TerraCard, TerraLedgerSection, TerraToggle, terraButtonClass } from "@/components/ui/terra";
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
    <section className="flex flex-col gap-10">
      <header className="space-y-3">
        <h1 className="font-heading text-display-xl text-ink-900">Privacy & Notifications</h1>
        <p className="text-body-lg text-ink-600">
          Decide who sees your profile, and fine-tune how the Community App keeps your team informed.
        </p>
      </header>

      {mutationError ? (
        <TerraAlert tone="danger" title="Action required">
          {mutationError}
        </TerraAlert>
      ) : null}

      <TerraCard title="Profile visibility" eyebrow={<span className="terra-badge">Access control</span>}>
        <p className="text-body-sm text-ink-600">
          Choose who can view your profile details. Changes apply immediately.
        </p>
        <div className="grid gap-4 md:grid-cols-3">
          {PRIVACY_OPTIONS.map((option) => (
            <label
              key={option.value}
              className={[
                "flex cursor-pointer flex-col gap-3 rounded-2xl border p-5 transition",
                currentPrivacy === option.value
                  ? "border-[rgba(180,106,85,0.7)] bg-[rgba(180,106,85,0.08)]"
                  : "border-[rgba(46,59,69,0.12)] bg-surface-raised hover:border-[rgba(46,59,69,0.25)]"
              ].join(" ")}
            >
              <div className="flex items-start gap-3">
                <span className="mt-1 h-4 w-4 rounded-full border border-[rgba(46,59,69,0.3)]">
                  <span
                    className={[
                      "block h-full w-full rounded-full",
                      currentPrivacy === option.value ? "bg-[rgba(180,106,85,0.9)]" : "bg-transparent"
                    ].join(" ")}
                  />
                </span>
                <div className="space-y-1">
                  <p className="font-heading text-display-md text-ink-900">{option.label}</p>
                  <p className="text-body-sm text-ink-500">{option.description}</p>
                </div>
              </div>
              <input
                type="radio"
                name="privacy-level"
                value={option.value}
                checked={currentPrivacy === option.value}
                onChange={handlePrivacyChange}
                className="sr-only"
              />
            </label>
          ))}
        </div>
      </TerraCard>

      <TerraLedgerSection
        title="Notification preferences"
        description="Toggle the types of updates you want to receive from the Community App."
      >
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
                className="flex flex-col gap-3 rounded-2xl border border-[rgba(46,59,69,0.14)] bg-surface-raised p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-heading text-display-md text-ink-900">{title}</p>
                  <p className="text-body-sm text-ink-500">{description}</p>
                </div>
                <TerraToggle
                  pressed={enabled}
                  onPressedChange={() => handleToggle(key)}
                  disabled={isToggling}
                  label={`${enabled ? "Disable" : "Enable"} ${title}`}
                />
              </div>
            );
          })}
        </div>
      </TerraLedgerSection>

      <div className="flex justify-end">
        <button type="button" className={terraButtonClass("ghost")}>
          Restore defaults
        </button>
      </div>
    </section>
  );
}

export default SettingsPage;
