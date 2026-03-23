import { useCallback } from "react";
import { useImagePicker } from "../composer/use-image-picker";
import { uploadAccountAvatar } from "./platform-api";

export function useAvatarUpload(
  getToken: () => Promise<string | null>,
) {
  const { pickPictures } = useImagePicker();

  const pickAndUploadAvatar = useCallback(async () => {
    const picked = await pickPictures(1);
    if (picked.length === 0) {
      return null;
    }

    const image = picked[0]!;
    const uploaded = await uploadAccountAvatar(getToken, {
      uri: image.source,
      name: "avatar.jpg",
      type: "image/jpeg",
    });

    return {
      localAvatarUri: image.source,
      avatarKey: uploaded.avatar_key,
      avatarUrl: uploaded.avatar_url,
    };
  }, [getToken, pickPictures]);

  return { pickAndUploadAvatar };
}
