/**
 * Full-page post composer screen. Mounts the surface-agnostic
 * {@link "../components/PostComposer".PostComposer} as the screen's
 * root content inside a {@link "../components/Page".Page} shell, and
 * wires the composer's single attachment intent (`onAddPictures`)
 * plus the submit handler to the matching hooks in
 * `core/composer/*`. Link previews are auto-extracted from the body
 * text via {@link useDraftLinkExtraction} -- there is no manual
 * "attach link" affordance.
 *
 * Registered on the root stack in `App.tsx` as the `compose` route. The
 * composer's `onSubmit` calls the fake `useSubmitPost` hook, which
 * resolves after a 500ms simulated network delay and bubbles back via
 * the screen's `navigation.goBack()` once the submit succeeds.
 */
import { useUser } from "@clerk/expo";
import { useNavigation } from "@react-navigation/native";
import { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Page } from "../components/Page";
import {
  addPictures,
  emptyDraft,
  PostComposer,
  type PostDraft,
} from "../components/PostComposer";
import { Lede } from "../components/Typography";
import { useTheme } from "../components/use-theme";
import { usePlatformUser } from "../core/account/hooks";
import { platformUserToProfileProps } from "../core/account/platform-user-profile";
import { useDraftLinkExtraction } from "../core/composer/use-draft-link-extraction";
import { useImagePicker } from "../core/composer/use-image-picker";
import { useLinkResolver } from "../core/composer/use-link-resolver";
import { useSubmitPost } from "../core/composer/use-submit-post";

/**
 * Default-exported full-page composer. Registered with `App.tsx`'s root
 * stack as the `compose` route.
 */
export default function Compose() {
  const theme = useTheme();
  const navigation = useNavigation();
  const platformUser = usePlatformUser();
  const { user } = useUser();
  const [draft, setDraft] = useState<PostDraft>(emptyDraft);
  const { pickPictures } = useImagePicker();
  const { resolve } = useLinkResolver();
  const { submit, submitting, error } = useSubmitPost();

  const author = useMemo(
    () =>
      platformUser
        ? platformUserToProfileProps(
            platformUser,
            user?.imageUrl,
            user?.id,
          )
        : null,
    [platformUser, user?.imageUrl, user?.id],
  );

  useDraftLinkExtraction({ draft, onChange: setDraft, resolve });

  const handleSubmit = async () => {
    const ok = await submit(draft);
    if (ok) navigation.goBack();
  };

  if (!author) {
    return (
      <Page>
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={theme.fgMuted} />
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <Lede>Share a thought, a link, or a photo. Take your time.</Lede>
      <View style={styles.composerWrap}>
        <PostComposer
          author={author}
          value={draft}
          onChange={setDraft}
          onSubmit={handleSubmit}
          onCancel={() => navigation.goBack()}
          submitting={submitting}
          error={error}
          autoFocus
          onAddPictures={async () => {
            const picked = await pickPictures(4);
            if (picked.length > 0) {
              setDraft((d) => addPictures(d, picked));
            }
          }}
        />
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
  /**
   * Vertical breathing room around the composer body. The {@link Page}
   * shell already supplies the page padding; this wrapper just adds the
   * gap between the intro lede and the composer block.
   */
  composerWrap: {
    marginTop: 24,
  },
});
