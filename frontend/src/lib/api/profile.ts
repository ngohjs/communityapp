import { apiClient } from "./client";

export type Profile = {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  bio: string | null;
  location: string | null;
  interests: string[] | null;
  avatar_path: string | null;
  last_completed_at: string | null;
  updated_at: string | null;
  privacy_level: string | null;
  notify_content: boolean | null;
  notify_community: boolean | null;
  notify_account: boolean | null;
};

export type ProfileUpdatePayload = {
  first_name?: string | null;
  last_name?: string | null;
  phone?: string | null;
  bio?: string | null;
  location?: string | null;
  interests?: string[] | null;
};

export type PrivacyLevel = "private" | "community" | "admin";

export type PrivacyUpdatePayload = {
  privacy_level: PrivacyLevel;
};

export type PreferencesUpdatePayload = {
  notify_content?: boolean | null;
  notify_community?: boolean | null;
  notify_account?: boolean | null;
};

export async function fetchMyProfile() {
  const { data } = await apiClient.get<Profile>("/profile/me");
  return data;
}

export async function updateMyProfile(payload: ProfileUpdatePayload) {
  const { data } = await apiClient.patch<Profile>("/profile/me", payload);
  return data;
}

export async function updatePrivacy(payload: PrivacyUpdatePayload) {
  const { data } = await apiClient.patch<Profile>("/profile/me/privacy", payload);
  return data;
}

export async function updatePreferences(payload: PreferencesUpdatePayload) {
  const { data } = await apiClient.patch<Profile>("/profile/me/preferences", payload);
  return data;
}

export async function fetchProfileById(userId: string) {
  const { data } = await apiClient.get<Profile>(`/profile/${userId}`);
  return data;
}

export function resolveAvatarUrl(avatarPath: string | null) {
  if (!avatarPath) {
    return null;
  }
  const base =
    import.meta.env.VITE_MEDIA_BASE_URL ??
    `${import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000"}/media/avatars`;
  return `${base.replace(/\/$/, "")}/${avatarPath}`;
}

export async function uploadAvatar(file: File) {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await apiClient.post<Profile>("/profile/me/avatar", formData, {
    headers: {
      "Content-Type": "multipart/form-data"
    }
  });
  return data;
}
