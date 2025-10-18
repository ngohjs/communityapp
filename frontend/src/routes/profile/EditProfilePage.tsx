import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  useProfileQuery,
  useUpdateProfileMutation,
  useUploadAvatarMutation
} from "@/hooks/useProfileQuery";
import { resolveAvatarUrl } from "@/lib/api/profile";
import { toApiError } from "@/lib/api/client";

type ProfileFormState = {
  first_name: string;
  last_name: string;
  phone: string;
  bio: string;
  location: string;
  interests: string;
};

type ValidationErrors = Partial<Record<keyof ProfileFormState | "avatar" | "form", string>>;

const PHONE_REGEX = /^\+?[1-9]\d{7,14}$/;

function getInitialState(): ProfileFormState {
  return {
    first_name: "",
    last_name: "",
    phone: "",
    bio: "",
    location: "",
    interests: ""
  };
}

function parseInterests(value: string) {
  if (!value.trim()) {
    return [];
  }
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function validate(values: ProfileFormState): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!values.first_name.trim()) {
    errors.first_name = "First name is required";
  }
  if (!values.last_name.trim()) {
    errors.last_name = "Last name is required";
  }
  if (values.phone && !PHONE_REGEX.test(values.phone)) {
    errors.phone = "Phone must be in E.164 format (+123456789)";
  }
  if (values.bio.length > 500) {
    errors.bio = "Bio must be 500 characters or less";
  }
  if (values.location.length > 255) {
    errors.location = "Location must be 255 characters or less";
  }
  const interests = parseInterests(values.interests);
  if (interests.some((interest) => interest.length > 64 || interest.length < 1)) {
    errors.interests = "Each interest must be between 1 and 64 characters";
  }
  return errors;
}

function EditProfilePage() {
  const navigate = useNavigate();
  const { profile, isLoading, errorMessage } = useProfileQuery();
  const updateProfile = useUpdateProfileMutation();
  const uploadAvatar = useUploadAvatarMutation();
  const [values, setValues] = useState<ProfileFormState>(getInitialState);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setValues({
        first_name: profile.first_name ?? "",
        last_name: profile.last_name ?? "",
        phone: profile.phone ?? "",
        bio: profile.bio ?? "",
        location: profile.location ?? "",
        interests: profile.interests?.join(", ") ?? ""
      });
      setAvatarPreview(resolveAvatarUrl(profile.avatar_path));
    }
  }, [profile]);

  useEffect(() => {
    setErrors((prev) => ({ ...prev, avatar: avatarError ?? undefined }));
  }, [avatarError]);

  const isSubmitting = updateProfile.isPending || uploadAvatar.isPending;

  const submitError = useMemo(() => {
    if (updateProfile.error) {
      return toApiError(updateProfile.error).message;
    }
    if (uploadAvatar.error) {
      return toApiError(uploadAvatar.error).message;
    }
    return null;
  }, [updateProfile.error, uploadAvatar.error]);

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrors((prev) => ({ ...prev, form: undefined }));
    const validation = validate(values);
    setErrors(validation);
    if (Object.keys(validation).length > 0) {
      return;
    }

    const payload = {
      first_name: values.first_name.trim(),
      last_name: values.last_name.trim(),
      phone: values.phone.trim() || null,
      bio: values.bio.trim() || null,
      location: values.location.trim() || null,
      interests: parseInterests(values.interests)
    };

    try {
      await updateProfile.mutateAsync(payload);
      navigate("/profile");
    } catch (error) {
      const apiError = toApiError(error);
      setErrors((prev) => ({ ...prev, form: apiError.message }));
    }
  };

  const handleAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    setAvatarError(null);
    if (!["image/png", "image/jpeg", "image/jpg"].includes(file.type)) {
      setAvatarError("Avatar must be a PNG or JPG image.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError("Avatar must be 5MB or smaller.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);

    try {
      await uploadAvatar.mutateAsync(file);
    } finally {
      URL.revokeObjectURL(previewUrl);
    }
  };

  if (isLoading) {
    return (
      <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-10 text-center text-sm text-slate-300">
        Loading profile details…
      </section>
    );
  }

  if (errorMessage || !profile) {
    return (
      <section className="rounded-3xl border border-red-500/30 bg-red-500/10 p-8 text-sm text-red-200">
        {errorMessage ?? "Unable to load profile data."}
      </section>
    );
  }

  const avatarUrl = avatarPreview ?? resolveAvatarUrl(profile.avatar_path);

  return (
    <section className="flex flex-col gap-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-white">Edit Profile</h1>
          <p className="mt-1 text-sm text-slate-400">
            Update your personal details. Changes are saved once you hit “Save profile”.
          </p>
        </div>
        <Link
          to="/profile"
          className="inline-flex items-center rounded-lg border border-slate-700 px-5 py-2 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
        >
          Cancel
        </Link>
      </header>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="flex flex-col gap-5 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="flex h-40 w-40 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">
              {avatarUrl ? (
                <img src={avatarUrl} alt={`${values.first_name} avatar`} className="h-full w-full object-cover" />
              ) : (
                <span className="text-4xl font-semibold text-slate-500">
                  {(values.first_name?.[0] ?? "") + (values.last_name?.[0] ?? "") || "?"}
                </span>
              )}
            </div>
          </div>
          <label className="flex flex-col gap-2 text-sm text-slate-300">
            <span>Upload new avatar</span>
            <input
              type="file"
              accept="image/png,image/jpeg"
              onChange={handleAvatarChange}
              className="block w-full text-sm text-slate-400 file:mr-4 file:rounded-md file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-brand-foreground hover:file:bg-indigo-500"
            />
            <span className="text-xs text-slate-500">PNG or JPG, max 5MB. Images are resized to 512x512.</span>
            {avatarError ? <span className="text-xs text-red-400">{avatarError}</span> : null}
          </label>
        </aside>

        <div className="space-y-6 rounded-3xl border border-slate-800 bg-slate-900/60 p-6">
          <div className="grid gap-5 md:grid-cols-2">
            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">First name</span>
              <input
                name="first_name"
                value={values.first_name}
                onChange={handleChange}
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
              {errors.first_name ? <span className="text-xs text-red-400">{errors.first_name}</span> : null}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">Last name</span>
              <input
                name="last_name"
                value={values.last_name}
                onChange={handleChange}
                required
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
              {errors.last_name ? <span className="text-xs text-red-400">{errors.last_name}</span> : null}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">Phone number</span>
              <input
                name="phone"
                value={values.phone}
                onChange={handleChange}
                placeholder="+1234567890"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
              {errors.phone ? <span className="text-xs text-red-400">{errors.phone}</span> : null}
            </label>

            <label className="flex flex-col gap-2 text-sm">
              <span className="text-slate-300">Location</span>
              <input
                name="location"
                value={values.location}
                onChange={handleChange}
                placeholder="City, Country"
                className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
              />
              {errors.location ? <span className="text-xs text-red-400">{errors.location}</span> : null}
            </label>
          </div>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Bio</span>
            <textarea
              name="bio"
              value={values.bio}
              onChange={handleChange}
              rows={4}
              placeholder="Tell the community about your role, goals, or expertise."
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{values.bio.length}/500</span>
              {errors.bio ? <span className="text-red-400">{errors.bio}</span> : null}
            </div>
          </label>

          <label className="flex flex-col gap-2 text-sm">
            <span className="text-slate-300">Interests</span>
            <input
              name="interests"
              value={values.interests}
              onChange={handleChange}
              placeholder="e.g. Sales Enablement, Customer Success"
              className="rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
            <span className="text-xs text-slate-500">
              Separate multiple interests with commas. They help tailor recommendations.
            </span>
            {errors.interests ? <span className="text-xs text-red-400">{errors.interests}</span> : null}
          </label>

          {submitError || errors.form ? (
            <p className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
              {errors.form ?? submitError}
            </p>
          ) : null}

          <div className="flex flex-col justify-end gap-3 pt-2 sm:flex-row">
            <Link
              to="/profile"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-200 hover:border-slate-500 hover:text-white"
            >
              Discard changes
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center rounded-lg bg-brand px-6 py-3 text-sm font-semibold text-brand-foreground shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isSubmitting ? "Saving…" : "Save profile"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
}

export default EditProfilePage;
