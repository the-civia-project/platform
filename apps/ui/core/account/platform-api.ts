import Constants from "expo-constants";
import { Platform } from "react-native";

const DEFAULT_PLATFORM_API_URL = "http://platform.localhost:3001";

export function getPlatformApiUrl(): string {
  const fromExtra = Constants.expoConfig?.extra?.platformApiUrl;
  if (typeof fromExtra === "string" && fromExtra.length > 0) {
    return fromExtra.replace(/\/$/, "");
  }
  return DEFAULT_PLATFORM_API_URL;
}

export type PlatformUser = {
  user_id: string;
  citizen_of: number[];
  tag_label: string;
  tag_discriminator: number;
  handle: string | null;
  name: string | null;
  location: string | null;
  avatar_key: string | null;
  avatar_url: string | null;
};

export type RegisterPlatformUserInput = {
  handle: string;
  location: string | null;
  avatar_key: string | null;
};

type RegisterResponse = {
  message: string;
  user_id: string;
  user?: PlatformUser;
};

type AvatarUploadResponse = {
  avatar_key: string;
  avatar_url: string;
};

export type LocalImageUpload = {
  uri: string;
  name: string;
  type: string;
};

async function authFetch(
  path: string,
  getToken: () => Promise<string | null>,
  init?: RequestInit,
): Promise<Response> {
  const token = await getToken();
  if (!token) {
    throw new Error("No Clerk session token");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    ...(init?.headers as Record<string, string> | undefined),
  };

  const hasBody =
    init?.body != null &&
    !(typeof init.body === "string" && init.body.length === 0);

  if (!(init?.body instanceof FormData) && hasBody) {
    headers["Content-Type"] = "application/json";
  }

  return fetch(`${getPlatformApiUrl()}${path}`, {
    ...init,
    headers: {
      ...headers,
      ...init?.headers,
    },
  });
}

type MeResponse = {
  user: PlatformUser | null;
};

export async function fetchPlatformMe(
  getToken: () => Promise<string | null>,
): Promise<PlatformUser | null> {
  const res = await authFetch("/me", getToken, { method: "GET" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GET /me failed: ${res.status} ${text}`);
  }
  const json = (await res.json()) as MeResponse;
  return json.user;
}

async function appendAvatarToFormData(
  form: FormData,
  file: LocalImageUpload,
): Promise<void> {
  if (Platform.OS === "web") {
    const response = await fetch(file.uri);
    if (!response.ok) {
      throw new Error("Could not read the selected image for upload.");
    }
    const blob = await response.blob();
    form.append("file", blob, file.name);
    return;
  }

  form.append("file", {
    uri: file.uri,
    name: file.name,
    type: file.type,
  } as unknown as Blob);
}

export async function uploadAccountAvatar(
  getToken: () => Promise<string | null>,
  file: LocalImageUpload,
): Promise<AvatarUploadResponse> {
  const form = new FormData();
  await appendAvatarToFormData(form, file);

  const res = await authFetch("/account/avatar", getToken, {
    method: "POST",
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /account/avatar failed: ${res.status} ${text}`);
  }

  return (await res.json()) as AvatarUploadResponse;
}

export async function registerPlatformUser(
  getToken: () => Promise<string | null>,
  input: RegisterPlatformUserInput,
): Promise<PlatformUser> {
  const res = await authFetch("/register", getToken, {
    method: "POST",
    body: JSON.stringify({
      handle: input.handle,
      location: input.location,
      avatar_key: input.avatar_key,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`POST /register failed: ${res.status} ${text}`);
  }

  const json = (await res.json()) as RegisterResponse;
  if (json.user) {
    return json.user;
  }

  return {
    user_id: json.user_id,
    citizen_of: [],
    tag_label: "",
    tag_discriminator: 0,
    handle: input.handle,
    name: null,
    location: input.location,
    avatar_key: input.avatar_key,
    avatar_url: null,
  };
}

export async function deletePlatformAccount(
  getToken: () => Promise<string | null>,
): Promise<void> {
  const res = await authFetch("/account", getToken, { method: "DELETE" });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`DELETE /account failed: ${res.status} ${text}`);
  }
}
